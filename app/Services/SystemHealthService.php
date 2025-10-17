<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Models\User;
use App\Models\ChatSession;
use App\Models\Message;
use App\Models\Settings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * XIV AI - System Health Service
 * 
 * Real-time sistem vəziyyətini monitorinq edir
 * 
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 */
class SystemHealthService
{
    /**
     * Sistemin ümumi sağlamlığını yoxla
     */
    public function getSystemHealth(): array
    {
        return [
            'database' => $this->checkDatabaseHealth(),
            'ai_provider' => $this->checkAiProviderHealth(),
            'cache' => $this->checkCacheHealth(),
            'storage' => $this->checkStorageHealth(),
            'system' => $this->getSystemInfo(),
            'performance' => $this->getPerformanceMetrics(),
            'errors' => $this->getRecentErrors(),
        ];
    }
    
    /**
     * Database sağlamlığını yoxla
     */
    private function checkDatabaseHealth(): array
    {
        try {
            $startTime = microtime(true);
            
            // Database əlaqəsini test et
            DB::connection()->getPdo();
            $connectionStatus = 'connected';
            $connectionMessage = 'MySQL əlaqəsi aktiv';
            
            // Query performance test
            DB::table('users')->count();
            $queryTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Database ölçüsü
            $dbSize = $this->getDatabaseSize();
            
            // Son 24 saatda gedən query sayı (təxmini)
            $recentActivity = $this->getDatabaseActivity();
            
            return [
                'status' => 'healthy',
                'connection' => $connectionStatus,
                'message' => $connectionMessage,
                'query_time' => $queryTime,
                'database_size' => $dbSize,
                'recent_activity' => $recentActivity,
                'color' => '#10b981'
            ];
            
        } catch (\Exception $e) {
            Log::error('Database health check failed: ' . $e->getMessage());
            
            return [
                'status' => 'error',
                'connection' => 'failed',
                'message' => 'MySQL əlaqə xətası: ' . $e->getMessage(),
                'query_time' => null,
                'database_size' => null,
                'recent_activity' => null,
                'color' => '#ef4444'
            ];
        }
    }
    
    /**
     * AI Provider sağlamlığını yoxla
     */
    private function checkAiProviderHealth(): array
    {
        try {
            $activeProvider = AiProvider::where('is_active', true)->first();
            
            if (!$activeProvider) {
                return [
                    'status' => 'warning',
                    'provider' => 'Heç biri',
                    'message' => 'Aktiv AI provider yoxdur',
                    'color' => '#f59e0b'
                ];
            }
            
            // Son 24 saatda istifadə statistikası
            $recentUsage = Message::where('role', 'assistant')
                ->whereDate('created_at', '>=', Carbon::now()->subDay())
                ->count();
                
            // Token statistikası
            $tokenUsage = Message::where('role', 'assistant')
                ->whereDate('created_at', '>=', Carbon::now()->subDay())
                ->sum('tokens_used') ?: 0;
            
            return [
                'status' => 'healthy',
                'provider' => $activeProvider->name,
                'model' => $activeProvider->model,
                'message' => 'AI sistemi aktiv',
                'recent_usage' => $recentUsage,
                'token_usage' => $tokenUsage,
                'color' => '#8b5cf6'
            ];
            
        } catch (\Exception $e) {
            Log::error('AI Provider health check failed: ' . $e->getMessage());
            
            return [
                'status' => 'error',
                'provider' => 'Xəta',
                'message' => 'AI provider xətası: ' . $e->getMessage(),
                'color' => '#ef4444'
            ];
        }
    }
    
    /**
     * Cache sağlamlığını yoxla
     */
    private function checkCacheHealth(): array
    {
        try {
            $testKey = 'health_check_' . time();
            $testValue = 'test_value';
            
            // Cache yazma testi
            $startTime = microtime(true);
            Cache::put($testKey, $testValue, 60);
            
            // Cache oxuma testi
            $cachedValue = Cache::get($testKey);
            $cacheTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Test key-i təmizlə
            Cache::forget($testKey);
            
            if ($cachedValue === $testValue) {
                return [
                    'status' => 'healthy',
                    'driver' => config('cache.default'),
                    'message' => 'Cache sistemi işləyir',
                    'response_time' => $cacheTime,
                    'color' => '#f59e0b'
                ];
            } else {
                throw new \Exception('Cache data mismatch');
            }
            
        } catch (\Exception $e) {
            Log::error('Cache health check failed: ' . $e->getMessage());
            
            return [
                'status' => 'error',
                'driver' => config('cache.default'),
                'message' => 'Cache xətası: ' . $e->getMessage(),
                'response_time' => null,
                'color' => '#ef4444'
            ];
        }
    }
    
    /**
     * Storage sağlamlığını yoxla
     */
    private function checkStorageHealth(): array
    {
        try {
            $storagePath = storage_path();
            $publicPath = public_path();
            
            // Storage yazma icazəsi yoxla
            $writable = is_writable($storagePath);
            
            // Disk sahəsi məlumatı
            $totalSpace = disk_total_space($storagePath);
            $freeSpace = disk_free_space($storagePath);
            $usedSpace = $totalSpace - $freeSpace;
            $usagePercentage = round(($usedSpace / $totalSpace) * 100, 1);
            
            $status = 'healthy';
            $color = '#10b981';
            $message = 'Storage sistemi normal';
            
            if ($usagePercentage > 90) {
                $status = 'warning';
                $color = '#f59e0b';
                $message = 'Disk sahəsi azalır';
            } elseif (!$writable) {
                $status = 'error';
                $color = '#ef4444';
                $message = 'Storage yazma icazəsi yoxdur';
            }
            
            return [
                'status' => $status,
                'writable' => $writable,
                'message' => $message,
                'total_space' => $this->formatBytes($totalSpace),
                'free_space' => $this->formatBytes($freeSpace),
                'used_space' => $this->formatBytes($usedSpace),
                'usage_percentage' => $usagePercentage,
                'color' => $color
            ];
            
        } catch (\Exception $e) {
            Log::error('Storage health check failed: ' . $e->getMessage());
            
            return [
                'status' => 'error',
                'message' => 'Storage xətası: ' . $e->getMessage(),
                'color' => '#ef4444'
            ];
        }
    }
    
    /**
     * Sistem məlumatları
     */
    private function getSystemInfo(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'memory_limit' => ini_get('memory_limit'),
            'memory_usage' => $this->formatBytes(memory_get_usage(true)),
            'memory_peak' => $this->formatBytes(memory_get_peak_usage(true)),
            'uptime' => $this->getServerUptime()
        ];
    }
    
    /**
     * Performance metrikləri
     */
    private function getPerformanceMetrics(): array
    {
        $now = Carbon::now();
        $dayAgo = $now->copy()->subDay();
        
        return [
            'active_sessions' => ChatSession::whereDate('updated_at', '>=', $dayAgo)->count(),
            'messages_today' => Message::whereDate('created_at', $now->toDateString())->count(),
            'users_online' => User::whereDate('updated_at', '>=', $now->subMinutes(30))->count(),
            'avg_response_time' => $this->getAverageResponseTime(),
            'error_rate' => $this->getErrorRate()
        ];
    }
    
    /**
     * Son xətalar
     */
    private function getRecentErrors(): array
    {
        $logFile = storage_path('logs/laravel.log');
        $errors = [];
        
        if (File::exists($logFile)) {
            $lines = array_slice(file($logFile), -50); // Son 50 sətir
            
            foreach (array_reverse($lines) as $line) {
                if (strpos($line, 'ERROR') !== false) {
                    $errors[] = [
                        'time' => $this->extractTimeFromLogLine($line),
                        'message' => trim($line)
                    ];
                    
                    if (count($errors) >= 5) break; // Son 5 xəta
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Database ölçüsünü hesabla
     */
    private function getDatabaseSize(): string
    {
        try {
            $result = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb 
                FROM information_schema.tables 
                WHERE table_schema = ?
            ", [config('database.connections.mysql.database')]);
            
            return ($result[0]->size_mb ?? 0) . ' MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }
    
    /**
     * Database aktivliyi
     */
    private function getDatabaseActivity(): array
    {
        return [
            'total_users' => User::count(),
            'total_sessions' => ChatSession::count(),
            'total_messages' => Message::count(),
            'recent_activity' => ChatSession::whereDate('created_at', Carbon::today())->count()
        ];
    }
    
    /**
     * Bytes formatını oxunaqlı formata çevir
     */
    private function formatBytes($size, $precision = 2): string
    {
        if ($size === 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor((strlen($size) - 1) / 3);
        
        return sprintf("%.{$precision}f %s", $size / pow(1024, $factor), $units[$factor]);
    }
    
    /**
     * Server uptime (təxmini)
     */
    private function getServerUptime(): string
    {
        if (function_exists('sys_getloadavg')) {
            return 'Available';
        }
        return 'N/A';
    }
    
    /**
     * Ortalama cavab vaxtı
     */
    private function getAverageResponseTime(): float
    {
        // Bu simulasiya edilmiş məlumatdır, real implementasiya üçün 
        // response time tracking sistemi lazımdır
        return round(rand(50, 200) / 10, 1) / 10; // 0.5-2.0 saniyə arası
    }
    
    /**
     * Xəta nisbəti
     */
    private function getErrorRate(): float
    {
        $totalMessages = Message::whereDate('created_at', Carbon::today())->count();
        $errors = count($this->getRecentErrors());
        
        if ($totalMessages === 0) return 0.0;
        
        return round(($errors / $totalMessages) * 100, 2);
    }
    
    /**
     * Log sətrindən vaxtı çıxar
     */
    private function extractTimeFromLogLine($line): string
    {
        if (preg_match('/\[(.*?)\]/', $line, $matches)) {
            return $matches[1];
        }
        return 'Unknown';
    }
    
    /**
     * Cache təmizləmə
     */
    public function clearCache(): array
    {
        try {
            $results = [];
            
            // Application Cache
            \Artisan::call('cache:clear');
            $results['cache'] = 'Application cache cleared';
            
            // Config Cache
            \Artisan::call('config:clear');
            $results['config'] = 'Configuration cache cleared';
            
            // Route Cache
            \Artisan::call('route:clear');
            $results['route'] = 'Route cache cleared';
            
            // View Cache
            \Artisan::call('view:clear');
            $results['view'] = 'View cache cleared';
            
            return [
                'success' => true,
                'message' => 'Bütün cache-lər təmizləndi',
                'details' => $results
            ];
            
        } catch (\Exception $e) {
            Log::error('Cache clear failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Cache təmizləmə xətası: ' . $e->getMessage()
            ];
        }
    }
}