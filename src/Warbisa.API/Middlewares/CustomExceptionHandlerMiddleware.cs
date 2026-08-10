using System.Net;
using System.Text.Json;

namespace Warbisa.API.Middlewares;

public class CustomExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;

    public CustomExceptionHandlerMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var message = exception.Message;

        switch (exception)
        {
            case FluentValidation.ValidationException valEx:
                statusCode = HttpStatusCode.BadRequest;
                var errors = valEx.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage }).ToList();
                message = "Validasi gagal.";
                var jsonVal = JsonSerializer.Serialize(new { statusCode = (int)statusCode, message, errors });
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)statusCode;
                return context.Response.WriteAsync(jsonVal);

            case InvalidOperationException:
            case ArgumentException:
                statusCode = HttpStatusCode.BadRequest;
                break;

            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                break;

            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var result = JsonSerializer.Serialize(new
        {
            statusCode = (int)statusCode,
            message
        });

        return context.Response.WriteAsync(result);
    }
}
