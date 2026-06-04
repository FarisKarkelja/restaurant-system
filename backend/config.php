<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL ^ (E_NOTICE | E_DEPRECATED));

class Config
{
    private static array $env = [];

    private static function load(): void
    {
        if (!empty(self::$env)) {
            return;
        }
        $path = __DIR__ . '/.env';
        if (!file_exists($path)) {
            return;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            [$key, $val]      = explode('=', $line, 2) + [1 => ''];
            self::$env[trim($key)] = trim($val);
        }
    }

    private static function get(string $key, string $default = ''): string
    {
        self::load();
        return self::$env[$key] ?? $default;
    }

    public static function DB_NAME(): string     { return self::get('DB_NAME', 'serviqo'); }
    public static function DB_USER(): string     { return self::get('DB_USER', 'root'); }
    public static function DB_PASSWORD(): string { return self::get('DB_PASSWORD', ''); }
    public static function DB_HOST(): string     { return self::get('DB_HOST', '127.0.0.1'); }
    public static function DB_PORT(): int        { return (int) self::get('DB_PORT', '3306'); }
    public static function JWT_SECRET(): string  { return self::get('JWT_SECRET', 'change-this-secret-in-production'); }
}
