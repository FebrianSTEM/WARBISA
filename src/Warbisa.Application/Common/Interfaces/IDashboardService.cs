using Warbisa.Application.DTOs.Dashboard;

namespace Warbisa.Application.Common.Interfaces;

public interface IDashboardService
{
    Task<DashboardAnalyticsResponse> GetAnalyticsAsync(string frequency);
}
