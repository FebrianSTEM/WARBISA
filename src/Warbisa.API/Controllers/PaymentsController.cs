using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Payments;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IMidtransService _midtransService;

    public PaymentsController(IMidtransService midtransService)
    {
        _midtransService = midtransService;
    }

    [HttpPost("midtrans-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> MidtransCallback([FromBody] MidtransWebhookPayload payload)
    {
        if (payload == null)
        {
            return BadRequest(new { message = "Payload webhook tidak boleh kosong." });
        }

        var success = await _midtransService.ProcessWebhookCallbackAsync(payload);
        if (success)
        {
            return Ok(new { status = "success", message = "Callback Midtrans berhasil diproses." });
        }

        return BadRequest(new { status = "error", message = "Gagal memproses callback Midtrans." });
    }
}
