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
    private readonly IValidator<CreateCategoryRequest> _validator;

    public CategoriesController(
        IInventoryService inventoryService,
        IValidator<CreateCategoryRequest> validator)
    {
        _inventoryService = inventoryService;
        _validator = validator;
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
        var valResult = await _validator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _inventoryService.CreateCategoryAsync(request);
        return CreatedAtAction(nameof(GetCategories), new { id = result.Id }, result);
    }
}
