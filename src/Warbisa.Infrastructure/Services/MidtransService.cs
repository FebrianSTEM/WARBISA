using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Payments;
using Warbisa.Domain.Entities;

namespace Warbisa.Infrastructure.Services;

public class MidtransService : IMidtransService
{
    private readonly IApplicationDbContext _context;
    private readonly MidtransSettings _settings;

    public MidtransService(
        IApplicationDbContext context,
        IOptions<MidtransSettings> options)
    {
        _context = context;
        _settings = options.Value;
    }

    public Task<MidtransSnapResponse> CreateSnapTransactionAsync(Transaction transaction)
    {
        var snapToken = $"SNAP-{Guid.NewGuid().ToString("N").Substring(0, 16).ToUpper()}";
        var redirectUrl = $"https://app.sandbox.midtrans.com/snap/v2/vtweb/{snapToken}";

        return Task.FromResult(new MidtransSnapResponse
        {
            Token = snapToken,
            RedirectUrl = redirectUrl
        });
    }

    public bool VerifySignature(MidtransWebhookPayload payload)
    {
        if (payload == null ||
            string.IsNullOrWhiteSpace(payload.OrderId) ||
            string.IsNullOrWhiteSpace(payload.StatusCode) ||
            string.IsNullOrWhiteSpace(payload.GrossAmount) ||
            string.IsNullOrWhiteSpace(payload.SignatureKey))
        {
            return false;
        }

        // Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
        var rawString = $"{payload.OrderId}{payload.StatusCode}{payload.GrossAmount}{_settings.ServerKey}";

        using var sha512 = SHA512.Create();
        var bytes = Encoding.UTF8.GetBytes(rawString);
        var hashBytes = sha512.ComputeHash(bytes);
        var calculatedHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        return string.Equals(calculatedHash, payload.SignatureKey.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    public async Task<bool> ProcessWebhookCallbackAsync(MidtransWebhookPayload payload)
    {
        if (!VerifySignature(payload))
        {
            throw new UnauthorizedAccessException("Signature hash Midtrans tidak valid.");
        }

        // Find transaction with IgnoreQueryFilters because webhook is tenant-agnostic
        var transaction = await _context.Transactions
            .IgnoreQueryFilters()
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.InvoiceNo == payload.OrderId || t.MidtransOrderId == payload.OrderId);

        if (transaction == null)
        {
            throw new KeyNotFoundException($"Transaksi dengan Order ID '{payload.OrderId}' tidak ditemukan.");
        }

        // IDEMPOTENCY CHECK: If already Settled, return true without double stock deduction
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
}
