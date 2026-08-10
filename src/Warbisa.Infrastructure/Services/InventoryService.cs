using Microsoft.EntityFrameworkCore;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Inventory;
using Warbisa.Domain.Entities;

namespace Warbisa.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public InventoryService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    private Guid GetCurrentWarungId()
    {
        return _currentUserService.WarungId ?? throw new UnauthorizedAccessException("WarungId tidak ditemukan pada sesi pengguna.");
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        return await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                WarungId = c.WarungId,
                Name = c.Name
            })
            .ToListAsync();
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request)
    {
        var warungId = GetCurrentWarungId();
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower());

        if (exists)
        {
            throw new InvalidOperationException($"Kategori '{request.Name}' sudah ada.");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            Name = request.Name.Trim()
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            WarungId = category.WarungId,
            Name = category.Name
        };
    }

    public async Task<List<ProductDto>> GetProductsAsync(string? search = null, Guid? categoryId = null)
    {
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Sku.ToLower().Contains(term) ||
                (p.Barcode != null && p.Barcode.ToLower().Contains(term)));
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => MapToProductDto(p))
            .ToListAsync();
    }

    public async Task<ProductDto?> GetProductBySkuOrBarcodeAsync(string sku)
    {
        if (string.IsNullOrWhiteSpace(sku)) return null;

        var term = sku.Trim().ToLower();
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Sku.ToLower() == term || (p.Barcode != null && p.Barcode.ToLower() == term));

        return product == null ? null : MapToProductDto(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequest request)
    {
        var warungId = GetCurrentWarungId();

        var skuExists = await _context.Products
            .AnyAsync(p => p.Sku.ToLower() == request.Sku.Trim().ToLower());

        if (skuExists)
        {
            throw new InvalidOperationException($"Produk dengan SKU '{request.Sku}' sudah terdaftar.");
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            CategoryId = request.CategoryId,
            Sku = request.Sku.Trim(),
            Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim(),
            Name = request.Name.Trim(),
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Pcs" : request.Unit.Trim(),
            CostPrice = request.CostPrice,
            SellingPrice = request.SellingPrice,
            StockQuantity = request.StockQuantity,
            MinStockThreshold = request.MinStockThreshold,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);

        if (request.StockQuantity > 0)
        {
            var inventoryTx = new InventoryTransaction
            {
                Id = Guid.NewGuid(),
                WarungId = warungId,
                ProductId = product.Id,
                Type = "Restock",
                QuantityChange = request.StockQuantity,
                StockAfter = request.StockQuantity,
                Notes = "Stok Awal Pendaftaran Produk",
                CreatedByUserId = _currentUserService.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryTransactions.Add(inventoryTx);
        }

        await _context.SaveChangesAsync();

        // Reload category name if category ID is present
        if (product.CategoryId.HasValue)
        {
            await _context.Products.Entry(product).Reference(p => p.Category).LoadAsync();
        }

        return MapToProductDto(product);
    }

    public async Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductRequest request)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            throw new KeyNotFoundException("Produk tidak ditemukan.");
        }

        var skuExists = await _context.Products
            .AnyAsync(p => p.Id != id && p.Sku.ToLower() == request.Sku.Trim().ToLower());

        if (skuExists)
        {
            throw new InvalidOperationException($"Produk dengan SKU '{request.Sku}' sudah terdaftar.");
        }

        product.CategoryId = request.CategoryId;
        product.Sku = request.Sku.Trim();
        product.Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim();
        product.Name = request.Name.Trim();
        product.Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Pcs" : request.Unit.Trim();
        product.CostPrice = request.CostPrice;
        product.SellingPrice = request.SellingPrice;
        product.MinStockThreshold = request.MinStockThreshold;

        await _context.SaveChangesAsync();

        return MapToProductDto(product);
    }

    public async Task<ProductDto> RestockProductAsync(Guid id, RestockProductRequest request)
    {
        var warungId = GetCurrentWarungId();
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            throw new KeyNotFoundException("Produk tidak ditemukan.");
        }

        product.StockQuantity += request.Quantity;

        var inventoryTx = new InventoryTransaction
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            ProductId = product.Id,
            Type = "Restock",
            QuantityChange = request.Quantity,
            StockAfter = product.StockQuantity,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? "Restock barang" : request.Notes.Trim(),
            CreatedByUserId = _currentUserService.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryTransactions.Add(inventoryTx);
        await _context.SaveChangesAsync();

        return MapToProductDto(product);
    }

    public async Task<ProductDto> AdjustStockAsync(Guid id, AdjustStockRequest request)
    {
        var warungId = GetCurrentWarungId();
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            throw new KeyNotFoundException("Produk tidak ditemukan.");
        }

        var newStock = product.StockQuantity + request.QuantityChange;
        if (newStock < 0)
        {
            throw new InvalidOperationException($"Penyesuaian stok gagal: stok menjadi negatif ({newStock}).");
        }

        product.StockQuantity = newStock;

        var inventoryTx = new InventoryTransaction
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            ProductId = product.Id,
            Type = "Adjustment",
            QuantityChange = request.QuantityChange,
            StockAfter = product.StockQuantity,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? "Penyesuaian stok manual" : request.Notes.Trim(),
            CreatedByUserId = _currentUserService.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryTransactions.Add(inventoryTx);
        await _context.SaveChangesAsync();

        return MapToProductDto(product);
    }

    public async Task<List<ProductDto>> GetLowStockProductsAsync()
    {
        return await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity <= p.MinStockThreshold)
            .OrderBy(p => p.StockQuantity)
            .Select(p => MapToProductDto(p))
            .ToListAsync();
    }

    public async Task<List<InventoryTransactionDto>> GetInventoryTransactionsAsync()
    {
        return await _context.InventoryTransactions
            .Include(it => it.Product)
            .Include(it => it.CreatedByUser)
            .OrderByDescending(it => it.CreatedAt)
            .Select(it => new InventoryTransactionDto
            {
                Id = it.Id,
                ProductId = it.ProductId,
                ProductName = it.Product != null ? it.Product.Name : string.Empty,
                Sku = it.Product != null ? it.Product.Sku : string.Empty,
                Type = it.Type,
                QuantityChange = it.QuantityChange,
                StockAfter = it.StockAfter,
                Notes = it.Notes,
                CreatedByUserId = it.CreatedByUserId,
                CreatedByUserName = it.CreatedByUser != null ? it.CreatedByUser.FullName : null,
                CreatedAt = it.CreatedAt
            })
            .ToListAsync();
    }

    private static ProductDto MapToProductDto(Product p)
    {
        return new ProductDto
        {
            Id = p.Id,
            WarungId = p.WarungId,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name,
            Sku = p.Sku,
            Barcode = p.Barcode,
            Name = p.Name,
            Unit = p.Unit,
            CostPrice = p.CostPrice,
            SellingPrice = p.SellingPrice,
            StockQuantity = p.StockQuantity,
            MinStockThreshold = p.MinStockThreshold,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt
        };
    }
}
