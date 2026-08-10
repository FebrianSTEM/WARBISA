using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace Warbisa.API.Middlewares;

public class CustomExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CustomExceptionHandlerMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public CustomExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<CustomExceptionHandlerMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
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

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        string message;

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
                message = exception.Message;
                break;

            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                message = exception.Message;
                break;

            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                message = exception.Message;
                break;

            default:
                // Log the real error server-side; never expose internals to client
                _logger.LogError(exception, "Unhandled exception at {Path}", context.Request.Path);
                message = _env.IsDevelopment()
                    ? exception.Message
                    : "Terjadi kesalahan internal server. Hubungi administrator.";
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
