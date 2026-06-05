<?php

// DESIGN PATTERN: Strategy (Interface / Contract)
//
// AnalyticsStrategyInterface defines the single contract that
// every analytics metric calculator must fulfil.  Each concrete
// strategy (PeakHours, PopularItems, ReveneTrend, AvgOrderValue)
// encapsulates one metric algorithm and can be swapped inside
// AnalyticsContext at runtime without changing the caller.

interface AnalyticsStrategyInterface
{
    /**
     * Execute the metric calculation.
     *
     * @param  PDO   $db     Active PDO connection
     * @param  array $params Optional parameters (days, limit, …)
     * @return array         Structured result ready for JSON serialisation
     */
    public function calculate(PDO $db, array $params = []): array;
}
