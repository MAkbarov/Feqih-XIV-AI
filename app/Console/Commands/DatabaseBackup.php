<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DatabaseBackup extends Command
{
    protected $signature = 'db:backup {--filename=backup}';
    protected $description = 'Create a database backup';

    public function handle()
    {
        $filename = $this->option('filename');
        $timestamp = date('Ymd_His');
        $backupFile = storage_path("backups/{$filename}_{$timestamp}.sql");

        // Create backups directory if not exists
        $backupDir = storage_path('backups');
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        try {
            $dbHost = config('database.connections.mysql.host');
            $dbName = config('database.connections.mysql.database');
            $dbUser = config('database.connections.mysql.username');
            $dbPass = config('database.connections.mysql.password');

            $command = sprintf(
                'mysqldump -h%s -u%s -p%s %s > %s',
                escapeshellarg($dbHost),
                escapeshellarg($dbUser),
                escapeshellarg($dbPass),
                escapeshellarg($dbName),
                escapeshellarg($backupFile)
            );

            $output = [];
            $returnVar = 0;
            exec($command, $output, $returnVar);

            if ($returnVar === 0 && file_exists($backupFile)) {
                $this->info("Database backup created: {$backupFile}");
                return 0;
            } else {
                $this->error("Failed to create database backup");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("Backup error: " . $e->getMessage());
            return 1;
        }
    }
}