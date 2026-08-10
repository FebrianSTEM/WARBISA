using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.POS;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly IPOSService _posService;
    private readonly IValidator<POSCheckoutRequest> _validator;

    public TransactionsController(IPOSService posService, IValidator<POSCheckoutRequest> validator)
    {
        _posService = posService;
        _validator = validator;
    }

    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] POSCheckoutRequest request)
    {
        var valResult = await _validator.ValidateAsync(request);
        if (!valResult.IsValid)
        {
            throw new ValidationException(valResult.Errors);
        }

        var result = await _posService.CreateCheckoutTransactionAsync(request);
        return CreatedAtAction(nameof(GetTransactionById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        var result = await _posService.GetTransactionsAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTransactionById(Guid id)
    {
        var result = await _posService.GetTransactionByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { message = $"Transaksi dengan ID '{id}' tidak ditemukan." });
        }

        return Ok(result);
    }
}
