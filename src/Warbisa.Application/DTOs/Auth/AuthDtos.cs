namespace Warbisa.Application.DTOs.Auth;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    public Guid Id { get; set; }
    public Guid WarungId { get; set; }
    public string? WarungName { get; set; }
    public string? WarungLogoUrl { get; set; }
    public string? WarungAddress { get; set; }
    public string? WarungPhone { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int RoleId { get; set; } = 1; // 1 = Owner, 2 = Staff
    public string? WarungName { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public Guid? WarungId { get; set; }
}

public class UpdateWarungProfileRequest
{
    public string WarungName { get; set; } = string.Empty;
    public string? WarungLogoUrl { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
}

public class MenuDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int OrderNo { get; set; }
    public int? ParentId { get; set; }
    public bool CanRead { get; set; }
    public bool CanCreate { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public List<MenuDto> SubMenus { get; set; } = new List<MenuDto>();
}
