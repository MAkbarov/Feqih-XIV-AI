<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * XIV AI - Admin Notification Model
 * 
 * Sistem bildirişlərini idarə edir
 * 
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 */
class AdminNotification extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'type',
        'title',
        'message',
        'priority',
        'data',
        'icon',
        'color',
        'is_read',
        'is_important',
        'expires_at'
    ];
    
    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'is_important' => 'boolean',
        'expires_at' => 'datetime'
    ];
    
    /**
     * Yalnız aktiv bildirişləri gətir (müddəti keçməmiş)
     */
    public function scopeActive($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }
    
    /**
     * Oxunmamış bildirişləri gətir
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
    
    /**
     * Mühüm bildirişləri gətir
     */
    public function scopeImportant($query)
    {
        return $query->where('is_important', true);
    }
    
    /**
     * Prioritetə görə sıralama
     */
    public function scopeByPriority($query)
    {
        return $query->orderByRaw("
            CASE priority 
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2  
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END
        ");
    }
    
    /**
     * Bildirişi oxunmuş kimi işarələ
     */
    public function markAsRead(): void
    {
        $this->update(['is_read' => true]);
    }
    
    /**
     * Bildirişi mühüm kimi işarələ
     */
    public function markAsImportant(): void
    {
        $this->update(['is_important' => true]);
    }
    
    /**
     * Sistem xətası bildirişi yarat
     */
    public static function createSystemError(string $title, string $message, array $data = []): self
    {
        return self::create([
            'type' => 'system_error',
            'title' => $title,
            'message' => $message,
            'priority' => 'high',
            'data' => $data,
            'icon' => 'warning',
            'color' => '#ef4444',
            'is_important' => true,
            'expires_at' => now()->addDays(7)
        ]);
    }
    
    /**
     * Təhlükəsizlik xəbərdarlığı yarat
     */
    public static function createSecurityAlert(string $title, string $message, array $data = []): self
    {
        return self::create([
            'type' => 'security_alert',
            'title' => $title,
            'message' => $message,
            'priority' => 'critical',
            'data' => $data,
            'icon' => 'shield_check',
            'color' => '#dc2626',
            'is_important' => true,
            'expires_at' => now()->addDays(30)
        ]);
    }
    
    /**
     * Xəbərdarlıq bildirişi yarat
     */
    public static function createWarning(string $title, string $message, array $data = []): self
    {
        return self::create([
            'type' => 'warning',
            'title' => $title,
            'message' => $message,
            'priority' => 'medium',
            'data' => $data,
            'icon' => 'warning',
            'color' => '#f59e0b',
            'is_important' => false,
            'expires_at' => now()->addDays(3)
        ]);
    }
    
    /**
     * Məlumat bildirişi yarat
     */
    public static function createInfo(string $title, string $message, array $data = []): self
    {
        return self::create([
            'type' => 'info',
            'title' => $title,
            'message' => $message,
            'priority' => 'low',
            'data' => $data,
            'icon' => 'info',
            'color' => '#3b82f6',
            'is_important' => false,
            'expires_at' => now()->addDay()
        ]);
    }
    
    /**
     * Müddəti keçmiş bildirişləri təmizlə
     */
    public static function cleanExpired(): int
    {
        return self::whereNotNull('expires_at')
                   ->where('expires_at', '<', now())
                   ->delete();
    }
    
    /**
     * Bütün bildirişləri oxunmuş kimi işarələ
     */
    public static function markAllAsRead(): int
    {
        return self::unread()->update(['is_read' => true]);
    }
    
    /**
     * Oxunmamış bildirişlərin sayı
     */
    public static function getUnreadCount(): int
    {
        return self::active()->unread()->count();
    }
    
    /**
     * Mühüm bildirişlərin sayı
     */
    public static function getImportantCount(): int
    {
        return self::active()->important()->unread()->count();
    }
    
    /**
     * Son bildirişləri gətir
     */
    public static function getRecent(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return self::active()
            ->byPriority()
            ->latest()
            ->limit($limit)
            ->get();
    }
    
    /**
     * Bildirişin formatlanmış vaxtı
     */
    public function getFormattedTimeAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }
    
    /**
     * Bildirişin priority badge rəngini gətir
     */
    public function getPriorityBadgeColorAttribute(): string
    {
        return match($this->priority) {
            'critical' => '#dc2626',
            'high' => '#ea580c',
            'medium' => '#f59e0b',
            'low' => '#10b981',
            default => '#6b7280'
        };
    }
    
    /**
     * Bildirişin priority mətni (Azərbaycan dilində)
     */
    public function getPriorityTextAttribute(): string
    {
        return match($this->priority) {
            'critical' => 'Kritik',
            'high' => 'Yüksək',
            'medium' => 'Orta',
            'low' => 'Aşağı',
            default => 'Naməlum'
        };
    }
}
