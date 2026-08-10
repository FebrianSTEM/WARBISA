using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Inventory;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IValidator<CreateCategoryRequest> _createValidator;
    private readonly IValidator<UpdateCategoryRequest> _updateValidator;

    public CategoriesController(
        IInventoryService inventoryService,
        IValidator<CreateCategoryRequest> createValidator,
        IValidator<UpdateCategoryRequest> updateValidator)
    {
        _inventoryService = inventoryService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Staff")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _inventoryService.GetCategoriesAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var valResult = await _createValidator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.CreateCategoryAsync(request);
        return CreatedAtAction(nameof(GetCategories), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var valResult = await _updateValidator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.UpdateCategoryAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        await _inventoryService.DeleteCategoryAsync(id);
        return NoContent();
    }
}
