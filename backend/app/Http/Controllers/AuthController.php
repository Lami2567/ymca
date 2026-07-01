<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Models\User;
use App\Services\JWTService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected JWTService $jwtService;

    public function __construct(JWTService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'tenant_id' => $request->tenant_id,
            'role_id' => $request->role_id,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'status' => 'active',
        ]);

        $tokens = $this->jwtService->generateTokens($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'role' => $user->role?->name,
                    'role_display_name' => $user->role?->display_name,
                    'tenant_id' => $user->tenant_id,
                ],
                ...$tokens,
            ],
            'message' => 'Registration successful',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Login attempt', [
            'email' => $request->email,
            'ip' => $request->ip()
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'ACCOUNT_INACTIVE',
                    'message' => 'Your account is inactive. Please contact administrator.',
                ],
            ], 403);
        }

        // Update last login
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $tokens = $this->jwtService->generateTokens($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'full_name' => $user->full_name,
                    'role' => $user->role?->name,
                    'role_display_name' => $user->role?->display_name,
                    'permissions' => $user->role?->permissions ?? [],
                    'tenant_id' => $user->tenant_id,
                    'avatar_path' => $user->avatar_path,
                ],
                ...$tokens,
            ],
            'message' => 'Login successful',
        ]);
    }

    public function me(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'phone' => $user->phone,
                'avatar_path' => $user->avatar_path,
                'role' => $user->role?->name,
                'role_display_name' => $user->role?->display_name,
                'permissions' => $user->role?->permissions ?? [],
                'tenant_id' => $user->tenant_id,
                'student' => $user->student?->load('program.department'),
                'lecturer' => $user->lecturer?->load('department'),
            ],
        ]);
    }

    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        $tokens = $this->jwtService->refreshAccessToken($request->refresh_token);

        if (!$tokens) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_REFRESH_TOKEN',
                    'message' => 'Invalid or expired refresh token',
                ],
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => $tokens,
            'message' => 'Token refreshed successfully',
        ]);
    }

    public function logout(): JsonResponse
    {
        // In a stateless JWT setup, logout is handled client-side by removing the token
        // For additional security, you could implement a token blacklist
        
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function updateProfile(\Illuminate\Http\Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar_path' => $user->avatar_path,
                'role' => $user->role?->name,
                'role_display_name' => $user->role?->display_name,
                'permissions' => $user->role?->permissions ?? [],
                'tenant_id' => $user->tenant_id,
                'student' => $user->student,
                'lecturer' => $user->lecturer,
            ],
            'message' => 'Profile updated successfully',
        ]);
    }
}
