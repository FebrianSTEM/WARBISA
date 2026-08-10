namespace Warbisa.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WarungId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "Pcs"; // 'Pcs', 'Kg', 'Pack', 'Botol'
    public decimal CostPrice { get; set; } = 0.00m;
    public decimal SellingPrice { get; set; } = 0.00m;
    public int StockQuantity { get; set; } = 0;
    public int MinStockThreshold { get; set; } = 5;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Warung? Warung { get; set; }
    public Category? Category { get; set; }
    public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
    public ICollection<TransactionItem> TransactionItems { get; set; } = new List<TransactionItem>();
}
