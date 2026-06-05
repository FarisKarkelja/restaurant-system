<?php

require_once __DIR__ . '/AnalyticsStrategyInterface.php';

// DESIGN PATTERN: Strategy — Concrete Strategy: Popular Items
// Ranks menu items by total quantity ordered within the look-back
// window.  Used for both the admin analytics panel (limit 5, 30 days)
// and the public trending endpoint (limit 5, 7 days).

class PopularItemsStrategy implements AnalyticsStrategyInterface
{
    public function calculate(PDO $db, array $params = []): array
    {
        $limit = (int) ($params['limit'] ?? 5);
        $days  = (int) ($params['days']  ?? 30);

        $stmt = $db->prepare(
            "SELECT mi.id,
                    mi.name,
                    mi.image_url,
                    mi.price,
                    SUM(oi.quantity)              AS total_ordered,
                    COUNT(DISTINCT oi.order_id)   AS order_appearances
               FROM order_items oi
               JOIN menu_items mi ON mi.id  = oi.menu_item_id
               JOIN orders     o  ON o.id   = oi.order_id
              WHERE o.status NOT IN ('cancelled')
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
              GROUP BY mi.id, mi.name, mi.image_url, mi.price
              ORDER BY total_ordered DESC
              LIMIT :lim"
        );
        $stmt->bindValue(':days', $days,  PDO::PARAM_INT);
        $stmt->bindValue(':lim',  $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
