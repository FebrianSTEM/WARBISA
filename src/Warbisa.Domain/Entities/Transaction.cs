namespace Warbisa.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string InvoiceNo { get; set; } = string.Empty;
    public Guid WarungId { get; set; }
    public Guid UserId { get; set; }
    public string CustomerName { get; set; } = "Pelanggan Umum";
    public string PaymentMethod { get; set; } = "Cash"; // 'Cash', 'QRIS', 'Transfer'
    public string PaymentStatus { get; set; } = "Pending"; // 'Pending', 'Settled', 'Expired', 'Failed'
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; } = 0.00m;
    public decimal ChangeAmount { get; set; } = 0.00m;
    public string? MidtransSnapToken { get; set; }
    public string? MidtransOrderId { get; set; }
    public DateTime? SettledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Warung? Warung { get; set; }
    public User? User { get; set; }
    public ICollection<TransactionItem> Items { get; set; } = new List<TransactionItem>();
}
