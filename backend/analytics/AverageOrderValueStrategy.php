<?php

require_once __DIR__ . '/AnalyticsStrategyInterface.php';

// DESIGN PATTERN: Strategy — Concrete Strategy: Average Order Value
// Returns key monetary metrics (avg, total revenue, order count,
// highest single order) for the look-back window.

class AverageOrderValueStrategy implements AnalyticsStrategyInterface
{
    public function calculate(PDO $db, array $params = []): array
    {
        $days = (int) ($params['days'] ?? 30);

        $stmt = $db->prepare(
            "SELECT ROUND(AVG(total_price), 2)  AS avg_value,
                    ROUND(SUM(total_price), 2)  AS total_revenue,
                    COUNT(*)                    AS total_orders,
                    ROUND(MAX(total_price), 2)  AS highest_order
               FROM orders
              WHERE status NOT IN ('cancelled', 'pending')
                AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)"
        );
        $stmt->execute(['days' => $days]);
        $row = $stmt->fetch();

        return [
            'avg_value'     => (float) ($row['avg_value']     ?? 0),
            'total_revenue' => (float) ($row['total_revenue'] ?? 0),
            'total_orders'  => (int)   ($row['total_orders']  ?? 0),
            'highest_order' => (float) ($row['highest_order'] ?? 0),
        ];
    }
}
