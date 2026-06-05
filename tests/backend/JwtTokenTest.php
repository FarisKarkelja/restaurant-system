<?php

declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use PHPUnit\Framework\TestCase;

class JwtTokenTest extends TestCase
{
    private const SECRET = 'unit_test_secret_key_minimum_32chars!';
    private const ALGO   = 'HS256';

    private function makeToken(array $overrides = []): string
    {
        $payload = array_merge([
            'iat'  => time(),
            'exp'  => time() + 3600,
            'user' => ['id' => 1, 'email' => 'admin@serviqo.com', 'role' => 'Admin'],
        ], $overrides);

        return JWT::encode($payload, self::SECRET, self::ALGO);
    }

    public function testTokenIsANonEmptyString(): void
    {
        $token = $this->makeToken();

        $this->assertIsString($token);
        $this->assertNotEmpty($token);
    }

    public function testDecodedPayloadMatchesOriginalClaims(): void
    {
        $token   = $this->makeToken();
        $decoded = JWT::decode($token, new Key(self::SECRET, self::ALGO));

        $this->assertEquals('admin@serviqo.com', $decoded->user->email);
        $this->assertEquals('Admin', $decoded->user->role);
        $this->assertEquals(1, $decoded->user->id);
    }

    public function testExpiredTokenThrowsExpiredException(): void
    {
        $this->expectException(ExpiredException::class);

        $token = $this->makeToken([
            'iat' => time() - 7200,
            'exp' => time() - 3600,
        ]);

        JWT::decode($token, new Key(self::SECRET, self::ALGO));
    }

    public function testWrongSecretThrowsSignatureInvalidException(): void
    {
        $this->expectException(SignatureInvalidException::class);

        $token = $this->makeToken();
        JWT::decode($token, new Key('completely_wrong_secret_but_long_enough_for_hs256!', self::ALGO));
    }

    public function testTokenHasThreeDotSeparatedSegments(): void
    {
        $parts = explode('.', $this->makeToken());

        $this->assertCount(3, $parts, 'A valid JWT must have exactly 3 dot-separated segments');
    }
}
