<?php

require_once __DIR__ . '/AnalyticsStrategyInterface.php';

// DESIGN PATTERN: Strategy — Concrete Strategy: Peak Hours
// Calculates the order volume for each hour of the day (0-23)
// over the requested look-back window (default 30 days).

class PeakHoursStrategy implements AnalyticsStrategyInterface
{
    public function calculate(PDO $db, array $params = []): array
    {
        $days = (int) ($params['days'] ?? 30);

        $stmt = $db->prepare(
            "SELECT HOUR(created_at) AS hour, COUNT(*) AS order_count
               FROM orders
              WHERE status NOT IN ('cancelled')
                AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
              GROUP BY HOUR(created_at)
              ORDER BY hour"
        );
        $stmt->execute(['days' => $days]);
        $rows = $stmt->fetchAll();

        // Ensure all 24 hours are represented
        $hours = array_fill(0, 24, 0);
        foreach ($rows as $row) {
            $hours[(int) $row['hour']] = (int) $row['order_count'];
        }

        $maxCount = max($hours);
        $peakHour = $maxCount > 0 ? array_search($maxCount, $hours) : null;

        return [
            'hours'      => $hours,
            'peak_hour'  => $peakHour,
            'peak_label' => $peakHour !== null
                ? sprintf('%02d:00 – %02d:00', $peakHour, $peakHour + 1)
                : 'No data yet',
        ];
    }
}
