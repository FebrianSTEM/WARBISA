using FluentValidation;
using Warbisa.Application.DTOs.Auth;

namespace Warbisa.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username wajib diisi.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password wajib diisi.");
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username wajib diisi.")
            .Length(3, 50).WithMessage("Username harus antara 3 hingga 50 karakter.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email wajib diisi.")
            .EmailAddress().WithMessage("Format email tidak valid.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password wajib diisi.")
            .MinimumLength(8).WithMessage("Password minimal 8 karakter.")
            .Matches("[A-Z]").WithMessage("Password harus mengandung minimal 1 huruf kapital.")
            .Matches("[0-9]").WithMessage("Password harus mengandung minimal 1 angka.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Nama lengkap wajib diisi.");

        RuleFor(x => x.RoleId)
            .Must(r => r == 1 || r == 2).WithMessage("RoleId harus 1 (Owner) atau 2 (Staff).");

        When(x => x.RoleId == 1 && x.WarungId == null, () =>
        {
            RuleFor(x => x.WarungName)
                .NotEmpty().WithMessage("Nama warung wajib diisi untuk registrasi Owner baru.");
        });
    }
}
