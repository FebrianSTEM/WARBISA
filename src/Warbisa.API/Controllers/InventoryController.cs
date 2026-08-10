using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetInventoryTransactions()
    {
        var result = await _inventoryService.GetInventoryTransactionsAsync();
        return Ok(result);
    }
}
