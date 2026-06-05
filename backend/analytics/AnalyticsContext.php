<?php

require_once __DIR__ . '/AnalyticsStrategyInterface.php';

// DESIGN PATTERN: Strategy (Context)
//
// AnalyticsContext holds a reference to whichever Strategy is
// currently active and delegates the calculate() call to it.
// Callers (AnalyticsRepository) only depend on this Context,
// never on concrete strategy classes directly.

class AnalyticsContext
{
    private AnalyticsStrategyInterface $strategy;

    public function __construct(AnalyticsStrategyInterface $strategy)
    {
        $this->strategy = $strategy;
    }

    /** Hot-swap the active strategy at runtime. */
    public function setStrategy(AnalyticsStrategyInterface $strategy): void
    {
        $this->strategy = $strategy;
    }

    /** Delegate execution to the active strategy. */
    public function run(PDO $db, array $params = []): array
    {
        return $this->strategy->calculate($db, $params);
    }
}
