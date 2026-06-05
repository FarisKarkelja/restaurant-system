<?php

class OrderDao
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function createOrder(int $tableId, array $items, ?string $notes = null): array
    {
        $total = array_sum(array_map(fn($i) => $i['unit_price'] * $i['quantity'], $items));

        $this->db->prepare(
            'INSERT INTO orders (table_id, notes, total_price) VALUES (:table_id, :notes, :total_price)'
        )->execute(['table_id' => $tableId, 'notes' => $notes, 'total_price' => round($total, 2)]);

        $orderId = (int) $this->db->lastInsertId();

        $stmt = $this->db->prepare(
            'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
             VALUES (:order_id, :menu_item_id, :quantity, :unit_price, :notes)'
        );
        foreach ($items as $item) {
            $stmt->execute([
                'order_id'     => $orderId,
                'menu_item_id' => $item['menu_item_id'],
                'quantity'     => $item['quantity'],
                'unit_price'   => $item['unit_price'],
                'notes'        => $item['notes'] ?? null,
            ]);
        }
        // Mark table occupied when an order is placed
        $this->db->prepare(
            "UPDATE tables SET status = 'occupied' WHERE id = :id"
        )->execute(['id' => $tableId]);

        return $this->getOrderById($orderId);
    }

    public function getOrderById(int $id): array
    {
        $stmt = $this->db->prepare(
            'SELECT o.*, t.table_number
             FROM orders o
             JOIN tables t ON t.id = o.table_id
             WHERE o.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();
        if (!$order) return [];
        $order['items'] = $this->getOrderItems($id);
        return $order;
    }

    private function getOrderItems(int $orderId): array
    {
        $stmt = $this->db->prepare(
            'SELECT oi.*, mi.name AS item_name
             FROM order_items oi
             JOIN menu_items mi ON mi.id = oi.menu_item_id
             WHERE oi.order_id = :order_id'
        );
        $stmt->execute(['order_id' => $orderId]);
        return $stmt->fetchAll();
    }

    public function getActiveOrders(): array
    {
        $stmt = $this->db->query(
            "SELECT o.*, t.table_number
             FROM orders o
             JOIN tables t ON t.id = o.table_id
             WHERE o.status IN ('pending', 'confirmed', 'preparing')
             ORDER BY o.created_at ASC"
        );
        $orders = $stmt->fetchAll();
        foreach ($orders as &$order) {
            $order['items'] = $this->getOrderItems((int) $order['id']);
        }
        return $orders;
    }

    public function getAllOrders(int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            "SELECT o.*, t.table_number
             FROM orders o
             JOIN tables t ON t.id = o.table_id
             ORDER BY o.created_at DESC
             LIMIT :lim"
        );
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll();
        foreach ($orders as &$order) {
            $order['items'] = $this->getOrderItems((int) $order['id']);
        }
        return $orders;
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->db->prepare(
            'UPDATE orders SET status = :status WHERE id = :id'
        )->execute(['status' => $status, 'id' => $id]);
    }

    public function getTodayStats(): array
    {
        $count = (int) $this->db->query(
            "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()"
        )->fetchColumn();

        $revenue = (float) $this->db->query(
            "SELECT COALESCE(SUM(total_price), 0) FROM orders
             WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled')"
        )->fetchColumn();

        $active = (int) $this->db->query(
            "SELECT COUNT(*) FROM orders WHERE status IN ('pending','confirmed','preparing')"
        )->fetchColumn();

        return ['count' => $count, 'revenue' => round($revenue, 2), 'active' => $active];
    }
}
