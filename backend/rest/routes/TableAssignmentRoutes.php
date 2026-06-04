<?php

// PROTECTED: All current table assignments (Admin only)
Flight::route('GET /assignments', function (): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    Flight::json(['success' => true, 'data' => (new TableAssignmentDao())->getAllAssignments()]);
});

// PROTECTED: Assign or reassign a waiter to a table (Admin only)
Flight::route('PUT /tables/@id:[0-9]+/assign', function (string $id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);

    $body      = Flight::request()->data->getData();
    $waiterId  = (int) ($body['waiter_id'] ?? 0);
    $adminUser = Flight::get('user');

    if (!$waiterId) {
        Flight::json(['success' => false, 'error' => 'waiter_id is required'], 400);
        return;
    }

    $user = (new AuthDao())->findById($waiterId);
    if (!$user) {
        Flight::json(['success' => false, 'error' => 'User not found'], 404);
        return;
    }
    if ($user['role'] !== Roles::WAITER) {
        Flight::json(['success' => false, 'error' => 'Only Waiters can be assigned to tables'], 422);
        return;
    }

    $table = (new TableDao())->getTableById((int) $id);
    if (!$table) {
        Flight::json(['success' => false, 'error' => 'Table not found'], 404);
        return;
    }

    $assignment = (new TableAssignmentDao())->assign((int) $id, $waiterId, (int) $adminUser->id);
    Flight::json(['success' => true, 'data' => $assignment]);
});

// PROTECTED: Remove waiter assignment from a table (Admin only)
Flight::route('DELETE /tables/@id:[0-9]+/assign', function (string $id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);

    $table = (new TableDao())->getTableById((int) $id);
    if (!$table) {
        Flight::json(['success' => false, 'error' => 'Table not found'], 404);
        return;
    }

    (new TableAssignmentDao())->unassign((int) $id);
    Flight::json(['success' => true]);
});
