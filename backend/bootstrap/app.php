<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'jwt' => \App\Http\Middleware\JWTMiddleware::class,
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return consistent JSON for all API requests
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                // Validation errors — return field-by-field errors
                if ($e instanceof ValidationException) {
                    \Illuminate\Support\Facades\Log::error('Validation Failed: ' . json_encode($e->errors()));
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $e->errors(),
                    ], 422);
                }

                // Database query errors (e.g., unique constraint, FK violation)
                if ($e instanceof \Illuminate\Database\QueryException) {
                    \Illuminate\Support\Facades\Log::error('DB Error: ' . $e->getMessage());
                    $msg = 'Database error occurred';
                    if (str_contains($e->getMessage(), 'duplicate key') || str_contains($e->getMessage(), 'Unique violation')) {
                        $msg = 'A record with this data already exists (duplicate value)';
                    } elseif (str_contains($e->getMessage(), 'foreign key') || str_contains($e->getMessage(), 'violates foreign key')) {
                        $msg = 'Invalid reference — the referenced record does not exist';
                    }
                    return response()->json([
                        'success' => false,
                        'error' => ['code' => 'DB_ERROR', 'message' => $msg],
                    ], 422);
                }

                // Model not found
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return response()->json([
                        'success' => false,
                        'error' => ['code' => 'NOT_FOUND', 'message' => 'Record not found'],
                    ], 404);
                }

                // Generic server errors
                if ($e instanceof \Exception || $e instanceof \Error) {
                    $message = config('app.debug') ? $e->getMessage() : 'An unexpected error occurred';
                    \Illuminate\Support\Facades\Log::error('API Error: ' . $e->getMessage(), [
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ]);
                    return response()->json([
                        'success' => false,
                        'error' => ['code' => 'SERVER_ERROR', 'message' => $message],
                    ], 500);
                }
            }
        });
    })->create();
