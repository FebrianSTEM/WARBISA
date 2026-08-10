namespace Warbisa.Application.DTOs.POS;

public class POSCheckoutItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}

public class POSCheckoutRequest
{
    public string? CustomerName { get; set; } = "Pelanggan Umum";
    public string PaymentMethod { get; set; } = "Cash"; // 'Cash', 'QRIS', 'Transfer'
    public decimal PaidAmount { get; set; } = 0.00m;
    public List<POSCheckoutItemRequest> Items { get; set; } = new List<POSCheckoutItemRequest>();
}

public class TransactionItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal CostPriceAtSale { get; set; }
    public decimal SellingPriceAtSale { get; set; }
    public decimal Subtotal { get; set; }
}

public class TransactionDto
{
    public Guid Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public Guid WarungId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal ChangeAmount { get; set; }
    public string? MidtransSnapToken { get; set; }
    public string? MidtransOrderId { get; set; }
    public DateTime? SettledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TransactionItemDto> Items { get; set; } = new List<TransactionItemDto>();
}
