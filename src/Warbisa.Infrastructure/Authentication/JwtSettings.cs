namespace Warbisa.Infrastructure.Authentication;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "WarbisaAPI";
    public string Audience { get; set; } = "WarbisaClient";
    public int ExpiryMinutes { get; set; } = 1440; // 24 hours
}
