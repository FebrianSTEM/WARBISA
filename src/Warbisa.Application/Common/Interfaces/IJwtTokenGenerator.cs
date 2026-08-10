using Warbisa.Domain.Entities;

namespace Warbisa.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, string roleName);
}
