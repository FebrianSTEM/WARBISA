using FluentValidation;
using Warbisa.Application.DTOs.POS;

namespace Warbisa.Application.Validators;

public class POSCheckoutItemRequestValidator : AbstractValidator<POSCheckoutItemRequest>
{
    public POSCheckoutItemRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("ID Produk wajib diisi.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Kuantitas barang harus lebih dari 0.");
    }
}

public class POSCheckoutRequestValidator : AbstractValidator<POSCheckoutRequest>
{
    private static readonly string[] ValidPaymentMethods = { "Cash", "QRIS", "Transfer" };

    public POSCheckoutRequestValidator()
    {
        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Metode pembayaran wajib diisi.")
            .Must(m => ValidPaymentMethods.Contains(m, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Metode pembayaran harus salah satu dari: Cash, QRIS, Transfer.");

        RuleFor(x => x.PaidAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Jumlah pembayaran (PaidAmount) tidak boleh negatif.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Daftar item belanjaan tidak boleh kosong.");

        RuleForEach(x => x.Items).SetValidator(new POSCheckoutItemRequestValidator());
    }
}
