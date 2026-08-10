namespace Warbisa.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? WarungId { get; }
    string? Role { get; }
    string? Username { get; }
}
