<?php

require 'vendor/autoload.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/data/roles.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/middleware/LoggingMiddleware.php';

// DAOs
require_once __DIR__ . '/rest/dao/MenuDao.php';
require_once __DIR__ . '/rest/dao/AuthDao.php';
require_once __DIR__ . '/rest/dao/RequestDao.php';
require_once __DIR__ . '/rest/dao/TableDao.php';
require_once __DIR__ . '/rest/dao/OrderDao.php';
require_once __DIR__ . '/rest/dao/TableAssignmentDao.php';
require_once __DIR__ . '/rest/dao/AnalyticsRepository.php';

// Routes
require_once __DIR__ . '/rest/routes/MenuRoutes.php';
require_once __DIR__ . '/rest/routes/AuthRoutes.php';
require_once __DIR__ . '/rest/routes/RequestRoutes.php';
require_once __DIR__ . '/rest/routes/TableRoutes.php';
require_once __DIR__ . '/rest/routes/OrderRoutes.php';
require_once __DIR__ . '/rest/routes/TableAssignmentRoutes.php';
require_once __DIR__ . '/rest/routes/AnalyticsRoutes.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

Flight::register('authMiddleware',    'AuthMiddleware');
Flight::register('loggingMiddleware', 'LoggingMiddleware');

// PHP built-in server sets SCRIPT_NAME to the requested URI when a
// directory in the document root shares the same name as a route prefix
// (e.g. backend/analytics/ causes /analytics/summary to be stripped to /summary).
// Force the correct URL from REQUEST_URI to bypass Flight's base-stripping.
if (isset($_SERVER['REQUEST_URI'])) {
    Flight::request()->url = strtok($_SERVER['REQUEST_URI'], '?') ?: '/';
}

// Routes that bypass JWT validation
$publicPaths = [
    'GET'  => ['/menu/categories', '/menu/items', '/menu/trending'],
    'POST' => ['/auth/login', '/auth/register', '/requests/waiter', '/requests/bill', '/orders'],
];

Flight::before('start', function () use ($publicPaths): void {
    Flight::loggingMiddleware()->logRequest();

    $method = Flight::request()->method;
    $url    = strtok(Flight::request()->url, '?');


    // Static public paths
    if (isset($publicPaths[$method]) && in_array($url, $publicPaths[$method], true)) {
        return;
    }

    // Dynamic public pattern: GET /tables/token/<anything>
    if ($method === 'GET' && preg_match('#^/tables/token/[^/]+$#', $url)) {
        return;
    }

    $header = Flight::request()->getHeader('Authorization') ?? '';
    $token  = str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;

    try {
        Flight::authMiddleware()->verifyToken($token);
    } catch (\Exception $e) {
        Flight::halt(401, json_encode(['success' => false, 'error' => $e->getMessage()]));
    }
});

Flight::start();
