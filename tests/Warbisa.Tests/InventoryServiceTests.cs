using Microsoft.EntityFrameworkCore;
using Moq;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Inventory;
using Warbisa.Domain.Entities;
using Warbisa.Infrastructure.Persistence;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class InventoryServiceTests
{
    private (ApplicationDbContext Db, Guid WarungId, Mock<ICurrentUserService> UserMock) GetSetup()
    {
        var warungId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var userMock = new Mock<ICurrentUserService>();
        userMock.Setup(u => u.WarungId).Returns(warungId);
        userMock.Setup(u => u.UserId).Returns(userId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new ApplicationDbContext(options, userMock.Object);

        return (db, warungId, userMock);
    }

    [Fact]
    public async Task CreateProductAndScanBySku_ShouldReturnProduct()
    {
        var (db, warungId, userMock) = GetSetup();
        var inventoryService = new InventoryService(db, userMock.Object);

        var request = new CreateProductRequest
        {
            Sku = "SKU-8991001",
            Barcode = "899100100200",
            Name = "Kopi Kapal Api 165g",
            Unit = "Pcs",
            CostPrice = 12000,
            SellingPrice = 15000,
            StockQuantity = 50,
            MinStockThreshold = 10
        };

        var created = await inventoryService.CreateProductAsync(request);

        Assert.NotNull(created);
        Assert.Equal("SKU-8991001", created.Sku);

        // Scan by SKU
        var scannedBySku = await inventoryService.GetProductBySkuOrBarcodeAsync("SKU-8991001");
        Assert.NotNull(scannedBySku);
        Assert.Equal("Kopi Kapal Api 165g", scannedBySku!.Name);

        // Scan by Barcode
        var scannedByBarcode = await inventoryService.GetProductBySkuOrBarcodeAsync("899100100200");
        Assert.NotNull(scannedByBarcode);
        Assert.Equal("Kopi Kapal Api 165g", scannedByBarcode!.Name);
    }

    [Fact]
    public async Task RestockProduct_ShouldIncreaseStockAndLogInventoryTransaction()
    {
        var (db, warungId, userMock) = GetSetup();
        var inventoryService = new InventoryService(db, userMock.Object);

        var prod = new Product
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            Sku = "SKU-TEA",
            Name = "Teh Botol Sosro 450ml",
            Unit = "Botol",
            CostPrice = 3000,
            SellingPrice = 4500,
            StockQuantity = 10,
            MinStockThreshold = 5
        };
        db.Products.Add(prod);
        await db.SaveChangesAsync();

        var restockResult = await inventoryService.RestockProductAsync(prod.Id, new RestockProductRequest
        {
            Quantity = 20,
            Notes = "Restock mingguan"
        });

        Assert.Equal(30, restockResult.StockQuantity);

        var txs = await inventoryService.GetInventoryTransactionsAsync();
        Assert.Single(txs);
        Assert.Equal("Restock", txs[0].Type);
        Assert.Equal(20, txs[0].QuantityChange);
        Assert.Equal(30, txs[0].StockAfter);
    }

    [Fact]
    public async Task GetLowStockProducts_ShouldReturnItemsBelowThreshold()
    {
        var (db, warungId, userMock) = GetSetup();
        var inventoryService = new InventoryService(db, userMock.Object);

        db.Products.Add(new Product { Id = Guid.NewGuid(), WarungId = warungId, Sku = "SKU-1", Name = "Barang A", StockQuantity = 2, MinStockThreshold = 5, IsActive = true });
        db.Products.Add(new Product { Id = Guid.NewGuid(), WarungId = warungId, Sku = "SKU-2", Name = "Barang B", StockQuantity = 20, MinStockThreshold = 5, IsActive = true });
        await db.SaveChangesAsync();

        var lowStockItems = await inventoryService.GetLowStockProductsAsync();

        Assert.Single(lowStockItems);
        Assert.Equal("Barang A", lowStockItems[0].Name);
    }

    [Fact]
    public async Task UpdateCategory_ShouldUpdateCategoryName_WhenValid()
    {
        var (db, warungId, userMock) = GetSetup();
        var inventoryService = new InventoryService(db, userMock.Object);

        var created = await inventoryService.CreateCategoryAsync(new CreateCategoryRequest { Name = "Makanan" });
        Assert.NotNull(created);

        var updated = await inventoryService.UpdateCategoryAsync(created.Id, new UpdateCategoryRequest { Name = "Makanan & Minuman" });
        Assert.Equal("Makanan & Minuman", updated.Name);

        var categories = await inventoryService.GetCategoriesAsync();
        Assert.Single(categories);
        Assert.Equal("Makanan & Minuman", categories[0].Name);
    }

    [Fact]
    public async Task DeleteCategory_ShouldRemoveCategoryAndSetProductCategoryIdToNull()
    {
        var (db, warungId, userMock) = GetSetup();
        var inventoryService = new InventoryService(db, userMock.Object);

        var category = await inventoryService.CreateCategoryAsync(new CreateCategoryRequest { Name = "Snack" });

        var product = await inventoryService.CreateProductAsync(new CreateProductRequest
        {
            CategoryId = category.Id,
            Sku = "SKU-SNACK-01",
            Name = "Keripik Singkong",
            Unit = "Pack",
            CostPrice = 5000,
            SellingPrice = 7500,
            StockQuantity = 10,
            MinStockThreshold = 2
        });

        Assert.Equal(category.Id, product.CategoryId);

        await inventoryService.DeleteCategoryAsync(category.Id);

        var categories = await inventoryService.GetCategoriesAsync();
        Assert.Empty(categories);

        var updatedProduct = await inventoryService.GetProductBySkuOrBarcodeAsync("SKU-SNACK-01");
        Assert.NotNull(updatedProduct);
        Assert.Null(updatedProduct!.CategoryId);
    }
}
