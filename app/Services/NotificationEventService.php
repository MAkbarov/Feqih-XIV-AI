<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\IpSecurityLog;
use Illuminate\Support\Facades\Log;

/**
 * XIV AI - Notification Event Service
 * 
 * Sistem hadisələrinə görə avtomatik bildiriş yaradır
 * 
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 */
class NotificationEventService
{
    /**
     * Sistem xətası bildirişi yarat
     */
    public function createSystemErrorNotification(string $error, array $context = []): void
    {
        try {
            $title = 'Sistem Xətası';
            $message = "Sistemdə xəta baş verdi: {$error}";
            
            $data = [
                'error_type' => 'system_error',
                'error_message' => $error,
                'context' => $context,
                'timestamp' => now()->toISOString(),
                'user_agent' => request()->userAgent(),
                'ip_address' => request()->ip(),
            ];
            
            AdminNotification::createSystemError($title, $message, $data);
            
            // Log this as well
            Log::error('System Error Notification Created', $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to create system error notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Təhlükəsizlik xəbərdarlığı bildirişi yarat
     */
    public function createSecurityAlertNotification(string $alertType, array $details = []): void
    {
        try {
            $title = match($alertType) {
                'suspicious_activity' => 'Şübhəli Aktivlik',
                'failed_login' => 'Uğursuz Giriş Cəhdləri',
                'ip_blocked' => 'IP Bloklandı',
                'multiple_requests' => 'Çoxlu Sorğu',
                'unauthorized_access' => 'İcazəsiz Giriş',
                default => 'Təhlükəsizlik Xəbərdarlığı'
            };
            
            $message = $this->generateSecurityMessage($alertType, $details);
            
            $data = [
                'alert_type' => $alertType,
                'details' => $details,
                'timestamp' => now()->toISOString(),
                'severity' => $this->getSecuritySeverity($alertType),
            ];
            
            AdminNotification::createSecurityAlert($title, $message, $data);
            
            // Log security event
            Log::warning('Security Alert Notification Created', $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to create security alert notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Cache problemi bildirişi yarat
     */
    public function createCacheWarningNotification(string $issue, array $details = []): void
    {
        try {
            $title = 'Cache Sistemi Xəbərdarlığı';
            $message = "Cache sistemində problem: {$issue}";
            
            $data = [
                'cache_issue' => $issue,
                'details' => $details,
                'timestamp' => now()->toISOString(),
                'cache_driver' => config('cache.default'),
            ];
            
            AdminNotification::createWarning($title, $message, $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to create cache warning notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Storage problemi bildirişi yarat
     */
    public function createStorageWarningNotification(string $issue, array $details = []): void
    {
        try {
            $title = 'Storage Sistemi Xəbərdarlığı';
            $message = "Storage sistemində problem: {$issue}";
            
            $data = [
                'storage_issue' => $issue,
                'details' => $details,
                'timestamp' => now()->toISOString(),
            ];
            
            AdminNotification::createWarning($title, $message, $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to create storage warning notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Database problemi bildirişi yarat
     */
    public function createDatabaseErrorNotification(string $error, array $context = []): void
    {
        try {
            $title = 'Database Xətası';
            $message = "Database əlaqəsində problem: {$error}";
            
            $data = [
                'database_error' => $error,
                'context' => $context,
                'timestamp' => now()->toISOString(),
                'connection' => config('database.default'),
            ];
            
            AdminNotification::createSystemError($title, $message, $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to create database error notification: ' . $e->getMessage());
        }
    }
    
    /**
     * AI Provider problemi bildirişi yarat
     */
    public function createAiProviderWarning(string $provider, string $issue, array $details = []): void
    {
        try {
            $title = 'AI Provider Xəbərdarlığı';
            $message = "{$provider} provider-də problem: {$issue}";
            
            $data = [
                'provider' => $provider,
                'issue' => $issue,
                'details' => $details,
                'timestamp' => now()->toISOString(),
            ];
            
            AdminNotification::createWarning($title, $message, $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to create AI provider warning notification: ' . $e->getMessage());
        }
    }
    
    /**
     * IP Security log-dan bildiriş yarat
     */
    public function createIpSecurityNotification(IpSecurityLog $ipLog): void
    {
        try {
            $alertType = match($ipLog->action_type) {
                'blocked_duplicate' => 'ip_blocked',
                'rate_limited' => 'multiple_requests',
                'suspicious_activity' => 'suspicious_activity',
                default => 'suspicious_activity'
            };
            
            $details = [
                'ip_address' => $ipLog->ip_address,
                'user_agent' => $ipLog->user_agent,
                'action_type' => $ipLog->action_type,
                'attempt_count' => $ipLog->attempt_count,
                'risk_score' => $ipLog->risk_score,
                'additional_info' => $ipLog->additional_info,
                'log_id' => $ipLog->id,
            ];
            
            $this->createSecurityAlertNotification($alertType, $details);
            
        } catch (\Exception $e) {
            Log::error('Failed to create IP security notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Sistem sağlamlığı məlumat bildirişi
     */
    public function createSystemHealthInfo(array $healthData): void
    {
        try {
            $issues = [];
            $warnings = 0;
            
            // Database issues
            if (isset($healthData['database']['status']) && $healthData['database']['status'] !== 'healthy') {
                $issues[] = 'Database: ' . $healthData['database']['message'];
                $warnings++;
            }
            
            // Cache issues  
            if (isset($healthData['cache']['status']) && $healthData['cache']['status'] !== 'healthy') {
                $issues[] = 'Cache: ' . $healthData['cache']['message'];
                $warnings++;
            }
            
            // Storage issues
            if (isset($healthData['storage']['status']) && $healthData['storage']['status'] !== 'healthy') {
                $issues[] = 'Storage: ' . $healthData['storage']['message'];
                $warnings++;
            }
            
            // AI Provider issues
            if (isset($healthData['ai_provider']['status']) && $healthData['ai_provider']['status'] !== 'healthy') {
                $issues[] = 'AI Provider: ' . $healthData['ai_provider']['message'];
                $warnings++;
            }
            
            if ($warnings > 0) {
                $title = 'Sistem Sağlamlığı Xəbərdarlığı';
                $message = $warnings . ' sistemdə problem aşkarlandı: ' . implode(', ', $issues);
                
                $data = [
                    'health_check' => $healthData,
                    'issues_count' => $warnings,
                    'issues' => $issues,
                    'timestamp' => now()->toISOString(),
                ];
                
                AdminNotification::createWarning($title, $message, $data);
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to create system health notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Disk sahəsi azaldıqda xəbərdarlıq
     */
    public function createDiskSpaceWarning(float $usagePercentage, string $freeSpace): void
    {
        try {
            $title = 'Disk Sahəsi Xəbərdarlığı';
            $message = "Disk sahəsi {$usagePercentage}% dolu. Qalan sahə: {$freeSpace}";
            
            $data = [
                'usage_percentage' => $usagePercentage,
                'free_space' => $freeSpace,
                'threshold' => 90,
                'timestamp' => now()->toISOString(),
            ];
            
            if ($usagePercentage > 95) {
                AdminNotification::createSystemError($title, $message, $data);
            } else {
                AdminNotification::createWarning($title, $message, $data);
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to create disk space warning notification: ' . $e->getMessage());
        }
    }
    
    /**
     * Təhlükəsizlik mesajı yaradır
     */
    private function generateSecurityMessage(string $alertType, array $details): string
    {
        $ip = $details['ip_address'] ?? 'Naməlum IP';
        
        return match($alertType) {
            'suspicious_activity' => "Şübhəli aktivlik aşkarlandı. IP: {$ip}",
            'failed_login' => "Çoxlu uğursuz giriş cəhdi. IP: {$ip}",
            'ip_blocked' => "IP ünvanı bloklandı: {$ip}",
            'multiple_requests' => "Həddən artıq sorğu göndərildi. IP: {$ip}",
            'unauthorized_access' => "İcazəsiz giriş cəhdi. IP: {$ip}",
            default => "Təhlükəsizlik hadisəsi baş verdi. IP: {$ip}"
        };
    }
    
    /**
     * Təhlükəsizlik hadisəsinin ciddiliyini müəyyən edir
     */
    private function getSecuritySeverity(string $alertType): string
    {
        return match($alertType) {
            'unauthorized_access' => 'critical',
            'suspicious_activity' => 'high',
            'ip_blocked' => 'high',
            'multiple_requests' => 'medium',
            'failed_login' => 'medium',
            default => 'medium'
        };
    }
    
    /**
     * Bildiriş yaratma zamanı callback-ləri çağır
     */
    public function triggerNotificationCallbacks(AdminNotification $notification): void
    {
        try {
            // Critical bildirişlər üçün əlavə əməliyyatlar
            if ($notification->priority === 'critical') {
                $this->handleCriticalNotification($notification);
            }
            
            // Security bildirişləri üçün əlavə təhlükəsizlik tədbirləri
            if ($notification->type === 'security_alert') {
                $this->handleSecurityNotification($notification);
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to trigger notification callbacks: ' . $e->getMessage());
        }
    }
    
    /**
     * Kritik bildirişlər üçün əlavə əməliyyatlar
     */
    private function handleCriticalNotification(AdminNotification $notification): void
    {
        // Bu hissəni genişləndirmək olar:
        // - Email göndərmək
        // - SMS göndərmək  
        // - Slack/Discord webhook-u
        // - Push notification
        
        Log::critical('Critical notification created', [
            'notification_id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
        ]);
    }
    
    /**
     * Təhlükəsizlik bildirişləri üçün əlavə tədbirlər
     */
    private function handleSecurityNotification(AdminNotification $notification): void
    {
        // Bu hissəni genişləndirmək olar:
        // - IP bloklama
        // - Rate limiting artırma
        // - Firewall qaydaları yenilənməsi
        
        Log::warning('Security notification created', [
            'notification_id' => $notification->id,
            'title' => $notification->title,
            'data' => $notification->data,
        ]);
    }
}