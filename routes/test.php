<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-simple', function () {
    return response()->json([
        'status' => 'working',
        'laravel_version' => app()->version(),
        'php_version' => PHP_VERSION,
        'time' => now()->toDateTimeString()
    ]);
});