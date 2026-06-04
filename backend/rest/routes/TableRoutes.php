<?php

// PROTECTED: Get all tables with status
Flight::route('GET /tables', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    Flight::json(['success' => true, 'data' => (new TableDao())->getAllTables()]);
});

// PUBLIC: Look up table by QR token (menu page needs table number)
Flight::route('GET /tables/token/@token', function (string $token): void {
    $table = (new TableDao())->getTableByToken($token);
    if (!$table) {
        Flight::json(['success' => false, 'error' => 'Table not found'], 404);
        return;
    }
    Flight::json(['success' => true, 'data' => $table]);
});

