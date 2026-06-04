<?php

Flight::route('GET /menu/categories', function (): void {
    $dao = new MenuDao();
    Flight::json(['success' => true, 'data' => $dao->getCategories()]);
});

Flight::route('GET /menu/items', function (): void {
    $dao     = new MenuDao();
    $filters = Flight::request()->query->getData();
    Flight::json(['success' => true, 'data' => $dao->getMenuItems($filters)]);
});

// ---- Admin: Category CRUD ----

Flight::route('POST /menu/categories', function (): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $body = Flight::request()->data->getData();
    $name = trim($body['name'] ?? '');
    if (!$name) {
        Flight::json(['success' => false, 'error' => 'Name is required'], 400);
        return;
    }
    $cat = (new MenuDao())->createCategory(
        $name,
        trim($body['description'] ?? ''),
        (int) ($body['display_order'] ?? 0)
    );
    Flight::json(['success' => true, 'data' => $cat], 201);
});

Flight::route('PUT /menu/categories/@id:[0-9]+', function (string $id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $dao  = new MenuDao();
    $body = Flight::request()->data->getData();
    $name = trim($body['name'] ?? '');
    if (!$name) {
        Flight::json(['success' => false, 'error' => 'Name is required'], 400);
        return;
    }
    if (!$dao->getCategoryById((int) $id)) {
        Flight::json(['success' => false, 'error' => 'Category not found'], 404);
        return;
    }
    $dao->updateCategory(
        (int) $id,
        $name,
        trim($body['description'] ?? ''),
        (int) ($body['display_order'] ?? 0),
        (bool) ($body['is_active'] ?? true)
    );
    Flight::json(['success' => true]);
});

Flight::route('DELETE /menu/categories/@id:[0-9]+', function (string $id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $dao = new MenuDao();
    if (!$dao->getCategoryById((int) $id)) {
        Flight::json(['success' => false, 'error' => 'Category not found'], 404);
        return;
    }
    $dao->deleteCategory((int) $id);
    Flight::json(['success' => true]);
});

// ---- Admin: Menu Item CRUD ----

Flight::route('POST /menu/items', function (): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $body  = Flight::request()->data->getData();
    $name  = trim($body['name'] ?? '');
    $price = (float) ($body['price'] ?? 0);
    $catId = (int) ($body['category_id'] ?? 0);

    if (!$name || $price <= 0 || !$catId) {
        Flight::json(['success' => false, 'error' => 'name, price and category_id are required'], 400);
        return;
    }
    $item = (new MenuDao())->createItem([
        'category_id'    => $catId,
        'name'           => $name,
        'description'    => trim($body['description'] ?? ''),
        'price'          => round($price, 2),
        'image_url'      => trim($body['image_url'] ?? '') ?: null,
        'is_available'   => isset($body['is_available']) ? (int) $body['is_available'] : 1,
        'is_vegan'       => (int) ($body['is_vegan'] ?? 0),
        'is_vegetarian'  => (int) ($body['is_vegetarian'] ?? 0),
        'is_halal'       => (int) ($body['is_halal'] ?? 0),
        'is_gluten_free' => (int) ($body['is_gluten_free'] ?? 0),
        'is_spicy'       => (int) ($body['is_spicy'] ?? 0),
    ]);
    Flight::json(['success' => true, 'data' => $item], 201);
});

Flight::route('PUT /menu/items/@id:[0-9]+', function (string $id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $dao   = new MenuDao();
    $body  = Flight::request()->data->getData();
    $name  = trim($body['name'] ?? '');
    $price = (float) ($body['price'] ?? 0);
    $catId = (int) ($body['category_id'] ?? 0);

    if (!$name || $price <= 0 || !$catId) {
        Flight::json(['success' => false, 'error' => 'name, price and category_id are required'], 400);
        return;
    }
    if (!$dao->getItemById((int) $id)) {
        Flight::json(['success' => false, 'error' => 'Item not found'], 404);
        return;
    }
    $dao->updateItem((int) $id, [
        'category_id'    => $catId,
        'name'           => $name,
        'description'    => trim($body['description'] ?? ''),
        'price'          => round($price, 2),
        'image_url'      => trim($body['image_url'] ?? '') ?: null,
        'is_available'   => isset($body['is_available']) ? (int) $body['is_available'] : 1,
        'is_vegan'       => (int) ($body['is_vegan'] ?? 0),
        'is_vegetarian'  => (int) ($body['is_vegetarian'] ?? 0),
        'is_halal'       => (int) ($body['is_halal'] ?? 0),
        'is_gluten_free' => (int) ($body['is_gluten_free'] ?? 0),
        'is_spicy'       => (int) ($body['is_spicy'] ?? 0),
    ]);
    Flight::json(['success' => true]);
});

Flight::route('DELETE /menu/items/@id:[0-9]+', function (string $id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $dao = new MenuDao();
    if (!$dao->getItemById((int) $id)) {
        Flight::json(['success' => false, 'error' => 'Item not found'], 404);
        return;
    }
    $dao->deleteItem((int) $id);
    Flight::json(['success' => true]);
});
