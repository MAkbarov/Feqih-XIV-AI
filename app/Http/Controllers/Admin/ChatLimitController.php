<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use App\Models\ChatLimit;
use App\Models\IpSecurityLog;
use App\Services\ChatLimitService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

/**
 * XIV AI - Chat Limit Admin Controller
 * 
 * Manages chat limits and IP security settings in admin panel
 * 
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 */
class ChatLimitController extends Controller
{
    private ChatLimitService $chatLimitService;
    
    public function __construct(ChatLimitService $chatLimitService)
    {
        $this->chatLimitService = $chatLimitService;
    }
    
    /**
     * Display chat limit settings page
     */
    public function index(): Response
    {
        $statistics = $this->chatLimitService->getLimitStatistics();
        
        // Get recent limits data
        $recentLimits = ChatLimit::orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($limit) {
                $data = [
                    'id' => $limit->id,
                    'type' => $limit->identifier_type,
                    'identifier' => $limit->identifier_value,
                    'message_count' => $limit->message_count,
                    'daily_limit' => $limit->daily_limit,
                    'monthly_limit' => $limit->monthly_limit,
                    'last_reset' => $limit->last_reset_date?->toDateString(),
                    'last_activity' => $limit->updated_at->diffForHumans(),
                    'user_name' => null
                ];
                
                // Get user name if it's a user type
                if ($limit->identifier_type === 'user') {
                    $user = \App\Models\User::find($limit->identifier_value);
                    $data['user_name'] = $user ? $user->name : 'Silinmiş istifadəçi';
                }
                
                return $data;
            });
        
        return Inertia::render('Admin/ChatLimit/Index', [
            'settings' => [
                'guest_daily_limit' => Settings::get('guest_daily_message_limit', 5),
                'guest_monthly_limit' => Settings::get('guest_monthly_message_limit', 100),
                'user_daily_limit' => Settings::get('user_daily_message_limit', 50),
                'user_monthly_limit' => Settings::get('user_monthly_message_limit', 1000),
                'guest_limit_type' => Settings::get('guest_limit_type', 'daily'),
                'user_limit_type' => Settings::get('user_limit_type', 'daily'),
                'enable_chat_limits' => Settings::getBool('enable_chat_limits', true),
                'enable_ip_security' => Settings::getBool('enable_ip_security', true),
                'chat_limit_message' => Settings::get('chat_limit_message', ''),
                'ip_duplicate_message' => Settings::get('ip_duplicate_message', ''),
            ],
            'statistics' => $statistics,
            'recent_limits' => $recentLimits
        ]);
    }
    
    /**
     * Update chat limit settings
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'guest_daily_limit' => 'required|integer|min:1|max:1000',
            'guest_monthly_limit' => 'required|integer|min:1|max:10000',
            'user_daily_limit' => 'required|integer|min:1|max:10000',
            'user_monthly_limit' => 'required|integer|min:1|max:100000',
            'guest_limit_type' => 'required|in:daily,monthly',
            'user_limit_type' => 'required|in:daily,monthly',
            'enable_chat_limits' => 'boolean',
            'enable_ip_security' => 'boolean',
            'chat_limit_message' => 'nullable|string|max:500',
            'ip_duplicate_message' => 'nullable|string|max:500'
        ]);
        
        // Persist each setting using key-value store
        Settings::set('guest_daily_message_limit', $validated['guest_daily_limit']);
        Settings::set('guest_monthly_message_limit', $validated['guest_monthly_limit']);
        Settings::set('user_daily_message_limit', $validated['user_daily_limit']);
        Settings::set('user_monthly_message_limit', $validated['user_monthly_limit']);
        Settings::set('guest_limit_type', $validated['guest_limit_type']);
        Settings::set('user_limit_type', $validated['user_limit_type']);
        Settings::set('enable_chat_limits', (int)($validated['enable_chat_limits'] ?? false));
        Settings::set('enable_ip_security', (int)($validated['enable_ip_security'] ?? false));
        Settings::set('chat_limit_message', $validated['chat_limit_message'] ?? '');
        Settings::set('ip_duplicate_message', $validated['ip_duplicate_message'] ?? '');
        
        return redirect()->back()->with('success', 'Söhbət limit Parametrləri uğurla yeniləndi!');
    }
    
    /**
     * Reset all limits
     */
    public function resetAll(Request $request)
    {
        $request->validate([
            'confirmation' => 'required|in:LIMITI_SIFIRLA'
        ]);
        
        $resetCount = $this->chatLimitService->resetAllLimits();
        
        return redirect()->back()->with('success', "Bütün limitlər sıfırlandı! ({$resetCount} kayıt yeniləndi)");
    }
    
    /**
     * Reset specific limit
     */
    public function resetLimit(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:ip,user,guest',
            'value' => 'required|string'
        ]);
        
        $success = $this->chatLimitService->resetLimit(
            $validated['type'],
            $validated['value']
        );
        
        if ($success) {
            return redirect()->back()->with('success', 'Limit uğurla sıfırlandı!');
        } else {
            return redirect()->back()->withErrors(['error' => 'Limit tapılmadı!']);
        }
    }
    
    /**
     * IP Security logs page
     */
    public function ipSecurity(): Response
    {
        $logs = IpSecurityLog::with('existingUser')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($log) {
                return [
                    'id' => $log->id,
                    'ip_address' => $log->ip_address,
                    'existing_user' => $log->existingUser ? [
                        'id' => $log->existingUser->id,
                        'name' => $log->existingUser->name,
                        'email' => $log->existingUser->email
                    ] : null,
                    'existing_user_email' => $log->existing_user_email,
                    'attempted_email' => $log->attempted_email,
                    'attempted_name' => $log->attempted_name,
                    'action_type' => $log->action_type,
                    'additional_data' => $log->additional_data,
                    'is_resolved' => $log->is_resolved,
                    'admin_notes' => $log->admin_notes,
                    'created_at' => $log->created_at->toDateTimeString()
                ];
            });
            
        $statistics = [
            'total_logs' => IpSecurityLog::count(),
            'unresolved_logs' => IpSecurityLog::unresolved()->count(),
            'blocked_attempts' => IpSecurityLog::where('action_type', 'blocked_duplicate')->count(),
            'today_logs' => IpSecurityLog::whereDate('created_at', today())->count()
        ];
        
        return Inertia::render('Admin/ChatLimit/IpSecurity', [
            'logs' => $logs,
            'statistics' => $statistics
        ]);
    }
    
    /**
     * Mark IP security log as resolved
     */
    public function resolveSecurityLog(IpSecurityLog $log, Request $request)
    {
        $validated = $request->validate([
            'admin_notes' => 'nullable|string|max:1000'
        ]);
        
        $log->markResolved($validated['admin_notes'] ?? null);
        
        return redirect()->back()->with('success', 'Təhlükəsizlik loqu həll edildi kimi işarələndi!');
    }
    
    /**
     * Delete security log
     */
    public function deleteSecurityLog(IpSecurityLog $log)
    {
        $log->delete();
        
        return redirect()->back()->with('success', 'Təhlükəsizlik loqu silindi!');
    }
    
    /**
     * Clear recent activity logs
     */
    public function clearRecentActivity()
    {
        try {
            $affectedRows = ChatLimit::query()->update(['updated_at' => Carbon::now()->subDays(30)]);
            
            \Log::info('Recent activity cleared', ['affected_rows' => $affectedRows]);
            
            return redirect()->back()->with('success', "Son aktivlik cədvəli təmizləndi! ({$affectedRows} kayıt yeniləndi)");
        } catch (\Exception $e) {
            \Log::error('Failed to clear recent activity', ['error' => $e->getMessage()]);
            
            return redirect()->back()->withErrors(['error' => 'Son aktivlik cədvəli təmizlənmədi: ' . $e->getMessage()]);
        }
    }
}
