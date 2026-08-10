using Microsoft.EntityFrameworkCore;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Auth;
using Warbisa.Domain.Entities;

namespace Warbisa.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ICurrentUserService _currentUserService;

    public AuthService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _currentUserService = currentUserService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Role)
            .Include(u => u.Warung)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() || u.Email.ToLower() == request.Username.ToLower());

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Username atau password tidak valid.");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException("Akun tidak aktif.");
        }

        var roleName = user.Role?.Name ?? "Staff";
        var token = _jwtTokenGenerator.GenerateToken(user, roleName);

        return new LoginResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                WarungId = user.WarungId,
                WarungName = user.Warung?.Name ?? "WARBISA",
                WarungLogoUrl = user.Warung?.LogoUrl,
                WarungAddress = user.Warung?.Address,
                WarungPhone = user.Warung?.Phone,
                RoleId = user.RoleId,
                RoleName = roleName,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                IsActive = user.IsActive
            }
        };
    }

    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        var usernameExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());

        if (usernameExists)
        {
            throw new InvalidOperationException($"Username '{request.Username}' sudah digunakan.");
        }

        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (emailExists)
        {
            throw new InvalidOperationException($"Email '{request.Email}' sudah digunakan.");
        }

        Guid warungId;

        if (request.RoleId == 1) // Owner
        {
            if (!string.IsNullOrWhiteSpace(request.WarungName))
            {
                var newWarung = new Warung
                {
                    Id = Guid.NewGuid(),
                    Name = request.WarungName.Trim(),
                    Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
                    Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Warungs.Add(newWarung);
                warungId = newWarung.Id;
            }
            else if (request.WarungId.HasValue)
            {
                warungId = request.WarungId.Value;
            }
            else
            {
                throw new InvalidOperationException("Nama warung wajib diisi untuk pembuatan warung baru.");
            }
        }
        else // Staff
        {
            if (_currentUserService.WarungId.HasValue)
            {
                warungId = _currentUserService.WarungId.Value;
            }
            else
            {
                throw new UnauthorizedAccessException("Pendaftaran akun Staff hanya dapat dilakukan oleh Owner Warung yang terautentikasi.");
            }
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            WarungId = warungId,
            RoleId = request.RoleId,
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = passwordHash,
            FullName = request.FullName.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
        var warungObj = await _context.Warungs.FirstOrDefaultAsync(w => w.Id == newUser.WarungId);

        return new UserDto
        {
            Id = newUser.Id,
            WarungId = newUser.WarungId,
            WarungName = warungObj?.Name ?? request.WarungName ?? "WARBISA",
            WarungLogoUrl = warungObj?.LogoUrl,
            WarungAddress = warungObj?.Address,
            WarungPhone = warungObj?.Phone,
            RoleId = newUser.RoleId,
            RoleName = role?.Name ?? (request.RoleId == 1 ? "Owner" : "Staff"),
            Username = newUser.Username,
            Email = newUser.Email,
            FullName = newUser.FullName,
            IsActive = newUser.IsActive
        };
    }

    public async Task<UserDto> UpdateWarungProfileAsync(UpdateWarungProfileRequest request)
    {
        var warungId = _currentUserService.WarungId ?? throw new UnauthorizedAccessException("WarungId tidak ditemukan.");
        var warung = await _context.Warungs.FirstOrDefaultAsync(w => w.Id == warungId);
        if (warung == null)
        {
            throw new KeyNotFoundException("Warung tidak ditemukan.");
        }

        warung.Name = request.WarungName.Trim();
        warung.LogoUrl = string.IsNullOrWhiteSpace(request.WarungLogoUrl) ? null : request.WarungLogoUrl.Trim();
        warung.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        warung.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();

        await _context.SaveChangesAsync();

        var userId = _currentUserService.UserId ?? Guid.Empty;
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new UserDto
        {
            Id = user?.Id ?? userId,
            WarungId = warung.Id,
            WarungName = warung.Name,
            WarungLogoUrl = warung.LogoUrl,
            WarungAddress = warung.Address,
            WarungPhone = warung.Phone,
            RoleId = user?.RoleId ?? 1,
            RoleName = user?.Role?.Name ?? "Owner",
            Username = user?.Username ?? "",
            Email = user?.Email ?? "",
            FullName = user?.FullName ?? "",
            IsActive = user?.IsActive ?? true
        };
    }

    public async Task<List<MenuDto>> GetMenusForUserRoleAsync(int roleId)
    {
        var permissions = await _context.RoleMenuPermissions
            .Include(rmp => rmp.Menu)
            .Where(rmp => rmp.RoleId == roleId && rmp.CanRead && rmp.Menu != null)
            .ToListAsync();

        var permittedMenuIds = permissions.Select(p => p.MenuId).ToHashSet();

        var allPermittedMenus = permissions
            .Select(p => new
            {
                Menu = p.Menu!,
                p.CanRead,
                p.CanCreate,
                p.CanUpdate,
                p.CanDelete
            })
            .OrderBy(x => x.Menu.OrderNo)
            .ToList();

        var rootMenus = allPermittedMenus
            .Where(x => x.Menu.ParentId == null)
            .Select(x => new MenuDto
            {
                Id = x.Menu.Id,
                Title = x.Menu.Title,
                Route = x.Menu.Route,
                Icon = x.Menu.Icon,
                OrderNo = x.Menu.OrderNo,
                ParentId = x.Menu.ParentId,
                CanRead = x.CanRead,
                CanCreate = x.CanCreate,
                CanUpdate = x.CanUpdate,
                CanDelete = x.CanDelete,
                SubMenus = new List<MenuDto>()
            })
            .ToList();

        var subMenus = allPermittedMenus
            .Where(x => x.Menu.ParentId != null)
            .Select(x => new MenuDto
            {
                Id = x.Menu.Id,
                Title = x.Menu.Title,
                Route = x.Menu.Route,
                Icon = x.Menu.Icon,
                OrderNo = x.Menu.OrderNo,
                ParentId = x.Menu.ParentId,
                CanRead = x.CanRead,
                CanCreate = x.CanCreate,
                CanUpdate = x.CanUpdate,
                CanDelete = x.CanDelete,
                SubMenus = new List<MenuDto>()
            })
            .ToList();

        foreach (var root in rootMenus)
        {
            root.SubMenus = subMenus.Where(s => s.ParentId == root.Id).OrderBy(s => s.OrderNo).ToList();
        }

        return rootMenus;
    }
}
