using Microsoft.EntityFrameworkCore;
using Warbisa.Domain.Entities;
using Warbisa.Infrastructure.Persistence;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class DashboardServiceTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetAnalytics_ShouldCalculateGrossSalesAndNetRevenueCorrectly()
    {
        var db = GetInMemoryDbContext();
        var dashboardService = new DashboardService(db);

        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var prodId1 = Guid.NewGuid();
        var prodId2 = Guid.NewGuid();

        var p1 = new Product { Id = prodId1, WarungId = warungId, Sku = "P1", Name = "Gula Pasir 1kg", CostPrice = 12000, SellingPrice = 16000, StockQuantity = 10, MinStockThreshold = 15 };
        var p2 = new Product { Id = prodId2, WarungId = warungId, Sku = "P2", Name = "Minyak Goreng 1L", CostPrice = 14000, SellingPrice = 18000, StockQuantity = 20, MinStockThreshold = 5 };

        db.Products.AddRange(p1, p2);

        // Transaction 1: Cash payment (2 x P1 = 32,000 gross. Profit = (16000-12000)*2 = 8,000)
        var tx1 = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = "INV-001",
            WarungId = warungId,
            UserId = userId,
            PaymentMethod = "Cash",
            PaymentStatus = "Settled",
            TotalAmount = 32000,
            SettledAt = DateTime.UtcNow
        };
        tx1.Items.Add(new TransactionItem { Id = Guid.NewGuid(), TransactionId = tx1.Id, ProductId = prodId1, Quantity = 2, CostPriceAtSale = 12000, SellingPriceAtSale = 16000, Subtotal = 32000 });

        // Transaction 2: QRIS payment (1 x P2 = 18,000 gross. Profit = (18000-14000)*1 = 4,000)
        var tx2 = new Transaction
        {
            Id = Guid.NewGuid(),
            InvoiceNo = "INV-002",
            WarungId = warungId,
            UserId = userId,
            PaymentMethod = "QRIS",
            PaymentStatus = "Settled",
            TotalAmount = 18000,
            SettledAt = DateTime.UtcNow
        };
        tx2.Items.Add(new TransactionItem { Id = Guid.NewGuid(), TransactionId = tx2.Id, ProductId = prodId2, Quantity = 1, CostPriceAtSale = 14000, SellingPriceAtSale = 18000, Subtotal = 18000 });

        db.Transactions.AddRange(tx1, tx2);
        await db.SaveChangesAsync();

        var analytics = await dashboardService.GetAnalyticsAsync("daily");

        Assert.NotNull(analytics);
        Assert.Equal(50000, analytics.GrossSales); // 32000 + 18000
        Assert.Equal(12000, analytics.NetRevenue); // 8000 + 4000
        Assert.Equal(2, analytics.TotalTransactions);
        Assert.Equal(1, analytics.LowStockAlertCount); // P1 stock=10 <= threshold=15

        Assert.Equal(2, analytics.PaymentMethods.Count);
        Assert.Equal(2, analytics.TopSellingProducts.Count);
    }
}
