namespace Warbisa.Domain.Entities;

public class TransactionItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransactionId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal CostPriceAtSale { get; set; }
    public decimal SellingPriceAtSale { get; set; }
    public decimal Subtotal { get; set; }

    public Transaction? Transaction { get; set; }
    public Product? Product { get; set; }
}
