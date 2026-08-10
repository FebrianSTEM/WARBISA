using FluentValidation;
using Warbisa.Application.DTOs.Inventory;

namespace Warbisa.Application.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nama kategori wajib diisi.")
            .MaximumLength(100).WithMessage("Nama kategori maksimal 100 karakter.");
    }
}

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    private static readonly string[] ValidUnits = { "Pcs", "Kg", "Pack", "Botol" };

    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("SKU wajib diisi.")
            .MaximumLength(100).WithMessage("SKU maksimal 100 karakter.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nama produk wajib diisi.")
            .MaximumLength(150).WithMessage("Nama produk maksimal 150 karakter.");

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Satuan unit wajib diisi.")
            .Must(u => ValidUnits.Contains(u, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Satuan unit harus salah satu dari: Pcs, Kg, Pack, Botol.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Harga modal (HPP) tidak boleh negatif.");

        RuleFor(x => x.SellingPrice)
            .GreaterThan(0).WithMessage("Harga jual harus lebih dari 0.")
            .GreaterThanOrEqualTo(x => x.CostPrice).WithMessage("Harga jual harus lebih besar atau sama dengan harga modal.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Jumlah stok tidak boleh negatif.");

        RuleFor(x => x.MinStockThreshold)
            .GreaterThanOrEqualTo(0).WithMessage("Batas minimal stok tidak boleh negatif.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    private static readonly string[] ValidUnits = { "Pcs", "Kg", "Pack", "Botol" };

    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("SKU wajib diisi.")
            .MaximumLength(100).WithMessage("SKU maksimal 100 karakter.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nama produk wajib diisi.")
            .MaximumLength(150).WithMessage("Nama produk maksimal 150 karakter.");

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Satuan unit wajib diisi.")
            .Must(u => ValidUnits.Contains(u, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Satuan unit harus salah satu dari: Pcs, Kg, Pack, Botol.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Harga modal (HPP) tidak boleh negatif.");

        RuleFor(x => x.SellingPrice)
            .GreaterThan(0).WithMessage("Harga jual harus lebih dari 0.")
            .GreaterThanOrEqualTo(x => x.CostPrice).WithMessage("Harga jual harus lebih besar atau sama dengan harga modal.");

        RuleFor(x => x.MinStockThreshold)
            .GreaterThanOrEqualTo(0).WithMessage("Batas minimal stok tidak boleh negatif.");
    }
}

public class RestockProductRequestValidator : AbstractValidator<RestockProductRequest>
{
    public RestockProductRequestValidator()
    {
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Kuantitas restock harus lebih dari 0.");
    }
}

public class AdjustStockRequestValidator : AbstractValidator<AdjustStockRequest>
{
    public AdjustStockRequestValidator()
    {
        RuleFor(x => x.QuantityChange)
            .NotEqual(0).WithMessage("Perubahan stok tidak boleh 0.");
    }
}
