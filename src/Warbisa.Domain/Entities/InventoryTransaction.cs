namespace Warbisa.Domain.Entities;

public class InventoryTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WarungId { get; set; }
    public Guid ProductId { get; set; }
    public string Type { get; set; } = string.Empty; // 'Restock', 'Sale', 'Adjustment'
    public int QuantityChange { get; set; }
    public int StockAfter { get; set; }
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Warung? Warung { get; set; }
    public Product? Product { get; set; }
    public User? CreatedByUser { get; set; }
}
