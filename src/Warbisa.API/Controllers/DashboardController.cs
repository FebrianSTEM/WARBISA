using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warbisa.Application.Common.Interfaces;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize(Roles = "Owner")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics([FromQuery] string frequency = "daily")
    {
        var result = await _dashboardService.GetAnalyticsAsync(frequency);
        return Ok(result);
    }
}
