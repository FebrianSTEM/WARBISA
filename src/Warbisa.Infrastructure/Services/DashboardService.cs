using Microsoft.EntityFrameworkCore;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Dashboard;

namespace Warbisa.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DashboardService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<DashboardAnalyticsResponse> GetAnalyticsAsync(string frequency)
    {
        var freq = string.IsNullOrWhiteSpace(frequency) ? "daily" : frequency.Trim().ToLower();

        var now = DateTime.UtcNow;
        DateTime startDate;

        switch (freq)
        {
            case "weekly":
                startDate = now.Date.AddDays(-7);
                break;
            case "monthly":
                startDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                break;
            case "yearly":
                startDate = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                break;
            case "daily":
            default:
                freq = "daily";
                startDate = now.Date;
                break;
        }

        var warungId = _currentUserService.WarungId ?? throw new UnauthorizedAccessException("WarungId tidak ditemukan.");

        var settledQuery = _context.Transactions
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.Category)
            .Where(t => t.WarungId == warungId && t.PaymentStatus == "Settled" && t.SettledAt.HasValue && t.SettledAt.Value >= startDate);

        var transactions = await settledQuery.ToListAsync();

        var grossSales = transactions.Sum(t => t.TotalAmount);

        var netRevenue = transactions
            .SelectMany(t => t.Items)
            .Sum(i => (i.SellingPriceAtSale - i.CostPriceAtSale) * i.Quantity);

        var totalTx = transactions.Count;

        // Payment Method Breakdown
        var paymentGroups = transactions
            .GroupBy(t => t.PaymentMethod)
            .Select(g => new PaymentMethodBreakdownDto
            {
                Method = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(t => t.TotalAmount),
                Percentage = totalTx > 0 ? Math.Round((double)g.Count() / totalTx * 100.0, 2) : 0.0
            })
            .OrderByDescending(p => p.TotalAmount)
            .ToList();

        // Top 10 Revenue Products
        var topProducts = transactions
            .SelectMany(t => t.Items)
            .GroupBy(i => new { i.ProductId, ProductName = i.Product != null ? i.Product.Name : "Produk", Sku = i.Product != null ? i.Product.Sku : "" })
            .Select(g => new TopSellingProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                Sku = g.Key.Sku,
                TotalQuantitySold = g.Sum(i => i.Quantity),
                TotalRevenue = g.Sum(i => i.Subtotal)
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ThenByDescending(p => p.TotalQuantitySold)
            .Take(10)
            .ToList();

        // Top 5 Categories
        var totalQtySold = transactions.SelectMany(t => t.Items).Sum(i => i.Quantity);
        var topCategories = transactions
            .SelectMany(t => t.Items)
            .GroupBy(i => i.Product != null && i.Product.Category != null && !string.IsNullOrWhiteSpace(i.Product.Category.Name) ? i.Product.Category.Name : "Umum")
            .Select(g => new TopSellingCategoryDto
            {
                CategoryName = g.Key,
                TotalQuantitySold = g.Sum(i => i.Quantity),
                TotalRevenue = g.Sum(i => i.Subtotal),
                Percentage = totalQtySold > 0 ? Math.Round((double)g.Sum(i => i.Quantity) / totalQtySold * 100.0, 2) : 0.0
            })
            .OrderByDescending(c => c.TotalQuantitySold)
            .ThenByDescending(c => c.TotalRevenue)
            .Take(5)
            .ToList();

        // Peak Buying Hours (24 hours distribution)
        var hourlyMap = transactions
            .GroupBy(t => (t.SettledAt ?? t.CreatedAt).Hour)
            .ToDictionary(g => g.Key, g => new { Count = g.Count(), Sales = g.Sum(t => t.TotalAmount) });

        var peakHours = Enumerable.Range(0, 24).Select(hour => new HourlyBuyingFrequencyDto
        {
            Hour = hour,
            HourLabel = $"{hour:D2}:00 - {(hour + 1) % 24:D2}:00",
            TransactionCount = hourlyMap.TryGetValue(hour, out var val) ? val.Count : 0,
            TotalSales = hourlyMap.TryGetValue(hour, out val) ? val.Sales : 0.00m
        }).ToList();

        // Low stock count
        var lowStockCount = await _context.Products
            .CountAsync(p => p.WarungId == warungId && p.IsActive && p.StockQuantity <= p.MinStockThreshold);

        return new DashboardAnalyticsResponse
        {
            Frequency = freq,
            GrossSales = grossSales,
            NetRevenue = netRevenue,
            TotalTransactions = totalTx,
            LowStockAlertCount = lowStockCount,
            PaymentMethods = paymentGroups,
            TopSellingProducts = topProducts,
            TopSellingCategories = topCategories,
            PeakBuyingHours = peakHours
        };
    }
}
