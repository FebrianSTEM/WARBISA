namespace Warbisa.Application.DTOs.Inventory;

public class CategoryDto
{
    public Guid Id { get; set; }
    public Guid WarungId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}

public class ProductDto
{
    public Guid Id { get; set; }
    public Guid WarungId { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "Pcs";
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int StockQuantity { get; set; }
    public int MinStockThreshold { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateProductRequest
{
    public Guid? CategoryId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "Pcs";
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int StockQuantity { get; set; } = 0;
    public int MinStockThreshold { get; set; } = 5;
}

public class UpdateProductRequest
{
    public Guid? CategoryId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "Pcs";
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int MinStockThreshold { get; set; } = 5;
}

public class RestockProductRequest
{
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}

public class AdjustStockRequest
{
    public int QuantityChange { get; set; }
    public string? Notes { get; set; }
}

public class InventoryTransactionDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int QuantityChange { get; set; }
    public int StockAfter { get; set; }
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
