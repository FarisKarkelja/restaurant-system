<?php

// PUBLIC: Customer places an order (table token is the auth)
Flight::route('POST /orders', function (): void {
    $body  = Flight::request()->data->getData();
    $token = trim($body['table_token'] ?? '');
    $items = $body['items'] ?? [];

    if (!$token) {
        Flight::json(['success' => false, 'error' => 'Table token is required'], 400);
        return;
    }
    if (empty($items) || !is_array($items)) {
        Flight::json(['success' => false, 'error' => 'Order must contain at least one item'], 400);
        return;
    }

    $table = (new TableDao())->getTableByToken($token);
    if (!$table) {
        Flight::json(['success' => false, 'error' => 'Invalid table token'], 404);
        return;
    }

    // Validate items and lock in server-side prices (never trust client prices)
    $menuDao  = new MenuDao();
    $resolved = [];
    foreach ($items as $item) {
        $mid      = (int) ($item['menu_item_id'] ?? 0);
        $menuItem = $menuDao->getItemById($mid);
        if (!$menuItem || !$menuItem['is_available']) {
            Flight::json(['success' => false, 'error' => "Item #$mid is unavailable"], 422);
            return;
        }
        $resolved[] = [
            'menu_item_id' => (int) $menuItem['id'],
            'quantity'     => max(1, (int) ($item['quantity'] ?? 1)),
            'unit_price'   => (float) $menuItem['price'],
            'notes'        => $item['notes'] ?? null,
        ];
    }

    $order = (new OrderDao())->createOrder((int) $table['id'], $resolved, $body['notes'] ?? null);
    Flight::json(['success' => true, 'data' => $order], 201);
});

// PROTECTED: Today's order stats (for admin dashboard)
Flight::route('GET /orders/stats', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    Flight::json(['success' => true, 'data' => (new OrderDao())->getTodayStats()]);
});

// PROTECTED: Active orders — pending / confirmed / preparing
Flight::route('GET /orders/active', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    Flight::json(['success' => true, 'data' => (new OrderDao())->getActiveOrders()]);
});

// PROTECTED: All orders (recent 50)
Flight::route('GET /orders', function (): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    Flight::json(['success' => true, 'data' => (new OrderDao())->getAllOrders()]);
});

// PROTECTED: Update order status
Flight::route('PUT /orders/@id:[0-9]+/status', function (string $id): void {
    Flight::authMiddleware()->authorizeRoles([Roles::ADMIN, Roles::WAITER]);
    $body    = Flight::request()->data->getData();
    $status  = $body['status'] ?? '';
    $allowed = ['pending', 'confirmed', 'preparing', 'served', 'paid', 'cancelled'];
    if (!in_array($status, $allowed, true)) {
        Flight::json(['success' => false, 'error' => 'Invalid status value'], 422);
        return;
    }
    (new OrderDao())->updateStatus((int) $id, $status);
    Flight::json(['success' => true]);
});
