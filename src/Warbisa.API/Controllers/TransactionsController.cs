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
    private readonly ITransactionEngine _transactionEngine;
    private readonly IValidator<POSCheckoutRequest> _validator;

    public TransactionsController(ITransactionEngine transactionEngine, IValidator<POSCheckoutRequest> validator)
    {
        _transactionEngine = transactionEngine;
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

        var result = await _transactionEngine.ProcessCheckoutAsync(request);
        return CreatedAtAction(nameof(GetTransactionById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        var result = await _transactionEngine.GetTransactionsAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTransactionById(Guid id)
    {
        var result = await _transactionEngine.GetTransactionByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { message = $"Transaksi dengan ID '{id}' tidak ditemukan." });
        }

        return Ok(result);
    }
}
