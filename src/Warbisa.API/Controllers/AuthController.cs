using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Auth;

namespace Warbisa.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(
        IAuthService authService,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterRequest> registerValidator,
        ICurrentUserService currentUserService)
    {
        _authService = authService;
        _loginValidator = loginValidator;
        _registerValidator = registerValidator;
        _currentUserService = currentUserService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("LoginLimiter")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var validationResult = await _loginValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var validationResult = await _registerValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var response = await _authService.RegisterAsync(request);
        return Ok(response);
    }

    [HttpPut("warung")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateWarungProfile([FromBody] UpdateWarungProfileRequest request)
    {
        var response = await _authService.UpdateWarungProfileAsync(request);
        return Ok(response);
    }

    [HttpGet("menus")]
    [Authorize]
    public async Task<IActionResult> GetMenus()
    {
        var roleClaim = User.FindFirst("role_id")?.Value;
        if (!int.TryParse(roleClaim, out var roleId))
        {
            return Unauthorized(new { message = "Role claim tidak valid." });
        }

        var menus = await _authService.GetMenusForUserRoleAsync(roleId);
        return Ok(new { menus });
    }
}
