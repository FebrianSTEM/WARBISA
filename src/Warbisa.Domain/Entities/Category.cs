namespace Warbisa.Domain.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WarungId { get; set; }
    public string Name { get; set; } = string.Empty;

    public Warung? Warung { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
