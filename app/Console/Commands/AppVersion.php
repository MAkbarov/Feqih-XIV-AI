<?php

namespace App\Console\Commands;

use App\Models\Settings;
use Illuminate\Console\Command;

class AppVersion extends Command
{
    protected $signature = 'app:version {--set=} {--show}';
    protected $description = 'Manage application version';

    public function handle()
    {
        if ($this->option('set')) {
            $version = $this->option('set');
            Settings::set('app_version', $version);
            Settings::set('app_updated_at', now());
            
            $this->info("Application version set to: {$version}");
            $this->info("Updated at: " . now()->format('Y-m-d H:i:s'));
            
        } elseif ($this->option('show')) {
            $version = Settings::get('app_version', '1.0.0');
            $updatedAt = Settings::get('app_updated_at', 'Unknown');
            
            $this->info("Current version: {$version}");
            $this->info("Last updated: {$updatedAt}");
            
        } else {
            $this->info("Usage:");
            $this->info("  php artisan app:version --set=1.0.1");
            $this->info("  php artisan app:version --show");
        }
    }
}