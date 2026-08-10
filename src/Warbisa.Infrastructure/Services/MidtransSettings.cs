namespace Warbisa.Infrastructure.Services;

public class MidtransSettings
{
    public const string SectionName = "MidtransSettings";
    public string ServerKey { get; set; } = string.Empty;
    public string ClientKey { get; set; } = string.Empty;
    public bool IsProduction { get; set; } = false;
}
