<?php

// If app is not installed yet, load the bundled web installer directly (works on artisan serve)
if (!file_exists(__DIR__.'/../.env') || !file_exists(__DIR__.'/../storage/installed.lock')) {
    $localInstaller = __DIR__ . '/../install/index.php';
    if (file_exists($localInstaller)) {
        // Include installer UI directly when running behind public/ (artisan serve)
        require $localInstaller;
        exit;
    }
    // Fallback to URL redirect (for shared hosting where install/ is web-accessible)
    header('Location: /install/setup.php');
    exit;
}

// Check if vendor directory exists (composer dependencies installed)
if (!file_exists(__DIR__.'/../vendor/autoload.php')) {
    // Show error about missing vendor
    die('<h1>Missing Dependencies</h1><p>The vendor directory is missing. Please install composer dependencies or contact your hosting provider.</p>');
}

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());

