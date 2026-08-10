using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Payments;
using Warbisa.Application.DTOs.POS;
using Warbisa.Domain.Entities;
using Warbisa.Infrastructure.Persistence;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class TransactionEngineTests
{
    private (ApplicationDbContext Db, TransactionEngine Engine, Guid WarungId, Guid UserId, MidtransSettings Settings) GetSetup()
    {
        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var userMock = new Mock<ICurrentUserService>();
        userMock.Setup(u => u.WarungId).Returns(warungId);
        userMock.Setup(u => u.UserId).Returns(userId);

        var midtransMock = new Mock<IMidtransService>();
        midtransMock.Setup(m => m.CreateSnapTransactionAsync(It.IsAny<Transaction>()))
            .ReturnsAsync(new MidtransSnapResponse { Token = "SNAP-TEST-TOKEN", RedirectUrl = "https://midtrans.test" });
        midtransMock.Setup(m => m.VerifySignature(It.IsAny<MidtransWebhookPayload>()))
            .Returns<MidtransWebhookPayload>(p => p != null && !string.IsNullOrEmpty(p.SignatureKey));

        var settings = new MidtransSettings { ServerKey = "SB-Mid-server-TEST_KEY_12345" };

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new ApplicationDbContext(options, userMock.Object);
        var engine = new TransactionEngine(db, userMock.Object, midtransMock.Object, Options.Create(settings));

        return (db, engine, warungId, userId, settings);
    }

    [Fact]
    public async Task ProcessCheckoutAsync_CashPayment_ShouldSettleImmediatelyAndDeductStock()
    {
        var (db, engine, warungId, userId, settings) = GetSetup();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            Sku = "SKU-CASH",
            Name = "Minyak Bimoli 1L",
            CostPrice = 14000,
            SellingPrice = 18000,
            StockQuantity = 20,
            IsActive = true
        };
        db.Users.Add(new User
        {
            Id = userId,
            WarungId = warungId,
            RoleId = 2,
            Username = "kasir1",
            Email = "kasir@warung.com",
            PasswordHash = "hash",
            FullName = "Kasir Satu"
        });

        db.Products.Add(product);
        await db.SaveChangesAsync();

        var checkoutReq = new POSCheckoutRequest
        {
            CustomerName = "Budi",
            PaymentMethod = "Cash",
            PaidAmount = 50000,
            Items = new List<POSCheckoutItemRequest>
            {
                new POSCheckoutItemRequest { ProductId = product.Id, Quantity = 2 }
            }
        };

        var tx = await engine.ProcessCheckoutAsync(checkoutReq);

        Assert.NotNull(tx);
        Assert.Equal("Settled", tx.PaymentStatus);
        Assert.Equal(36000, tx.TotalAmount);
        Assert.Equal(14000, tx.ChangeAmount);

        var updatedProd = await db.Products.FirstAsync(p => p.Id == product.Id);
        Assert.Equal(18, updatedProd.StockQuantity);
    }

    [Fact]
    public async Task ProcessPaymentWebhookAsync_Expiration_ShouldRestoreReservedStock()
    {
        var (db, engine, warungId, userId, settings) = GetSetup();

        var productId = Guid.NewGuid();
        var product = new Product
        {
            Id = productId,
            WarungId = warungId,
            Sku = "SKU-QRIS",
            Name = "Kopi Kapal Api",
            CostPrice = 10000,
            SellingPrice = 15000,
            StockQuantity = 8, // Stock reserved down from 10 -> 8
            IsActive = true
        };
        db.Products.Add(product);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = "INV-QRIS-001",
            WarungId = warungId,
            UserId = userId,
            PaymentMethod = "QRIS",
            PaymentStatus = "Pending",
            TotalAmount = 30000,
            MidtransOrderId = "INV-QRIS-001",
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

        var payload = new MidtransWebhookPayload
        {
            OrderId = "INV-QRIS-001",
            StatusCode = "200",
            GrossAmount = "30000.00",
            SignatureKey = "VALID_SIGNATURE",
            TransactionStatus = "expire"
        };

        var success = await engine.ProcessPaymentWebhookAsync(payload);
        Assert.True(success);

        var updatedTx = await db.Transactions.FirstAsync(t => t.Id == transaction.Id);
        Assert.Equal("Expired", updatedTx.PaymentStatus);

        var restoredProd = await db.Products.FirstAsync(p => p.Id == productId);
        Assert.Equal(10, restoredProd.StockQuantity); // 8 -> 10 restored!
    }
}
