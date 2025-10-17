<?php

namespace App\Console\Commands;

use App\Models\Settings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class AutoUpdate extends Command
{
    protected $signature = 'app:update {--check} {--force}';
    protected $description = 'Auto-update application from repository';

    private $excludeFiles = [
        '.env',
        '.env.example',
        'storage/app/*',
        'storage/logs/*',
        'public/uploads/*',
        'database/database.sqlite'
    ];

    public function handle()
    {
        if ($this->option('check')) {
            return $this->checkForUpdates();
        }

        $this->performUpdate();
    }

    private function checkForUpdates()
    {
        $this->info("🔍 Checking for updates...");
        
        // Get current version
        $currentVersion = Settings::get('app_version', '1.0.0');
        
        // Fetch latest version from repository
        $latestVersion = $this->getLatestVersion();
        
        if (!$latestVersion) {
            $this->error("❌ Could not check for updates");
            return 1;
        }

        $this->info("Current version: {$currentVersion}");
        $this->info("Latest version: {$latestVersion}");

        if (version_compare($currentVersion, $latestVersion, '<')) {
            $this->info("🆕 Update available!");
            return 0;
        } else {
            $this->info("✅ You have the latest version");
            return 0;
        }
    }

    private function performUpdate()
    {
        try {
            $this->info("🔄 Starting auto-update process...");

            // 1. Enable maintenance mode
            $this->call('down', ['--message' => 'Updating...', '--retry' => 60]);

            // 2. Create backup
            $this->info("📦 Creating backup...");
            $this->call('db:backup', ['--filename' => 'pre_update_backup']);

            // 3. Fetch updates
            $this->info("⬇️ Downloading updates...");
            if (!$this->downloadUpdates()) {
                throw new \Exception("Failed to download updates");
            }

            // 4. Run migrations
            $this->info("🗄️ Updating database...");
            $this->call('migrate', ['--force' => true]);

            // 5. Clear caches
            $this->info("🧹 Clearing caches...");
            $this->call('config:clear');
            $this->call('route:clear');
            $this->call('view:clear');
            $this->call('cache:clear');

            // 6. Rebuild caches
            $this->info("🔧 Rebuilding caches...");
            $this->call('config:cache');
            $this->call('route:cache');
            $this->call('view:cache');

            // 7. Update version
            $latestVersion = $this->getLatestVersion();
            if ($latestVersion) {
                Settings::set('app_version', $latestVersion);
                Settings::set('app_updated_at', now());
            }

            // 8. Disable maintenance mode
            $this->call('up');

            $this->info("✅ Update completed successfully!");
            $this->info("🎉 Application updated to version: {$latestVersion}");

        } catch (\Exception $e) {
            $this->error("❌ Update failed: " . $e->getMessage());
            
            // Emergency: Bring site back online
            $this->call('up');
            
            return 1;
        }

        return 0;
    }

    private function downloadUpdates()
    {
        // Option 1: Using Git (if available)
        if ($this->isGitAvailable()) {
            return $this->gitPullUpdates();
        }

        // Option 2: Download ZIP from GitHub/GitLab
        return $this->downloadZipUpdates();
    }

    private function isGitAvailable()
    {
        $output = [];
        $returnVar = 0;
        exec('git --version 2>&1', $output, $returnVar);
        return $returnVar === 0 && File::exists('.git');
    }

    private function gitPullUpdates()
    {
        $commands = [
            'git fetch origin',
            'git reset --hard origin/main'
        ];

        foreach ($commands as $command) {
            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);
            
            if ($returnVar !== 0) {
                $this->error("Git command failed: {$command}");
                $this->error("Output: " . implode("\n", $output));
                return false;
            }
        }

        return true;
    }

    private function downloadZipUpdates()
    {
        // Implementation for downloading and extracting ZIP updates
        // This would download from your release URL
        $this->error("ZIP download not implemented yet");
        return false;
    }

    private function getLatestVersion()
    {
        try {
            // Get version from version.json file in repository
            $versionFile = base_path('version.json');
            if (File::exists($versionFile)) {
                $versionData = json_decode(File::get($versionFile), true);
                return $versionData['version'] ?? null;
            }

            // Fallback: try to get from git tags
            if ($this->isGitAvailable()) {
                $output = [];
                $returnVar = 0;
                exec('git describe --tags --abbrev=0 2>&1', $output, $returnVar);
                
                if ($returnVar === 0 && !empty($output)) {
                    return trim($output[0]);
                }
            }

            return null;

        } catch (\Exception $e) {
            $this->error("Error getting version: " . $e->getMessage());
            return null;
        }
    }
}