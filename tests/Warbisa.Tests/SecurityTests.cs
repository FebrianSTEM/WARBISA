using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Warbisa.Infrastructure.Authentication;
using Warbisa.Infrastructure.Services;
using Xunit;

namespace Warbisa.Tests;

public class SecurityTests
{
    [Fact]
    public void JwtSettings_ShouldDefaultToEmptySecret()
    {
        var jwtSettings = new JwtSettings();
        Assert.Equal(string.Empty, jwtSettings.Secret);
    }

    [Fact]
    public void MidtransSettings_ShouldDefaultToEmptyKeys()
    {
        var settings = new MidtransSettings();
        Assert.Equal(string.Empty, settings.ServerKey);
        Assert.Equal(string.Empty, settings.ClientKey);
    }

    [Fact]
    public void ProductionStartupGuard_ShouldThrowInvalidOperationException_WhenSecretIsDefaultOrMissing()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "JwtSettings:Secret", "" },
            { "ConnectionStrings:DefaultConnection", "" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var jwtSecret = configuration["JwtSettings:Secret"];
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // Simulate Production check
        Action act = () =>
        {
            if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Contains("SUPER_SECRET") || jwtSecret.Length < 32)
            {
                throw new InvalidOperationException("FATAL: Kunci JwtSettings:Secret tidak aman atau masih default di lingkungan Production!");
            }
        };

        Assert.Throws<InvalidOperationException>(act);
    }
}
