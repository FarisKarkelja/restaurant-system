<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL ^ (E_NOTICE | E_DEPRECATED));

class Config {
    public static function DB_NAME() {
        return $_ENV['DB_NAME'] ?? '';
    }

    public static function DB_USER() {
        return $_ENV['DB_USER'] ?? '';
    }

    public static function DB_PASSWORD() {
        return $_ENV['DB_PASSWORD'] ?? '';
    }

    public static function DB_HOST() {
        return $_ENV['DB_HOST'] ?? '127.0.0.1';
    }

    public static function DB_PORT() {
        return $_ENV['DB_PORT'] ?? 3306;
    }

    public static function JWT_SECRET() {
        return $_ENV['JWT_SECRET'] ?? '';
    }
}