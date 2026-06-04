<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    public function verifyToken($token) {
        if (!$token) {
            throw new \Exception('Missing or invalid Authorization header');
        }
        $decoded_token = JWT::decode($token, new Key(Config::JWT_SECRET(), 'HS256'));
        Flight::set('user', $decoded_token->user);
        Flight::set('jwt_token', $token);
        return true;
    }

    public function authorizeRole($requiredRole) {
        $user = Flight::get('user');
        if ($user->role !== $requiredRole) {
            Flight::halt(403, "Access denied. You don't have the required role to perform this action.");
        }
    }

    public function authorizeRoles($roles) {
        $user = Flight::get('user');
        if (!in_array($user->role, $roles)) {
            Flight::halt(403, "Access denied. You don't have the required role to perform this action.");
        }
    }

    public function authorizePermission($permission) {
        $user = Flight::get('user');
        if (!in_array($permission, $user->permissions)) {
            Flight::halt(403, "Access denied. You don't have the required permission to perform this action.");
        }
    }
}