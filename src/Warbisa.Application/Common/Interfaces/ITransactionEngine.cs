using Warbisa.Application.DTOs.Payments;
using Warbisa.Application.DTOs.POS;

namespace Warbisa.Application.Common.Interfaces;

public interface ITransactionEngine
{
    Task<TransactionDto> ProcessCheckoutAsync(POSCheckoutRequest request);
    Task<List<TransactionDto>> GetTransactionsAsync();
    Task<TransactionDto?> GetTransactionByIdAsync(Guid id);
    Task<bool> ProcessPaymentWebhookAsync(MidtransWebhookPayload payload);
}
