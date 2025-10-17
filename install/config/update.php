<?php

return [
    /*
    |--------------------------------------------------------------------------
    | GitHub Repository Settings
    |--------------------------------------------------------------------------
    | Bu ayarları öz GitHub repository məlumatları ilə dəyişin
    |
    */
    
    'github' => [
        'username' => env('GITHUB_USERNAME', 'YOUR_GITHUB_USERNAME'),
        'repository' => env('GITHUB_REPOSITORY', 'YOUR_REPOSITORY_NAME'),
        'api_url' => env('GITHUB_API_URL', 'https://api.github.com/repos/{username}/{repository}/releases/latest'),
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Update Settings
    |--------------------------------------------------------------------------
    */
    
    'backup' => [
        'enabled' => true,
        'path' => storage_path('backups'),
        'keep_days' => 30, // How many days to keep backup files
    ],
    
    'update' => [
        'timeout' => 300, // 5 minutes timeout
        'allowed_environments' => ['production'], // Only allow updates in these environments
        'maintenance_message' => 'Sistem yenilənir, bir neçə dəqiqə sonra qayıdın',
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Excluded Files/Directories
    |--------------------------------------------------------------------------
    | Bu fayllar yeniləmə zamanı toxunulmayacaq
    |
    */
    
    'excluded_files' => [
        '.env',
        '.env.local',
        '.env.production',
        'storage/database.sqlite',
        'storage/logs',
        'storage/app/backups',
        'storage/framework/cache',
        'storage/framework/sessions',
        'storage/framework/views',
        'public/storage', // Symbolic link
        // 'config/update.php', // Uncomment if you don't want this config to be updated
    ],
    
    'excluded_directories' => [
        'vendor',
        'node_modules',
        'storage/logs',
        'storage/framework/cache',
        'storage/framework/sessions',
        'storage/framework/views',
        'storage/app/private',
    ]
];