using Warbisa.Application.DTOs.Auth;

namespace Warbisa.Application.Common.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserDto> RegisterAsync(RegisterRequest request);
    Task<UserDto> UpdateWarungProfileAsync(UpdateWarungProfileRequest request);
    Task<List<MenuDto>> GetMenusForUserRoleAsync(int roleId);
}
