using Microsoft.EntityFrameworkCore;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Cashier;
using Warbisa.Domain.Entities;

namespace Warbisa.Infrastructure.Services;

public class CashierService : ICashierService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;

    public CashierService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
    }

    private Guid GetWarungId()
    {
        if (!_currentUserService.WarungId.HasValue)
        {
            throw new UnauthorizedAccessException("Akses warung tidak valid.");
        }
        return _currentUserService.WarungId.Value;
    }

    public async Task<List<CashierDto>> GetCashiersAsync()
    {
        var warungId = GetWarungId();

        var cashiers = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.WarungId == warungId && u.RoleId != 1) // RoleId 1 is Owner, fetch Staff/Cashiers
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var result = new List<CashierDto>();
        foreach (var c in cashiers)
        {
          var txCount = await _context.Transactions
              .CountAsync(t => t.UserId == c.Id && t.PaymentStatus == "Settled");

          result.Add(new CashierDto
          {
              Id = c.Id,
              WarungId = c.WarungId,
              RoleId = c.RoleId,
              RoleName = c.Role?.Name ?? "Kasir",
              Username = c.Username,
              Email = c.Email,
              FullName = c.FullName,
              IsActive = c.IsActive,
              CreatedAt = c.CreatedAt,
              TotalTransactionsProcessed = txCount
          });
        }

        return result;
    }

    public async Task<CashierDto> AddCashierAsync(AddCashierRequest request)
    {
        var warungId = GetWarungId();

        var usernameExists = await _context.Users
            .AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
        if (usernameExists)
        {
            throw new InvalidOperationException($"Username '{request.Username}' sudah digunakan.");
        }

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (emailExists)
        {
            throw new InvalidOperationException($"Email '{request.Email}' sudah terdaftar.");
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var newCashier = new User
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            RoleId = request.RoleId ?? 2, // 2 = Staff / Kasir
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = passwordHash,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newCashier);
        await _context.SaveChangesAsync(CancellationToken.None);

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == newCashier.RoleId);

        return new CashierDto
        {
            Id = newCashier.Id,
            WarungId = newCashier.WarungId,
            RoleId = newCashier.RoleId,
            RoleName = role?.Name ?? "Kasir",
            Username = newCashier.Username,
            Email = newCashier.Email,
            FullName = newCashier.FullName,
            IsActive = newCashier.IsActive,
            CreatedAt = newCashier.CreatedAt,
            TotalTransactionsProcessed = 0
        };
    }

    public async Task<CashierDto> ToggleCashierStatusAsync(Guid cashierId)
    {
        var warungId = GetWarungId();

        var cashier = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == cashierId && u.WarungId == warungId);

        if (cashier == null)
        {
            throw new KeyNotFoundException("Kasir tidak ditemukan.");
        }

        cashier.IsActive = !cashier.IsActive;
        await _context.SaveChangesAsync(CancellationToken.None);

        var txCount = await _context.Transactions
            .CountAsync(t => t.UserId == cashier.Id && t.PaymentStatus == "Settled");

        return new CashierDto
        {
            Id = cashier.Id,
            WarungId = cashier.WarungId,
            RoleId = cashier.RoleId,
            RoleName = cashier.Role?.Name ?? "Kasir",
            Username = cashier.Username,
            Email = cashier.Email,
            FullName = cashier.FullName,
            IsActive = cashier.IsActive,
            CreatedAt = cashier.CreatedAt,
            TotalTransactionsProcessed = txCount
        };
    }

    public async Task DeleteCashierAsync(Guid cashierId)
    {
        var warungId = GetWarungId();

        var cashier = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == cashierId && u.WarungId == warungId);

        if (cashier == null)
        {
            throw new KeyNotFoundException("Kasir tidak ditemukan.");
        }

        _context.Users.Remove(cashier);
        await _context.SaveChangesAsync(CancellationToken.None);
    }

    public async Task ResetCashierPasswordAsync(Guid cashierId, string newPassword)
    {
        var warungId = GetWarungId();

        var cashier = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == cashierId && u.WarungId == warungId);

        if (cashier == null)
        {
            throw new KeyNotFoundException("Kasir tidak ditemukan.");
        }

        cashier.PasswordHash = _passwordHasher.HashPassword(newPassword);
        await _context.SaveChangesAsync(CancellationToken.None);
    }
}
