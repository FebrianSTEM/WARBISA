using Microsoft.EntityFrameworkCore;
using Moq;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.POS;
using Warbisa.Domain.Entities;
using Warbisa.Infrastructure.Persistence;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class POSServiceTests
{
    private (ApplicationDbContext Db, Guid WarungId, Guid UserId, Mock<ICurrentUserService> UserMock, Mock<IMidtransService> MidtransMock) GetSetup()
    {
        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var userMock = new Mock<ICurrentUserService>();
        userMock.Setup(u => u.WarungId).Returns(warungId);
        userMock.Setup(u => u.UserId).Returns(userId);

        var midtransMock = new Mock<IMidtransService>();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new ApplicationDbContext(options, userMock.Object);

        return (db, warungId, userId, userMock, midtransMock);
    }

    [Fact]
    public async Task CashCheckout_ShouldCalculateChangeDeductStockAndSetSettledStatus()
    {
        var (db, warungId, userId, userMock, midtransMock) = GetSetup();
        var posService = new POSService(db, userMock.Object, midtransMock.Object);

        // Seed product
        var product = new Product
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            Sku = "SKU-INDOMIE",
            Name = "Indomie Goreng",
            CostPrice = 2500,
            SellingPrice = 3500,
            StockQuantity = 100,
            MinStockThreshold = 10,
            IsActive = true
        };
        db.Products.Add(product);

        // Seed User
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

        await db.SaveChangesAsync();

        var checkoutReq = new POSCheckoutRequest
        {
            CustomerName = "Budi",
            PaymentMethod = "Cash",
            PaidAmount = 50000,
            Items = new List<POSCheckoutItemRequest>
            {
                new POSCheckoutItemRequest { ProductId = product.Id, Quantity = 10 }
            }
        };

        var tx = await posService.CreateCheckoutTransactionAsync(checkoutReq);

        Assert.NotNull(tx);
        Assert.Equal("Settled", tx.PaymentStatus);
        Assert.Equal(35000, tx.TotalAmount); // 10 * 3500
        Assert.Equal(50000, tx.PaidAmount);
        Assert.Equal(15000, tx.ChangeAmount); // 50000 - 35000

        // Verify product stock deducted in DB
        var updatedProd = await db.Products.FirstAsync(p => p.Id == product.Id);
        Assert.Equal(90, updatedProd.StockQuantity);

        // Verify Snapshotting of CostPrice and SellingPrice
        Assert.Single(tx.Items);
        Assert.Equal(2500, tx.Items[0].CostPriceAtSale);
        Assert.Equal(3500, tx.Items[0].SellingPriceAtSale);
    }

    [Fact]
    public async Task POSCheckout_ShouldThrowException_WhenStockInsufficient()
    {
        var (db, warungId, userId, userMock, midtransMock) = GetSetup();
        var posService = new POSService(db, userMock.Object, midtransMock.Object);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            Sku = "SKU-BERAS",
            Name = "Beras Premium 5kg",
            CostPrice = 60000,
            SellingPrice = 75000,
            StockQuantity = 2, // Only 2 in stock
            MinStockThreshold = 1
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var checkoutReq = new POSCheckoutRequest
        {
            PaymentMethod = "Cash",
            PaidAmount = 300000,
            Items = new List<POSCheckoutItemRequest>
            {
                new POSCheckoutItemRequest { ProductId = product.Id, Quantity = 5 } // Request 5
            }
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => posService.CreateCheckoutTransactionAsync(checkoutReq));
    }
}
