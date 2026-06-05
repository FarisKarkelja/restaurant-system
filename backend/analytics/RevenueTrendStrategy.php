<?php

require_once __DIR__ . '/AnalyticsStrategyInterface.php';

// DESIGN PATTERN: Strategy — Concrete Strategy: Revenue Trend
// Returns daily revenue and order count for the last N days.
// Missing days are filled with zeros so the chart always has
// a continuous date axis.

class RevenueTrendStrategy implements AnalyticsStrategyInterface
{
    public function calculate(PDO $db, array $params = []): array
    {
        $days = (int) ($params['days'] ?? 7);

        $stmt = $db->prepare(
            "SELECT DATE(created_at)            AS date,
                    ROUND(SUM(total_price), 2)  AS revenue,
                    COUNT(*)                    AS orders
               FROM orders
              WHERE status IN ('served', 'paid')
                AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
              GROUP BY DATE(created_at)
              ORDER BY date"
        );
        $stmt->execute(['days' => $days]);
        $rows = $stmt->fetchAll();

        // Build a full date range with zero-filled gaps
        $filled = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $d          = date('Y-m-d', strtotime("-{$i} days"));
            $filled[$d] = ['date' => $d, 'revenue' => 0.0, 'orders' => 0];
        }
        foreach ($rows as $row) {
            $filled[$row['date']] = [
                'date'    => $row['date'],
                'revenue' => (float) $row['revenue'],
                'orders'  => (int)   $row['orders'],
            ];
        }

        return array_values($filled);
    }
}
