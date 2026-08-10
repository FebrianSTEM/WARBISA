using Warbisa.Application.DTOs.POS;

namespace Warbisa.Application.Common.Interfaces;

public interface IPOSService
{
    Task<TransactionDto> CreateCheckoutTransactionAsync(POSCheckoutRequest request);
    Task<List<TransactionDto>> GetTransactionsAsync();
    Task<TransactionDto?> GetTransactionByIdAsync(Guid id);
}
