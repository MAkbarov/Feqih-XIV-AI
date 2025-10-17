<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class VersionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:version {action} {version?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage application version (show, set, bump)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');
        $version = $this->argument('version');
        
        switch ($action) {
            case 'show':
                $this->showVersion();
                break;
            case 'set':
                if (!$version) {
                    $this->error('Version parameter is required for set action');
                    return 1;
                }
                $this->setVersion($version);
                break;
            case 'bump':
                $bumpType = $version ?: 'patch'; // default to patch
                $this->bumpVersion($bumpType);
                break;
            default:
                $this->error('Invalid action. Use: show, set, bump');
                return 1;
        }
        
        return 0;
    }
    
    private function showVersion()
    {
        $versionData = $this->getVersionData();
        
        $this->info('Current Application Version: ' . $versionData['version']);
        if (isset($versionData['updated_at'])) {
            $this->line('Last updated: ' . $versionData['updated_at']);
        }
        if (isset($versionData['updated_by'])) {
            $this->line('Updated by: ' . $versionData['updated_by']);
        }
    }
    
    private function setVersion($version)
    {
        if (!preg_match('/^\d+\.\d+\.\d+$/', $version)) {
            $this->error('Version must be in semantic versioning format (e.g., 1.0.0)');
            return;
        }
        
        $versionData = [
            'version' => $version,
            'updated_at' => now()->toISOString(),
            'updated_by' => 'artisan-command'
        ];
        
        $this->saveVersionData($versionData);
        $this->info('Version set to: ' . $version);
    }
    
    private function bumpVersion($type)
    {
        $versionData = $this->getVersionData();
        $currentVersion = $versionData['version'];
        
        $parts = explode('.', $currentVersion);
        $major = (int) $parts[0];
        $minor = (int) $parts[1];
        $patch = (int) $parts[2];
        
        switch ($type) {
            case 'major':
                $major++;
                $minor = 0;
                $patch = 0;
                break;
            case 'minor':
                $minor++;
                $patch = 0;
                break;
            case 'patch':
            default:
                $patch++;
                break;
        }
        
        $newVersion = "{$major}.{$minor}.{$patch}";
        
        $versionData = [
            'version' => $newVersion,
            'updated_at' => now()->toISOString(),
            'updated_by' => 'artisan-command'
        ];
        
        $this->saveVersionData($versionData);
        $this->info('Version bumped from ' . $currentVersion . ' to ' . $newVersion);
    }
    
    private function getVersionData()
    {
        $versionFile = base_path('version.json');
        
        if (!File::exists($versionFile)) {
            return ['version' => '1.0.0'];
        }
        
        return json_decode(File::get($versionFile), true);
    }
    
    private function saveVersionData($data)
    {
        $versionFile = base_path('version.json');
        File::put($versionFile, json_encode($data, JSON_PRETTY_PRINT));
    }
}
