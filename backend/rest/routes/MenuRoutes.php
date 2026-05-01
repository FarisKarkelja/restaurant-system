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
