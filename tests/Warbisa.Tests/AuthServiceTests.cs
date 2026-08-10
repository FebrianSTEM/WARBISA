using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Application.DTOs.Auth;
using Warbisa.Domain.Entities;
using Warbisa.Infrastructure.Authentication;
using Warbisa.Infrastructure.Persistence;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class AuthServiceTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);
        return context;
    }

    [Fact]
    public async Task RegisterAndLogin_ShouldSucceed_ForNewOwner()
    {
        var db = GetInMemoryDbContext();
        var passwordHasher = new PasswordHasher();
        var jwtSettings = Options.Create(new JwtSettings { Secret = "TEST_JWT_SECRET_KEY_FOR_UNIT_TESTS_MIN_32_BYTES" });
        var jwtGenerator = new JwtTokenGenerator(jwtSettings);

        var currentUserServiceMock = new Mock<ICurrentUserService>();

        var authService = new AuthService(db, passwordHasher, jwtGenerator, currentUserServiceMock.Object);

        // Seed Roles
        db.Roles.Add(new Role { Id = 1, Name = "Owner" });
        db.Roles.Add(new Role { Id = 2, Name = "Staff" });
        await db.SaveChangesAsync();

        // 1. Register Owner
        var registerReq = new RegisterRequest
        {
            Username = "owner_test",
            Email = "owner@test.com",
            Password = "Password123",
            FullName = "Owner Test",
            RoleId = 1,
            WarungName = "Warung Berkah"
        };

        var userDto = await authService.RegisterAsync(registerReq);

        Assert.NotNull(userDto);
        Assert.Equal("owner_test", userDto.Username);
        Assert.Equal("Owner", userDto.RoleName);
        Assert.NotEqual(Guid.Empty, userDto.WarungId);

        // 2. Login Owner
        var loginReq = new LoginRequest
        {
            Username = "owner_test",
            Password = "Password123"
        };

        var loginRes = await authService.LoginAsync(loginReq);

        Assert.NotNull(loginRes);
        Assert.False(string.IsNullOrEmpty(loginRes.Token));
        Assert.Equal("owner_test", loginRes.User.Username);
    }

    [Fact]
    public async Task GetMenusForUserRole_ShouldReturnPermittedMenusOnly()
    {
        var db = GetInMemoryDbContext();
        var passwordHasher = new PasswordHasher();
        var jwtSettings = Options.Create(new JwtSettings { Secret = "TEST_JWT_SECRET_KEY_FOR_UNIT_TESTS_MIN_32_BYTES" });
        var jwtGenerator = new JwtTokenGenerator(jwtSettings);
        var currentUserServiceMock = new Mock<ICurrentUserService>();

        var authService = new AuthService(db, passwordHasher, jwtGenerator, currentUserServiceMock.Object);

        // Seed Roles & Menus
        db.Roles.Add(new Role { Id = 1, Name = "Owner" });
        db.Roles.Add(new Role { Id = 2, Name = "Staff" });

        var m1 = new Menu { Id = 1, Title = "Dashboard", Route = "/dashboard", Icon = "LayoutDashboard", OrderNo = 1 };
        var m2 = new Menu { Id = 2, Title = "POS Checkout", Route = "/pos", Icon = "ShoppingCart", OrderNo = 2 };
        var m3 = new Menu { Id = 3, Title = "Inventory Stock", Route = "/inventory", Icon = "Package", OrderNo = 3 };
        var m4 = new Menu { Id = 4, Title = "Staff Management", Route = "/staff", Icon = "Users", OrderNo = 4 };

        db.Menus.AddRange(m1, m2, m3, m4);

        // Owner: full access
        db.RoleMenuPermissions.Add(new RoleMenuPermission { RoleId = 1, MenuId = 1, CanRead = true });
        db.RoleMenuPermissions.Add(new RoleMenuPermission { RoleId = 1, MenuId = 2, CanRead = true });
        db.RoleMenuPermissions.Add(new RoleMenuPermission { RoleId = 1, MenuId = 3, CanRead = true });
        db.RoleMenuPermissions.Add(new RoleMenuPermission { RoleId = 1, MenuId = 4, CanRead = true });

        // Staff: POS and Inventory only
        db.RoleMenuPermissions.Add(new RoleMenuPermission { RoleId = 2, MenuId = 2, CanRead = true });
        db.RoleMenuPermissions.Add(new RoleMenuPermission { RoleId = 2, MenuId = 3, CanRead = true });

        await db.SaveChangesAsync();

        // Check Owner menus
        var ownerMenus = await authService.GetMenusForUserRoleAsync(1);
        Assert.Equal(4, ownerMenus.Count);

        // Check Staff menus
        var staffMenus = await authService.GetMenusForUserRoleAsync(2);
        Assert.Equal(2, staffMenus.Count);
        Assert.Contains(staffMenus, m => m.Route == "/pos");
        Assert.Contains(staffMenus, m => m.Route == "/inventory");
        Assert.DoesNotContain(staffMenus, m => m.Route == "/staff");
        Assert.DoesNotContain(staffMenus, m => m.Route == "/dashboard");
    }
}
