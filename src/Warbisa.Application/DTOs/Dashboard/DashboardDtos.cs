namespace Warbisa.Application.DTOs.Dashboard;

public class PaymentMethodBreakdownDto
{
    public string Method { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
    public double Percentage { get; set; }
}

public class TopSellingProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int TotalQuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class DashboardAnalyticsResponse
{
    public string Frequency { get; set; } = "daily"; // 'daily', 'monthly', 'yearly'
    public decimal GrossSales { get; set; }
    public decimal NetRevenue { get; set; }
    public int TotalTransactions { get; set; }
    public int LowStockAlertCount { get; set; }
    public List<PaymentMethodBreakdownDto> PaymentMethods { get; set; } = new List<PaymentMethodBreakdownDto>();
    public List<TopSellingProductDto> TopSellingProducts { get; set; } = new List<TopSellingProductDto>();
}
