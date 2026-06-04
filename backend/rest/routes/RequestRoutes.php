<?php

// -------------------------------------------------------
// PUBLIC: Create waiter request (table token is auth)
// -------------------------------------------------------
Flight::route('POST /requests/waiter', function (): void {
    $dao  = new RequestDao();
    $body = Flight::request()->data->getData();

    $token = trim($body['table_token'] ?? '');
    if (!$token) {
        Flight::json(['success' => false, 'error' => 'Table token is required'], 400);
        return;
    }

    $table = $dao->getTableByToken($token);
    if (!$table) {
        Flight::json(['success' => false, 'error' => 'Invalid table token'], 404);
        return;
    }

    $request = $dao->createWaiterRequest((int) $table['id']);
    Flight::json(['success' => true, 'data' => $request], 201);
});

// -------------------------------------------------------
// PUBLIC: Create bill request
// -------------------------------------------------------
Flight::route('POST /requests/bill', function (): void {
    $dao  = new RequestDao();
    $body = Flight::request()->data->getData();

    $token = trim($body['table_token'] ?? '');
    if (!$token) {
        Flight::json(['success' => false, 'error' => 'Table token is required'], 400);
        return;
    }

    $table = $dao->getTableByToken($token);
    if (!$table) {
        Flight::json(['success' => false, 'error' => 'Invalid table token'], 404);
        return;
    }

    $request = $dao->createBillRequest((int) $table['id']);
    Flight::json(['success' => true, 'data' => $request], 201);
});

// -------------------------------------------------------
// PROTECTED: Get all waiter requests (Admin/Staff)
// -------------------------------------------------------
Flight::route('GET /requests/waiter', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    $status = Flight::request()->query->getData()['status'] ?? null;
    Flight::json(['success' => true, 'data' => (new RequestDao())->getWaiterRequests($status)]);
});

// -------------------------------------------------------
// PROTECTED: Get all bill requests (Admin/Staff)
// -------------------------------------------------------
Flight::route('GET /requests/bill', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    $status = Flight::request()->query->getData()['status'] ?? null;
    Flight::json(['success' => true, 'data' => (new RequestDao())->getBillRequests($status)]);
});

// -------------------------------------------------------
// PROTECTED: Get all pending requests combined (dashboard)
// -------------------------------------------------------
Flight::route('GET /requests/pending', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    Flight::json(['success' => true, 'data' => (new RequestDao())->getAllPendingRequests()]);
});

// -------------------------------------------------------
// PROTECTED: Resolve waiter request
// -------------------------------------------------------
Flight::route('PUT /requests/waiter/@id:[0-9]+/resolve', function (string $id): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    (new RequestDao())->resolveWaiterRequest((int) $id);
    Flight::json(['success' => true]);
});

// -------------------------------------------------------
// PROTECTED: Resolve bill request
// -------------------------------------------------------
Flight::route('PUT /requests/bill/@id:[0-9]+/resolve', function (string $id): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    (new RequestDao())->resolveBillRequest((int) $id);
    Flight::json(['success' => true]);
});
