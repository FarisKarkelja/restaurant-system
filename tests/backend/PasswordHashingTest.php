<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class PasswordHashingTest extends TestCase
{
    public function testHashIsNotEqualToPlaintext(): void
    {
        $plain = 'Admin1234!';
        $hash  = password_hash($plain, PASSWORD_BCRYPT);

        $this->assertNotEquals($plain, $hash);
    }

    public function testCorrectPasswordVerifiesAgainstHash(): void
    {
        $plain = 'Admin1234!';
        $hash  = password_hash($plain, PASSWORD_BCRYPT);

        $this->assertTrue(password_verify($plain, $hash));
    }

    public function testWrongPasswordDoesNotVerify(): void
    {
        $hash = password_hash('CorrectPassword1!', PASSWORD_BCRYPT);

        $this->assertFalse(password_verify('WrongPassword1!', $hash));
    }

    public function testTwoHashesOfSamePasswordAreDifferentDueToSalt(): void
    {
        $plain = 'SamePassword1!';
        $hash1 = password_hash($plain, PASSWORD_BCRYPT);
        $hash2 = password_hash($plain, PASSWORD_BCRYPT);

        $this->assertNotEquals($hash1, $hash2);
        $this->assertTrue(password_verify($plain, $hash1));
        $this->assertTrue(password_verify($plain, $hash2));
    }

    public function testSeededAdminHashMatchesDocumentedPassword(): void
    {
        // Hash stored in database/scheme/schema.sql — password: Admin1234!
        $seedHash = '$2y$10$z6SMjGSWb8fafWNkF8IM5uE/FoMg18jNaoT0aEHlVRVmBiUwB/zgO';

        $this->assertTrue(
            password_verify('Admin1234!', $seedHash),
            'The bcrypt hash in schema.sql must match the documented admin password'
        );
    }
}
