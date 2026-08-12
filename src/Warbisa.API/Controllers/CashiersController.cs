using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Cashier;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/cashiers")]
[Authorize(Roles = "Owner")]
public class CashiersController : ControllerBase
{
    private readonly ICashierService _cashierService;

    public CashiersController(ICashierService cashierService)
    {
        _cashierService = cashierService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCashiers()
    {
        var result = await _cashierService.GetCashiersAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddCashier([FromBody] AddCashierRequest request)
    {
        var result = await _cashierService.AddCashierAsync(request);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(Guid id)
    {
        var result = await _cashierService.ToggleCashierStatusAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCashier(Guid id)
    {
        await _cashierService.DeleteCashierAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetCashierPasswordRequest request)
    {
        await _cashierService.ResetCashierPasswordAsync(id, request.NewPassword);
        return Ok(new { message = "Password kasir berhasil direset." });
    }
}
