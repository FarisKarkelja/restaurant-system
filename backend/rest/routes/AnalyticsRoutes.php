<?php

// ---- Admin: full analytics summary (JWT required, Admin only) ----
Flight::route('GET /analytics/summary', function (): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $repo = new AnalyticsRepository();
    Flight::json(['success' => true, 'data' => $repo->getSummary()]);
});

// ---- Public: trending item IDs (no auth — used by menu page badges) ----
Flight::route('GET /menu/trending', function (): void {
    $repo = new AnalyticsRepository();
    Flight::json(['success' => true, 'data' => $repo->getTrendingItemIds()]);
});
