<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:install {--db=} {--user=} {--pass=} {--host=127.0.0.1} {--port=3306}', function () {
    $this->info('Starting application installation...');

    $db = $this->option('db') ?: env('DB_DATABASE', 'chatbot');
    $user = $this->option('user') ?: env('DB_USERNAME', 'root');
    $pass = $this->option('pass') ?: env('DB_PASSWORD', '');
    $host = $this->option('host') ?: env('DB_HOST', '127.0.0.1');
    $port = (int) ($this->option('port') ?: env('DB_PORT', 3306));

    $driver = env('DB_CONNECTION', 'mysql');
    if ($driver !== 'mysql') {
        $this->warn("DB_CONNECTION is '{$driver}'. This installer currently supports MySQL only.");
    }

    // Create database if it does not exist
    try {
        $this->line('Creating database (if not exists)...');
        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
        $pdo = new \PDO($dsn, $user, $pass, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        $this->info("Database '{$db}' is ready.");
    } catch (\Throwable $e) {
        $this->error('Failed to create database: ' . $e->getMessage());
        return 1;
    }

    // Update .env with DB settings
    $this->line('Updating .env database configuration...');
    $envPath = base_path('.env');
    if (!file_exists($envPath)) {
        if (file_exists(base_path('.env.example'))) {
            copy(base_path('.env.example'), $envPath);
            $this->info('.env created from .env.example');
        } else {
            file_put_contents($envPath, "");
        }
    }

    $env = file_get_contents($envPath);
    $setEnv = function (string $key, string $value) use (&$env) {
        $pattern = "/^{$key}=.*$/m";
        $line = $key . '=' . (str_contains($value, ' ') ? '"'.$value.'"' : $value);
        if (preg_match($pattern, $env)) {
            $env = preg_replace($pattern, $line, $env);
        } else {
            $env .= (str_ends_with($env, "\n") ? '' : "\n") . $line . "\n";
        }
    };

    $setEnv('DB_CONNECTION', 'mysql');
    $setEnv('DB_HOST', $host);
    $setEnv('DB_PORT', (string) $port);
    $setEnv('DB_DATABASE', $db);
    $setEnv('DB_USERNAME', $user);
    $setEnv('DB_PASSWORD', $pass);

    file_put_contents($envPath, $env);
    $this->info('.env updated.');

    // Generate app key
    $this->line('Generating APP_KEY...');
    Artisan::call('key:generate', ['--force' => true]);
    $this->info('APP_KEY generated.');

    // Ensure sessions table migration exists if using database driver
    if (env('SESSION_DRIVER', 'file') === 'database') {
        $sessionMigrationExists = count(glob(database_path('migrations/*_create_sessions_table.php'))) > 0;
        if (!$sessionMigrationExists) {
            $this->line('Generating sessions table migration...');
            Artisan::call('session:table');
            $this->info('Sessions table migration created.');
        }
    }

    // Migrate and seed
    $this->line('Running database migrations...');
    Artisan::call('migrate', ['--force' => true]);
    $this->info('Migrations completed.');

    $this->line('Seeding initial data...');
    Artisan::call('db:seed', ['--force' => true]);
    $this->info('Seeding completed.');

    $this->info('Installation finished successfully ✅');

    return 0;
})->purpose('Install the application: create DB, migrate, and seed');

