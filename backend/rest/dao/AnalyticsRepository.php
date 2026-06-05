<?php

// ARCHITECTURAL PATTERN: Repository
//
// AnalyticsRepository is the single data-access layer for all
// analytics queries.  Route handlers never write SQL; they call
// methods on this repository.  The repository internally uses
// AnalyticsContext (Strategy Pattern) to delegate each metric
// calculation to the appropriate strategy class, keeping both
// the SQL and the algorithm encapsulated and independently
// testable.

require_once __DIR__ . '/../../analytics/AnalyticsStrategyInterface.php';
require_once __DIR__ . '/../../analytics/AnalyticsContext.php';
require_once __DIR__ . '/../../analytics/PeakHoursStrategy.php';
require_once __DIR__ . '/../../analytics/PopularItemsStrategy.php';
require_once __DIR__ . '/../../analytics/AverageOrderValueStrategy.php';
require_once __DIR__ . '/../../analytics/RevenueTrendStrategy.php';

class AnalyticsRepository
{
    private PDO             $db;
    private AnalyticsContext $ctx;

    public function __construct()
    {
        $this->db  = Database::connect();
        $this->ctx = new AnalyticsContext(new PeakHoursStrategy());
    }

    /** Hourly order distribution for the last $days days. */
    public function getPeakHours(int $days = 30): array
    {
        $this->ctx->setStrategy(new PeakHoursStrategy());
        return $this->ctx->run($this->db, ['days' => $days]);
    }

    /** Top $limit most-ordered items over the last $days days. */
    public function getPopularItems(int $limit = 5, int $days = 30): array
    {
        $this->ctx->setStrategy(new PopularItemsStrategy());
        return $this->ctx->run($this->db, ['limit' => $limit, 'days' => $days]);
    }

    /** Key monetary metrics for the last $days days. */
    public function getAverageOrderValue(int $days = 30): array
    {
        $this->ctx->setStrategy(new AverageOrderValueStrategy());
        return $this->ctx->run($this->db, ['days' => $days]);
    }

    /** Daily revenue + order count for the last $days days. */
    public function getRevenueTrend(int $days = 7): array
    {
        $this->ctx->setStrategy(new RevenueTrendStrategy());
        return $this->ctx->run($this->db, ['days' => $days]);
    }

    /**
     * Trending items (last 7 days) — used by the public menu endpoint.
     * Returns only item IDs so the response stays minimal.
     */
    public function getTrendingItemIds(int $limit = 5): array
    {
        $this->ctx->setStrategy(new PopularItemsStrategy());
        $rows = $this->ctx->run($this->db, ['limit' => $limit, 'days' => 7]);
        return array_map(fn($r) => (int) $r['id'], $rows);
    }

    /** Aggregate all metrics into one response. */
    public function getSummary(): array
    {
        return [
            'peak_hours'    => $this->getPeakHours(),
            'popular_items' => $this->getPopularItems(),
            'order_value'   => $this->getAverageOrderValue(),
            'revenue_trend' => $this->getRevenueTrend(),
        ];
    }
}
