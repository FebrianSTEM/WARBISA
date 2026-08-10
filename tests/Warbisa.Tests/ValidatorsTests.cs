using Warbisa.Application.DTOs.Auth;
using Warbisa.Application.DTOs.Inventory;
using Warbisa.Application.DTOs.POS;
using Warbisa.Application.Validators;
using Xunit;

namespace Warbisa.Tests;

public class ValidatorsTests
{
    [Fact]
    public void LoginRequestValidator_ShouldFail_WhenUsernameOrPasswordEmpty()
    {
        var validator = new LoginRequestValidator();
        var model = new LoginRequest { Username = "", Password = "" };

        var result = validator.Validate(model);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Username");
        Assert.Contains(result.Errors, e => e.PropertyName == "Password");
    }

    [Fact]
    public void RegisterRequestValidator_ShouldFail_WhenEmailOrPasswordInvalid()
    {
        var validator = new RegisterRequestValidator();
        var model = new RegisterRequest
        {
            Username = "ab", // Too short
            Email = "invalid-email-format",
            Password = "123", // Too short
            FullName = "",
            RoleId = 99 // Invalid role
        };

        var result = validator.Validate(model);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Username");
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
        Assert.Contains(result.Errors, e => e.PropertyName == "Password");
        Assert.Contains(result.Errors, e => e.PropertyName == "FullName");
        Assert.Contains(result.Errors, e => e.PropertyName == "RoleId");
    }

    [Fact]
    public void CreateProductRequestValidator_ShouldFail_WhenPricesOrUnitInvalid()
    {
        var validator = new CreateProductRequestValidator();
        var model = new CreateProductRequest
        {
            Sku = "SKU-001",
            Name = "Minyak Goreng 1L",
            Unit = "Karton", // Invalid unit (must be Pcs, Kg, Pack, Botol)
            CostPrice = 15000,
            SellingPrice = 10000, // Selling price < Cost price
            StockQuantity = -5, // Negative stock
            MinStockThreshold = -1
        };

        var result = validator.Validate(model);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Unit");
        Assert.Contains(result.Errors, e => e.PropertyName == "SellingPrice");
        Assert.Contains(result.Errors, e => e.PropertyName == "StockQuantity");
        Assert.Contains(result.Errors, e => e.PropertyName == "MinStockThreshold");
    }

    [Fact]
    public void POSCheckoutRequestValidator_ShouldFail_WhenPaymentMethodOrItemsInvalid()
    {
        var validator = new POSCheckoutRequestValidator();
        var model = new POSCheckoutRequest
        {
            PaymentMethod = "Bitcoin", // Invalid payment method
            PaidAmount = -100,
            Items = new List<POSCheckoutItemRequest>() // Empty items
        };

        var result = validator.Validate(model);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "PaymentMethod");
        Assert.Contains(result.Errors, e => e.PropertyName == "PaidAmount");
        Assert.Contains(result.Errors, e => e.PropertyName == "Items");
    }

    [Fact]
    public void RestockProductRequestValidator_ShouldFail_WhenQuantityIsZeroOrNegative()
    {
        var validator = new RestockProductRequestValidator();
        var model = new RestockProductRequest { Quantity = -10 };

        var result = validator.Validate(model);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Quantity");
    }

    [Fact]
    public void UpdateCategoryValidator_ShouldFail_WhenNameEmpty()
    {
        var validator = new UpdateCategoryValidator();
        var model = new UpdateCategoryRequest { Name = "" };

        var result = validator.Validate(model);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Name");
    }
}
