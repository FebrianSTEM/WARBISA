namespace Warbisa.Application.DTOs.Cashier;

public class CashierDto
{
    public Guid Id { get; set; }
    public Guid WarungId { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActive { get; set; }
    public int TotalTransactionsProcessed { get; set; }
}

public class AddCashierRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int? RoleId { get; set; } = 2; // Default 2 = Staff / Kasir
}

public class ResetCashierPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
