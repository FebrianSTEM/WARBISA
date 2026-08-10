using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Warbisa.Application.DTOs.Payments;
using Warbisa.Domain.Entities;
using Warbisa.Infrastructure.Persistence;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class MidtransServiceTests
{
    private (ApplicationDbContext Db, MidtransService Service, MidtransSettings Settings) GetSetup()
    {
        var settings = new MidtransSettings
        {
            ServerKey = "SB-Mid-server-TEST_KEY_12345"
        };

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new ApplicationDbContext(options);
        var service = new MidtransService(db, Options.Create(settings));

        return (db, service, settings);
    }

    private string ComputeSha512(string raw)
    {
        using var sha512 = SHA512.Create();
        var bytes = Encoding.UTF8.GetBytes(raw);
        var hashBytes = sha512.ComputeHash(bytes);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    [Fact]
    public void VerifySignature_ShouldReturnFalse_WhenMandatoryFieldsMissing()
    {
        var (db, service, settings) = GetSetup();

        Assert.False(service.VerifySignature(null!));
        Assert.False(service.VerifySignature(new MidtransWebhookPayload { OrderId = "123", StatusCode = "200" })); // GrossAmount & Signature missing
    }

    [Fact]
    public void VerifySignature_ShouldReturnTrue_ForValidHash()
    {
        var (db, service, settings) = GetSetup();

        var orderId = "INV-20260804-1001";
        var statusCode = "200";
        var grossAmount = "50000.00";
        var validHash = ComputeSha512($"{orderId}{statusCode}{grossAmount}{settings.ServerKey}");

        var payload = new MidtransWebhookPayload
        {
            OrderId = orderId,
            StatusCode = statusCode,
            GrossAmount = grossAmount,
            SignatureKey = validHash,
            TransactionStatus = "settlement"
        };

        var isValid = service.VerifySignature(payload);
        Assert.True(isValid);
    }

    [Fact]
    public async Task ProcessWebhookCallback_ShouldUpdatePaidAmount_AndKeepStockReserved()
    {
        var (db, service, settings) = GetSetup();

        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        // Product with stock = 0 (already deducted 2 items during POS checkout creation from 2 -> 0)
        var product = new Product
        {
            Id = productId,
            WarungId = warungId,
            Sku = "SKU-LIMITED",
            Name = "Limited Item",
            CostPrice = 10000,
            SellingPrice = 15000,
            StockQuantity = 0, // Stock reserved/deducted at POS checkout creation
            IsActive = true
        };
        db.Products.Add(product);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = "INV-20260804-LIMITED",
            WarungId = warungId,
            UserId = userId,
            PaymentMethod = "QRIS",
            PaymentStatus = "Pending",
            TotalAmount = 30000,
            PaidAmount = 0, // Pending
            MidtransOrderId = "INV-20260804-LIMITED",
            CreatedAt = DateTime.UtcNow
        };

        transaction.Items.Add(new TransactionItem
        {
            Id = Guid.NewGuid(),
            TransactionId = transaction.Id,
            ProductId = productId,
            Quantity = 2,
            CostPriceAtSale = 10000,
            SellingPriceAtSale = 15000,
            Subtotal = 30000
        });

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();

        var validHash = ComputeSha512($"INV-20260804-LIMITED20030000.00{settings.ServerKey}");

        var payload = new MidtransWebhookPayload
        {
            OrderId = "INV-20260804-LIMITED",
            StatusCode = "200",
            GrossAmount = "30000.00",
            SignatureKey = validHash,
            TransactionStatus = "settlement"
        };

        var result = await service.ProcessWebhookCallbackAsync(payload);
        Assert.True(result);

        var updatedTx = await db.Transactions.FirstAsync(t => t.Id == transaction.Id);
        Assert.Equal("Settled", updatedTx.PaymentStatus);
        Assert.Equal(30000, updatedTx.PaidAmount);

        var updatedProd = await db.Products.FirstAsync(p => p.Id == productId);
        Assert.Equal(0, updatedProd.StockQuantity); // Maintained reserved stock
    }

    [Fact]
    public async Task ProcessWebhookCallback_ShouldBeIdempotent_OnDuplicatePayload()
    {
        var (db, service, settings) = GetSetup();

        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        var product = new Product
        {
            Id = productId,
            WarungId = warungId,
            Sku = "SKU-MINYAK",
            Name = "Minyak Bimoli 2L",
            CostPrice = 28000,
            SellingPrice = 34000,
            StockQuantity = 48, // Already deducted 2 items at checkout creation (50 -> 48)
            IsActive = true
        };
        db.Products.Add(product);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = "INV-20260804-9999",
            WarungId = warungId,
            UserId = userId,
            PaymentMethod = "QRIS",
            PaymentStatus = "Pending",
            TotalAmount = 34000,
            MidtransOrderId = "INV-20260804-9999",
            CreatedAt = DateTime.UtcNow
        };

        transaction.Items.Add(new TransactionItem
        {
            Id = Guid.NewGuid(),
            TransactionId = transaction.Id,
            ProductId = productId,
            Quantity = 2,
            CostPriceAtSale = 28000,
            SellingPriceAtSale = 34000,
            Subtotal = 68000
        });

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();

        var validHash = ComputeSha512($"INV-20260804-999920034000.00{settings.ServerKey}");

        var payload = new MidtransWebhookPayload
        {
            OrderId = "INV-20260804-9999",
            StatusCode = "200",
            GrossAmount = "34000.00",
            SignatureKey = validHash,
            TransactionStatus = "settlement"
        };

        // First callback execution -> Settlement
        var firstResult = await service.ProcessWebhookCallbackAsync(payload);
        Assert.True(firstResult);

        var updatedProd = await db.Products.FirstAsync(p => p.Id == productId);
        Assert.Equal(48, updatedProd.StockQuantity);

        var updatedTx = await db.Transactions.FirstAsync(t => t.Id == transaction.Id);
        Assert.Equal("Settled", updatedTx.PaymentStatus);

        // Second duplicate callback execution -> Idempotent response without double stock deduction!
        var secondResult = await service.ProcessWebhookCallbackAsync(payload);
        Assert.True(secondResult);

        var productAfterDuplicate = await db.Products.FirstAsync(p => p.Id == productId);
        Assert.Equal(48, productAfterDuplicate.StockQuantity);
    }

    [Fact]
    public async Task ProcessWebhookCallback_ShouldRestoreStock_WhenPaymentExpiredOrCancelled()
    {
        var (db, service, settings) = GetSetup();

        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        var product = new Product
        {
            Id = productId,
            WarungId = warungId,
            Sku = "SKU-EXPIRE",
            Name = "Expired Item",
            CostPrice = 5000,
            SellingPrice = 8000,
            StockQuantity = 8, // Was 10, deducted 2 during checkout creation (10 -> 8)
            IsActive = true
        };
        db.Products.Add(product);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = "INV-EXPIRED-001",
            WarungId = warungId,
            UserId = userId,
            PaymentMethod = "QRIS",
            PaymentStatus = "Pending",
            TotalAmount = 16000,
            MidtransOrderId = "INV-EXPIRED-001",
            CreatedAt = DateTime.UtcNow
        };

        transaction.Items.Add(new TransactionItem
        {
            Id = Guid.NewGuid(),
            TransactionId = transaction.Id,
            ProductId = productId,
            Quantity = 2,
            CostPriceAtSale = 5000,
            SellingPriceAtSale = 8000,
            Subtotal = 16000
        });

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();

        var validHash = ComputeSha512($"INV-EXPIRED-00120016000.00{settings.ServerKey}");

        var payload = new MidtransWebhookPayload
        {
            OrderId = "INV-EXPIRED-001",
            StatusCode = "200",
            GrossAmount = "16000.00",
            SignatureKey = validHash,
            TransactionStatus = "expire"
        };

        var result = await service.ProcessWebhookCallbackAsync(payload);
        Assert.True(result);

        var updatedTx = await db.Transactions.FirstAsync(t => t.Id == transaction.Id);
        Assert.Equal("Expired", updatedTx.PaymentStatus);

        var restoredProd = await db.Products.FirstAsync(p => p.Id == productId);
        Assert.Equal(10, restoredProd.StockQuantity); // Stock restored from 8 -> 10!
    }
}
