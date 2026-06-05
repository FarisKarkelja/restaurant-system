<?php

use Firebase\JWT\JWT;

Flight::route('POST /auth/login', function (): void {
    $dao  = new AuthDao();
    $body = Flight::request()->data->getData();

    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        Flight::json(['success' => false, 'error' => 'Missing data'], 400);
        return;
    }

    $user = $dao->findByEmail($email);

    if (!$user) {
        Flight::json(['success' => false, 'error' => 'Invalid email or password'], 401);
        return;
    }

    // Brute-force: check lock
    if (!empty($user['locked_until']) && strtotime($user['locked_until']) > time()) {
        $remaining = (int) ceil((strtotime($user['locked_until']) - time()) / 60);
        Flight::json([
            'success' => false,
            'error'   => "Account locked. Try again in {$remaining} minute(s).",
        ], 429);
        return;
    }

    if (!password_verify($password, $user['password'])) {
        $attempts = $dao->incrementFailedAttempts((int) $user['id']);
        if ($attempts >= 3) {
            $dao->lockAccount((int) $user['id'], 10);
            Flight::json([
                'success' => false,
                'error'   => 'Too many failed attempts. Account locked for 10 minutes.',
            ], 429);
            return;
        }
        Flight::json(['success' => false, 'error' => 'Invalid email or password'], 401);
        return;
    }

    $dao->resetFailedAttempts((int) $user['id']);

    $payload = [
        'iat'  => time(),
        'exp'  => time() + 3600,
        'user' => [
            'id'    => (int) $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ],
    ];

    $token = JWT::encode($payload, Config::JWT_SECRET(), 'HS256');

    Flight::json([
        'success' => true,
        'token'   => $token,
        'user'    => [
            'id'    => (int) $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ],
    ]);
});

Flight::route('POST /auth/register', function (): void {
    $dao  = new AuthDao();
    $body = Flight::request()->data->getData();

    $name     = trim($body['name'] ?? '');
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$name || !$email || !$password) {
        Flight::json(['success' => false, 'error' => 'Missing data'], 400);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Flight::json(['success' => false, 'error' => 'Invalid email format'], 422);
        return;
    }

    if (strlen($password) < 8) {
        Flight::json(['success' => false, 'error' => 'Weak password'], 422);
        return;
    }

    // Require at least one uppercase letter and one digit for strength
    if (!preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
        Flight::json(['success' => false, 'error' => 'Weak password'], 422);
        return;
    }

    if ($dao->emailExists($email)) {
        Flight::json(['success' => false, 'error' => 'Email already taken'], 409);
        return;
    }

    $id = $dao->createUser($name, $email, $password);

    Flight::json(['success' => true, 'id' => $id], 201);
});

Flight::route('GET /auth/me', function (): void {
    $user = Flight::get('user');
    $dao  = new AuthDao();
    $data = $dao->findById((int) $user->id);

    if (!$data) {
        Flight::json(['success' => false, 'error' => 'User not found'], 404);
        return;
    }
    Flight::json(['success' => true, 'data' => $data]);
});

Flight::route('PUT /auth/profile', function (): void {
    $user = Flight::get('user');
    $body = Flight::request()->data->getData();
    $name = trim($body['name'] ?? '');

    if (!$name) {
        Flight::json(['success' => false, 'error' => 'Empty field provided'], 400);
        return;
    }

    (new AuthDao())->updateProfile((int) $user->id, $name);
    Flight::json(['success' => true, 'message' => 'Changes saved']);
});

Flight::route('DELETE /auth/account', function (): void {
    $user = Flight::get('user');
    (new AuthDao())->deleteAccount((int) $user->id);
    Flight::json(['success' => true, 'message' => 'Account deleted']);
});

// Admin: list all users
Flight::route('GET /auth/users', function (): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    Flight::json(['success' => true, 'data' => (new AuthDao())->getAllUsers()]);
});

// Admin: delete a user
Flight::route('DELETE /auth/users/@id:[0-9]+', function ($id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $me = Flight::get('user');
    if ((int) $id === (int) $me->id) {
        Flight::json(['success' => false, 'error' => 'Cannot delete your own account'], 400);
        return;
    }
    (new AuthDao())->deleteAccount((int) $id);
    Flight::json(['success' => true]);
});

// Admin: update user role
Flight::route('PUT /auth/users/@id:[0-9]+/role', function ($id): void {
    Flight::authMiddleware()->authorizeRole(Roles::ADMIN);
    $body = Flight::request()->data->getData();
    $role = $body['role'] ?? '';

    if (!in_array($role, [Roles::ADMIN, Roles::WAITER, Roles::USER], true)) {
        Flight::json(['success' => false, 'error' => 'Invalid role'], 422);
        return;
    }
    (new AuthDao())->updateUserRole((int) $id, $role);
    Flight::json(['success' => true]);
});
