using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Payments;
using Warbisa.Application.DTOs.POS;
using Warbisa.Domain.Entities;

namespace Warbisa.Infrastructure.Services;

public class TransactionEngine : ITransactionEngine
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMidtransService _midtransService;
    private readonly MidtransSettings _settings;

    public TransactionEngine(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMidtransService midtransService,
        IOptions<MidtransSettings> options)
    {
        _context = context;
        _currentUserService = currentUserService;
        _midtransService = midtransService;
        _settings = options.Value;
    }

    private Guid GetCurrentWarungId()
    {
        return _currentUserService.WarungId ?? throw new UnauthorizedAccessException("WarungId tidak ditemukan pada sesi pengguna.");
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new UnauthorizedAccessException("UserId tidak ditemukan pada sesi pengguna.");
    }

    public async Task<TransactionDto> ProcessCheckoutAsync(POSCheckoutRequest request)
    {
        var warungId = GetCurrentWarungId();
        var userId = GetCurrentUserId();

        if (request.Items == null || !request.Items.Any())
        {
            throw new InvalidOperationException("Daftar belanjaan tidak boleh kosong.");
        }

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Where(p => p.WarungId == warungId && productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Produk dengan ID '{item.ProductId}' tidak ditemukan.");
            }

            if (product.StockQuantity < item.Quantity)
            {
                throw new InvalidOperationException($"Stok tidak mencukupi untuk produk '{product.Name}'. Stok tersedia: {product.StockQuantity}, dibutuhkan: {item.Quantity}.");
            }
        }

        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Random.Shared.Next(1000, 9999);
        var invoiceNo = $"INV-{todayStr}-{randomPart}";

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = invoiceNo,
            WarungId = warungId,
            UserId = userId,
            CustomerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Pelanggan Umum" : request.CustomerName.Trim(),
            PaymentMethod = request.PaymentMethod.Trim(),
            PaymentStatus = "Pending",
            TotalAmount = 0.00m,
            PaidAmount = request.PaidAmount,
            ChangeAmount = 0.00m,
            CreatedAt = DateTime.UtcNow
        };

        decimal totalAmount = 0.00m;

        foreach (var itemRequest in request.Items)
        {
            var product = products[itemRequest.ProductId];
            var subtotal = product.SellingPrice * itemRequest.Quantity;
            totalAmount += subtotal;

            var item = new TransactionItem
            {
                Id = Guid.NewGuid(),
                TransactionId = transaction.Id,
                ProductId = product.Id,
                Quantity = itemRequest.Quantity,
                CostPriceAtSale = product.CostPrice,
                SellingPriceAtSale = product.SellingPrice,
                Subtotal = subtotal
            };

            transaction.Items.Add(item);
        }

        transaction.TotalAmount = totalAmount;
        var isCash = string.Equals(request.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase);

        if (isCash)
        {
            if (request.PaidAmount < totalAmount)
            {
                throw new InvalidOperationException($"Uang pembayaran tunai ({request.PaidAmount:N0}) kurang dari total belanja ({totalAmount:N0}).");
            }

            transaction.ChangeAmount = request.PaidAmount - totalAmount;
            transaction.PaymentStatus = "Settled";
            transaction.SettledAt = DateTime.UtcNow;
        }
        else
        {
            transaction.MidtransOrderId = invoiceNo;
            var midtransSnap = await _midtransService.CreateSnapTransactionAsync(transaction);
            transaction.MidtransSnapToken = midtransSnap.Token;
        }

        // Deduct stock immediately to reserve inventory for both Cash and QRIS/Transfer
        foreach (var itemRequest in request.Items)
        {
            var product = products[itemRequest.ProductId];
            product.StockQuantity -= itemRequest.Quantity;

            var inventoryTx = new InventoryTransaction
            {
                Id = Guid.NewGuid(),
                WarungId = warungId,
                ProductId = product.Id,
                Type = "Sale",
                QuantityChange = -itemRequest.Quantity,
                StockAfter = product.StockQuantity,
                Notes = $"Penjualan POS #{invoiceNo}",
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryTransactions.Add(inventoryTx);
        }

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return await GetTransactionByIdAsync(transaction.Id) 
            ?? throw new InvalidOperationException("Gagal membuat transaksi.");
    }

    public async Task<List<TransactionDto>> GetTransactionsAsync()
    {
        var warungId = GetCurrentWarungId();
        return await _context.Transactions
            .Include(t => t.User)
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
            .Where(t => t.WarungId == warungId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => MapToTransactionDto(t))
            .ToListAsync();
    }

    public async Task<TransactionDto?> GetTransactionByIdAsync(Guid id)
    {
        var warungId = GetCurrentWarungId();
        var transaction = await _context.Transactions
            .Include(t => t.User)
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(t => t.Id == id && t.WarungId == warungId);

        return transaction == null ? null : MapToTransactionDto(transaction);
    }

    public async Task<bool> ProcessPaymentWebhookAsync(MidtransWebhookPayload payload)
    {
        if (!_midtransService.VerifySignature(payload))
        {
            throw new UnauthorizedAccessException("Signature hash Midtrans tidak valid.");
        }

        var transaction = await _context.Transactions
            .IgnoreQueryFilters()
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.InvoiceNo == payload.OrderId || t.MidtransOrderId == payload.OrderId);

        if (transaction == null)
        {
            throw new KeyNotFoundException($"Transaksi dengan Order ID '{payload.OrderId}' tidak ditemukan.");
        }

        if (string.Equals(transaction.PaymentStatus, "Settled", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var status = payload.TransactionStatus?.ToLowerInvariant();
        var fraud = payload.FraudStatus?.ToLowerInvariant();

        if (status == "settlement" || (status == "capture" && fraud == "accept"))
        {
            transaction.PaymentStatus = "Settled";
            transaction.PaidAmount = transaction.TotalAmount;
            transaction.SettledAt = DateTime.UtcNow;
        }
        else if (status == "expire" || status == "cancel" || status == "deny")
        {
            var isExpired = status == "expire";
            transaction.PaymentStatus = isExpired ? "Expired" : "Failed";

            // Restore reserved stock upon cancellation or expiration
            foreach (var item in transaction.Items)
            {
                var product = await _context.Products
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                if (product != null)
                {
                    product.StockQuantity += item.Quantity;

                    var inventoryTx = new InventoryTransaction
                    {
                        Id = Guid.NewGuid(),
                        WarungId = transaction.WarungId,
                        ProductId = product.Id,
                        Type = "Adjustment",
                        QuantityChange = item.Quantity,
                        StockAfter = product.StockQuantity,
                        Notes = $"Restorasi stok pembatalan/expired #{transaction.InvoiceNo}",
                        CreatedByUserId = transaction.UserId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.InventoryTransactions.Add(inventoryTx);
                }
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static TransactionDto MapToTransactionDto(Transaction t)
    {
        return new TransactionDto
        {
            Id = t.Id,
            InvoiceNo = t.InvoiceNo,
            WarungId = t.WarungId,
            UserId = t.UserId,
            UserName = t.User != null ? t.User.FullName : string.Empty,
            CustomerName = t.CustomerName,
            PaymentMethod = t.PaymentMethod,
            PaymentStatus = t.PaymentStatus,
            TotalAmount = t.TotalAmount,
            PaidAmount = t.PaidAmount,
            ChangeAmount = t.ChangeAmount,
            MidtransSnapToken = t.MidtransSnapToken,
            MidtransOrderId = t.MidtransOrderId,
            SettledAt = t.SettledAt,
            CreatedAt = t.CreatedAt,
            Items = t.Items.Select(i => new TransactionItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product != null ? i.Product.Name : string.Empty,
                Sku = i.Product != null ? i.Product.Sku : string.Empty,
                Quantity = i.Quantity,
                CostPriceAtSale = i.CostPriceAtSale,
                SellingPriceAtSale = i.SellingPriceAtSale,
                Subtotal = i.Subtotal
            }).ToList()
        };
    }
}
