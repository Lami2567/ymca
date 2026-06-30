<?php

namespace App\Services;

use App\Models\User;

class JWTService
{
    private string $secret;
    private int $accessTokenTTL;
    private int $refreshTokenTTL;

    public function __construct()
    {
        $this->secret = config('app.key');
        $this->accessTokenTTL = config('jwt.ttl', 15); // minutes
        $this->refreshTokenTTL = config('jwt.refresh_ttl', 20160); // minutes (14 days)
    }

    public function generateTokens(User $user): array
    {
        $now = time();

        $accessTokenPayload = [
            'iss' => config('app.url'),
            'iat' => $now,
            'exp' => $now + ($this->accessTokenTTL * 60),
            'sub' => $user->id,
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => $user->role?->name,
                'tenant_id' => $user->tenant_id,
            ],
        ];

        $refreshTokenPayload = [
            'iss' => config('app.url'),
            'iat' => $now,
            'exp' => $now + ($this->refreshTokenTTL * 60),
            'sub' => $user->id,
            'type' => 'refresh',
        ];

        $accessToken = $this->encode($accessTokenPayload);
        $refreshToken = $this->encode($refreshTokenPayload);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->accessTokenTTL * 60,
        ];
    }

    public function validateToken(string $token): ?object
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $this->secret, true)
        );

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null;
        }

        $header = $this->jsonDecode($encodedHeader);
        $payload = $this->jsonDecode($encodedPayload);

        if (!$header || !$payload || ($header->alg ?? null) !== 'HS256') {
            return null;
        }

        if (isset($payload->exp) && time() >= $payload->exp) {
            return null;
        }

        return $payload;
    }

    public function getUserFromToken(string $token): ?User
    {
        $payload = $this->validateToken($token);
        
        if (!$payload || !isset($payload->sub)) {
            return null;
        }

        return User::find($payload->sub);
    }

    public function refreshAccessToken(string $refreshToken): ?array
    {
        $payload = $this->validateToken($refreshToken);
        
        if (!$payload || ($payload->type ?? '') !== 'refresh') {
            return null;
        }

        $user = User::find($payload->sub);
        
        if (!$user) {
            return null;
        }

        return $this->generateTokens($user);
    }

    private function encode(array $payload): string
    {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $this->secret, true);

        return $encodedHeader.'.'.$encodedPayload.'.'.$this->base64UrlEncode($signature);
    }

    private function jsonDecode(string $value): ?object
    {
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            return null;
        }

        $data = json_decode($decoded);

        return is_object($data) ? $data : null;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
