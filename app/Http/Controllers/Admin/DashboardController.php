<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ChatSession;
use App\Models\Message;
use App\Models\AiProvider;
use App\Models\IpSecurityLog;
use App\Models\AdminNotification;
use App\Services\ChatLimitService;
use App\Services\SystemHealthService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Admin\Traits\HasFooterData;
use App\Models\FooterSetting;

class DashboardController extends Controller
{
    use HasFooterData;
    
    private ChatLimitService $chatLimitService;
    private SystemHealthService $systemHealthService;
    
    public function __construct(ChatLimitService $chatLimitService, SystemHealthService $systemHealthService)
    {
        $this->chatLimitService = $chatLimitService;
        $this->systemHealthService = $systemHealthService;
    }
    
    public function index(): Response
    {
        // Clean expired notifications periodically
        try {
            AdminNotification::cleanExpired();
        } catch (\Exception $e) {
            // Silently fail if admin_notifications table doesn't exist yet
            \Log::debug('AdminNotification cleanExpired failed: ' . $e->getMessage());
        }
        $stats = [
            'users' => User::count(),
            'sessions' => ChatSession::count(),
            'messages' => Message::count(),
            'providers' => AiProvider::count(),
            'ip_security_logs' => IpSecurityLog::count(),
            'unresolved_ip_logs' => IpSecurityLog::where('is_resolved', false)->count(),
        ];
        
        // Get IP Security Statistics
        $ipSecurityStats = [
            'total_security_logs' => IpSecurityLog::count(),
            'unresolved_security_logs' => IpSecurityLog::unresolved()->count(),
            'blocked_attempts_today' => IpSecurityLog::where('action_type', 'blocked_duplicate')
                ->whereDate('created_at', today())
                ->count(),
            'recent_blocked_ips' => IpSecurityLog::where('action_type', 'blocked_duplicate')
                ->where('is_resolved', false)
                ->limit(5)
                ->pluck('ip_address')
                ->unique()
                ->values()
                ->toArray()
        ];

        // Get system health data
        $systemHealth = $this->systemHealthService->getSystemHealth();
        
        // Get notification stats
        try {
            $notificationStats = [
                'total_notifications' => AdminNotification::active()->count(),
                'unread_notifications' => AdminNotification::getUnreadCount(),
                'important_notifications' => AdminNotification::getImportantCount(),
                'recent_notifications' => AdminNotification::getRecent(5)->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'priority' => $notification->priority,
                        'priority_text' => $notification->priority_text,
                        'priority_color' => $notification->priority_badge_color,
                        'icon' => $notification->icon,
                        'color' => $notification->color,
                        'is_read' => $notification->is_read,
                        'is_important' => $notification->is_important,
                        'formatted_time' => $notification->formatted_time,
                        'created_at' => $notification->created_at->toISOString(),
                    ];
                })
            ];
        } catch (\Exception $e) {
            // Fallback notification stats if table doesn't exist
            \Log::debug('AdminNotification stats failed: ' . $e->getMessage());
            $notificationStats = [
                'total_notifications' => 0,
                'unread_notifications' => 0,
                'important_notifications' => 0,
                'recent_notifications' => collect()
            ];
        }

        return Inertia::render('Admin/Dashboard', $this->addFooterDataToResponse([
            'stats' => $stats,
            'ip_security_stats' => $ipSecurityStats,
            'system_health' => $systemHealth,
            'notification_stats' => $notificationStats,
        ]));
    }
}

