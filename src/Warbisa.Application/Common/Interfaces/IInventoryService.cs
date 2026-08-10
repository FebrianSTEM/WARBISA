using Warbisa.Application.DTOs.Inventory;

namespace Warbisa.Application.Common.Interfaces;

public interface IInventoryService
{
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request);
    Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request);
    Task DeleteCategoryAsync(Guid id);
    Task<List<ProductDto>> GetProductsAsync(string? search = null, Guid? categoryId = null);
    Task<ProductDto?> GetProductBySkuOrBarcodeAsync(string sku);
    Task<ProductDto> CreateProductAsync(CreateProductRequest request);
    Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductRequest request);
    Task<ProductDto> RestockProductAsync(Guid id, RestockProductRequest request);
    Task<ProductDto> AdjustStockAsync(Guid id, AdjustStockRequest request);
    Task<List<ProductDto>> GetLowStockProductsAsync();
    Task<List<InventoryTransactionDto>> GetInventoryTransactionsAsync();
}
