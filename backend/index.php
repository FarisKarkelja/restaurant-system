<?php

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/data/roles.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/middleware/LoggingMiddleware.php';
require_once __DIR__ . '/rest/dao/MenuDao.php';
require_once __DIR__ . '/rest/routes/MenuRoutes.php';

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

$publicRoutes = [
    'GET'  => ['/menu/categories', '/menu/items'],
    'POST' => ['/auth/login', '/auth/register'],
];

Flight::before('start', function () use ($publicRoutes): void {
    Flight::loggingMiddleware()->logRequest();

    $method = Flight::request()->method;
    $url    = strtok(Flight::request()->url, '?');

    if (isset($publicRoutes[$method]) && in_array($url, $publicRoutes[$method], true)) {
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
