<?php
/**
 * XIV AI - Root Entry Point
 * Clean URLs without /public/ folder
 */

// Check if Laravel app is properly installed
$isInstalled = file_exists('.env') && file_exists('vendor/autoload.php') && file_exists('storage/installed.lock');

if (!$isInstalled) {
    // Not installed - redirect to installer
    header('Location: install.php');
    exit;
}

// Load Laravel application without public/ redirect
require_once __DIR__ . '/public/index.php';
