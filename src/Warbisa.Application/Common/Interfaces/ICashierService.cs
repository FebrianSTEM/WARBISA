using Warbisa.Application.DTOs.Cashier;

namespace Warbisa.Application.Common.Interfaces;

public interface ICashierService
{
    Task<List<CashierDto>> GetCashiersAsync();
    Task<CashierDto> AddCashierAsync(AddCashierRequest request);
    Task<CashierDto> ToggleCashierStatusAsync(Guid cashierId);
    Task DeleteCashierAsync(Guid cashierId);
    Task ResetCashierPasswordAsync(Guid cashierId, string newPassword);
}
