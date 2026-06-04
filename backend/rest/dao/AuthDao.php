<?php

class AuthDao
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, email, role, created_at FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->db->prepare(
            'SELECT id FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        return (bool) $stmt->fetch();
    }

    public function createUser(string $name, string $email, string $password): int
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare(
            'INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)'
        );
        $stmt->execute([
            'name'     => $name,
            'email'    => $email,
            'password' => $hash,
            'role'     => Roles::USER,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function incrementFailedAttempts(int $id): int
    {
        $this->db->prepare(
            'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = :id'
        )->execute(['id' => $id]);

        $stmt = $this->db->prepare(
            'SELECT failed_attempts FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        return (int) ($stmt->fetchColumn() ?? 0);
    }

    public function lockAccount(int $id, int $minutes = 10): void
    {
        $until = date('Y-m-d H:i:s', time() + $minutes * 60);
        $this->db->prepare(
            'UPDATE users SET locked_until = :until WHERE id = :id'
        )->execute(['until' => $until, 'id' => $id]);
    }

    public function resetFailedAttempts(int $id): void
    {
        $this->db->prepare(
            'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = :id'
        )->execute(['id' => $id]);
    }

    public function updateProfile(int $id, string $name): void
    {
        $this->db->prepare(
            'UPDATE users SET name = :name WHERE id = :id'
        )->execute(['name' => $name, 'id' => $id]);
    }

    public function deleteAccount(int $id): void
    {
        $this->db->prepare(
            'DELETE FROM users WHERE id = :id'
        )->execute(['id' => $id]);
    }

    public function getAllUsers(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        return $stmt->fetchAll();
    }

    public function updateUserRole(int $id, string $role): void
    {
        $this->db->prepare(
            'UPDATE users SET role = :role WHERE id = :id'
        )->execute(['role' => $role, 'id' => $id]);
    }
}
