<?php

class TableDao
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function getAllTables(): array
    {
        $stmt = $this->db->query(
            'SELECT * FROM tables ORDER BY table_number ASC'
        );
        return $stmt->fetchAll();
    }

    public function getTableByToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, table_number, capacity, status FROM tables WHERE qr_token = :token LIMIT 1'
        );
        $stmt->execute(['token' => $token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getTableById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM tables WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->db->prepare(
            'UPDATE tables SET status = :status WHERE id = :id'
        )->execute(['status' => $status, 'id' => $id]);
    }

}
