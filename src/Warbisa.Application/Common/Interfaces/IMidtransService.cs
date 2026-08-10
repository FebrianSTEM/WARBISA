using Warbisa.Application.DTOs.Payments;
using Warbisa.Domain.Entities;

namespace Warbisa.Application.Common.Interfaces;

public interface IMidtransService
{
    Task<MidtransSnapResponse> CreateSnapTransactionAsync(Transaction transaction);
    bool VerifySignature(MidtransWebhookPayload payload);
    Task<bool> ProcessWebhookCallbackAsync(MidtransWebhookPayload payload);
}
