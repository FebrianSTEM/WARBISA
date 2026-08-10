using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Inventory;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IValidator<CreateProductRequest> _createValidator;
    private readonly IValidator<UpdateProductRequest> _updateValidator;
    private readonly IValidator<RestockProductRequest> _restockValidator;
    private readonly IValidator<AdjustStockRequest> _adjustValidator;

    public ProductsController(
        IInventoryService inventoryService,
        IValidator<CreateProductRequest> createValidator,
        IValidator<UpdateProductRequest> updateValidator,
        IValidator<RestockProductRequest> restockValidator,
        IValidator<AdjustStockRequest> adjustValidator)
    {
        _inventoryService = inventoryService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _restockValidator = restockValidator;
        _adjustValidator = adjustValidator;
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Staff")]
    public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] Guid? categoryId)
    {
        var products = await _inventoryService.GetProductsAsync(search, categoryId);
        return Ok(products);
    }

    [HttpGet("scan/{sku}")]
    [Authorize(Roles = "Owner,Staff")]
    public async Task<IActionResult> ScanProduct(string sku)
    {
        var product = await _inventoryService.GetProductBySkuOrBarcodeAsync(sku);
        if (product == null)
        {
            return NotFound(new { message = $"Produk dengan SKU/Barcode '{sku}' tidak ditemukan." });
        }

        return Ok(product);
    }

    [HttpGet("low-stock")]
    [Authorize(Roles = "Owner,Staff")]
    public async Task<IActionResult> GetLowStockProducts()
    {
        var products = await _inventoryService.GetLowStockProductsAsync();
        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        var valResult = await _createValidator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.CreateProductAsync(request);
        return CreatedAtAction(nameof(ScanProduct), new { sku = result.Sku }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
    {
        var valResult = await _updateValidator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.UpdateProductAsync(id, request);
        return Ok(result);
    }

    [HttpPost("{id:guid}/restock")]
    [Authorize(Roles = "Owner,Staff")]
    public async Task<IActionResult> RestockProduct(Guid id, [FromBody] RestockProductRequest request)
    {
        var valResult = await _restockValidator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.RestockProductAsync(id, request);
        return Ok(result);
    }

    [HttpPost("{id:guid}/adjust")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> AdjustStock(Guid id, [FromBody] AdjustStockRequest request)
    {
        var valResult = await _adjustValidator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.AdjustStockAsync(id, request);
        return Ok(result);
    }
}
