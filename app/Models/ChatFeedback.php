<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ChatFeedback extends Model
{
    protected $table = 'chat_feedback';
    
    protected $fillable = [
        'session_id',
        'message_id', 
        'user_type',
        'user_name',
        'user_email',
        'feedback_type',
        'message_content',
        'user_comment',
        'ip_address',
        'user_agent'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Feedback type sabitlər
    const FEEDBACK_LIKE = 'like';
    const FEEDBACK_DISLIKE = 'dislike'; 
    const FEEDBACK_REPORT = 'report';
    
    // User type sabitlər
    const USER_TYPE_GUEST = 'guest';
    const USER_TYPE_USER = 'user';
    
    /**
     * Feedback statistikalarını al
     */
    public static function getStats($dateFrom = null, $dateTo = null)
    {
        $query = static::query();
        
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
        
        return [
            'total_feedback' => $query->count(),
            'likes' => (clone $query)->where('feedback_type', self::FEEDBACK_LIKE)->count(),
            'dislikes' => (clone $query)->where('feedback_type', self::FEEDBACK_DISLIKE)->count(),
            'reports' => (clone $query)->where('feedback_type', self::FEEDBACK_REPORT)->count(),
            'guest_feedback' => (clone $query)->where('user_type', self::USER_TYPE_GUEST)->count(),
            'user_feedback' => (clone $query)->where('user_type', self::USER_TYPE_USER)->count(),
        ];
    }
    
    /**
     * Son feedback-ləri al
     */
    public static function getRecentFeedback($limit = 20)
    {
        return static::latest()
            ->limit($limit)
            ->get();
    }
    
    /**
     * Günlük statistika
     */
    public static function getDailyStats($days = 30)
    {
        return static::selectRaw('DATE(created_at) as date, feedback_type, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date', 'feedback_type')
            ->orderBy('date', 'desc')
            ->get();
    }
}
