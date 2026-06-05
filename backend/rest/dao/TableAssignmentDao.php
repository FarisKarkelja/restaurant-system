<?php

class TableAssignmentDao
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    /**
     * Assign (or reassign) a waiter to a table.
     */
    public function assign(int $tableId, int $waiterId, int $assignedBy): array
    {
        $this->db->prepare(
            'INSERT INTO table_assignments (table_id, waiter_id, assigned_by)
             VALUES (:table_id, :waiter_id, :assigned_by)
             ON DUPLICATE KEY UPDATE
                 waiter_id   = VALUES(waiter_id),
                 assigned_by = VALUES(assigned_by),
                 assigned_at = CURRENT_TIMESTAMP'
        )->execute([
            'table_id'    => $tableId,
            'waiter_id'   => $waiterId,
            'assigned_by' => $assignedBy,
        ]);

        return $this->getByTableId($tableId) ?? [];
    }

    public function unassign(int $tableId): void
    {
        $this->db->prepare(
            'DELETE FROM table_assignments WHERE table_id = :table_id'
        )->execute(['table_id' => $tableId]);
    }

    public function getByTableId(int $tableId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT ta.*,
                    t.table_number, t.capacity, t.status,
                    u.name  AS waiter_name,
                    u.email AS waiter_email
             FROM table_assignments ta
             JOIN tables t ON t.id = ta.table_id
             JOIN users  u ON u.id = ta.waiter_id
             WHERE ta.table_id = :table_id LIMIT 1'
        );
        $stmt->execute(['table_id' => $tableId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getAllAssignments(): array
    {
        $stmt = $this->db->query(
            'SELECT t.id AS table_id, t.table_number, t.capacity, t.status,
                    ta.id          AS assignment_id,
                    ta.waiter_id,
                    ta.assigned_at,
                    u.name  AS waiter_name,
                    u.email AS waiter_email
             FROM tables t
             LEFT JOIN table_assignments ta ON ta.table_id = t.id
             LEFT JOIN users u ON u.id = ta.waiter_id
             ORDER BY t.table_number ASC'
        );
        return $stmt->fetchAll();
    }
}
