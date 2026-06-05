<?php

class RequestDao
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // Table helpers

    public function getTableByToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM tables WHERE qr_token = :token LIMIT 1'
        );
        $stmt->execute(['token' => $token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    // Waiter requests

    public function createWaiterRequest(int $tableId): array
    {
        // Return existing pending request for this table if any
        $stmt = $this->db->prepare(
            'SELECT wr.*, t.table_number
             FROM waiter_requests wr
             JOIN tables t ON t.id = wr.table_id
             WHERE wr.table_id = :tid AND wr.status = "pending"
             LIMIT 1'
        );
        $stmt->execute(['tid' => $tableId]);
        $existing = $stmt->fetch();
        if ($existing) {
            return $existing;
        }

        $this->db->prepare(
            'INSERT INTO waiter_requests (table_id) VALUES (:tid)'
        )->execute(['tid' => $tableId]);

        return $this->getWaiterRequestById((int) $this->db->lastInsertId());
    }

    public function getWaiterRequestById(int $id): array
    {
        $stmt = $this->db->prepare(
            'SELECT wr.*, t.table_number
             FROM waiter_requests wr
             JOIN tables t ON t.id = wr.table_id
             WHERE wr.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: [];
    }

    public function getWaiterRequests(?string $status = null): array
    {
        $sql    = 'SELECT wr.*, t.table_number
                   FROM waiter_requests wr
                   JOIN tables t ON t.id = wr.table_id';
        $params = [];
        if ($status !== null) {
            $sql           .= ' WHERE wr.status = :status';
            $params['status'] = $status;
        }
        $sql .= ' ORDER BY wr.created_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function resolveWaiterRequest(int $id): void
    {
        $this->db->prepare(
            'UPDATE waiter_requests SET status = "resolved", resolved_at = NOW() WHERE id = :id'
        )->execute(['id' => $id]);
    }

    // Bill requests

    public function createBillRequest(int $tableId): array
    {
        $stmt = $this->db->prepare(
            'SELECT br.*, t.table_number
             FROM bill_requests br
             JOIN tables t ON t.id = br.table_id
             WHERE br.table_id = :tid AND br.status = "pending"
             LIMIT 1'
        );
        $stmt->execute(['tid' => $tableId]);
        $existing = $stmt->fetch();
        if ($existing) {
            return $existing;
        }

        $this->db->prepare(
            'INSERT INTO bill_requests (table_id) VALUES (:tid)'
        )->execute(['tid' => $tableId]);

        return $this->getBillRequestById((int) $this->db->lastInsertId());
    }

    public function getBillRequestById(int $id): array
    {
        $stmt = $this->db->prepare(
            'SELECT br.*, t.table_number
             FROM bill_requests br
             JOIN tables t ON t.id = br.table_id
             WHERE br.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: [];
    }

    public function getBillRequests(?string $status = null): array
    {
        $sql    = 'SELECT br.*, t.table_number
                   FROM bill_requests br
                   JOIN tables t ON t.id = br.table_id';
        $params = [];
        if ($status !== null) {
            $sql           .= ' WHERE br.status = :status';
            $params['status'] = $status;
        }
        $sql .= ' ORDER BY br.created_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function resolveBillRequest(int $id): void
    {
        $this->db->prepare(
            'UPDATE bill_requests SET status = "resolved", resolved_at = NOW() WHERE id = :id'
        )->execute(['id' => $id]);
    }

    // Combined pending requests (for dashboard)

    public function getAllPendingRequests(): array
    {
        $waiter = $this->getWaiterRequests('pending');
        $bill   = $this->getBillRequests('pending');

        $combined = [];
        foreach ($waiter as $r) {
            $r['type'] = 'waiter';
            $combined[] = $r;
        }
        foreach ($bill as $r) {
            $r['type'] = 'bill';
            $combined[] = $r;
        }

        usort($combined, static function (array $a, array $b): int {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return $combined;
    }

    public function getPendingCounts(): array
    {
        $wCount = (int) $this->db->query(
            'SELECT COUNT(*) FROM waiter_requests WHERE status = "pending"'
        )->fetchColumn();
        $bCount = (int) $this->db->query(
            'SELECT COUNT(*) FROM bill_requests WHERE status = "pending"'
        )->fetchColumn();
        return [
            'waiter' => $wCount,
            'bill'   => $bCount,
            'total'  => $wCount + $bCount,
        ];
    }
}
