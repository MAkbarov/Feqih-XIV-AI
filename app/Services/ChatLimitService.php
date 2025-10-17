<?php

namespace App\Services;

use App\Models\ChatLimit;
use App\Models\IpSecurityLog;
use App\Models\Settings;
use App\Models\User;
use App\Models\UserChatLimit;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * XIV AI - Chat Limit Service
 * 
 * Manages message limits for guests and users, and IP security tracking
 * 
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 */
class ChatLimitService
{
    /**
     * Instead of holding a Settings model instance (which may be null on fresh installs),
     * always resolve values via Settings::get/Settings::getBool with safe defaults.
     */
    public function __construct()
    {
        // No-op constructor to keep compatibility
    }

    private function get(string $key, $default = null)
    {
        return Settings::get($key, $default);
    }

    private function getBool(string $key, bool $default = false): bool
    {
        return Settings::getBool($key, $default);
    }
    
    /**
     * Check if chat limits are enabled globally
     */
    public function isEnabled(): bool
    {
        return $this->getBool('enable_chat_limits', true);
    }
    
    /**
     * Check if IP security is enabled
     */
    public function isIpSecurityEnabled(): bool
    {
        return $this->getBool('enable_ip_security', true);
    }
    
    /**
     * Check message limit for a user or guest IP
     */
    public function checkMessageLimit(?User $user, string $ipAddress, ?string $deviceId = null): array
    {
        if (!$this->isEnabled()) {
            return ['allowed' => true, 'remaining' => null, 'reset_time' => null];
        }
        
        if ($user) {
            return $this->checkUserLimit($user);
        } else {
            // Identify guests by IP only to persist limits even if browser cache/cookies are cleared
            return $this->checkGuestLimit($ipAddress, null);
        }
    }
    
    /**
     * Check limit for authenticated user
     */
    private function checkUserLimit(User $user): array
    {
        // Check if user has custom limits set
        $userLimit = UserChatLimit::where('user_id', $user->id)->first();
        
        // If user has unlimited access, allow all messages
        if ($userLimit && $userLimit->unlimited_access) {
            return [
                'allowed' => true,
                'remaining' => 9999,
                'daily_remaining' => 9999,
                'monthly_remaining' => 9999,
                'reset_time' => null,
                'monthly_reset_time' => null,
                'limit_type' => 'unlimited',
                'limit_value' => null
            ];
        }
        
        // Determine limit type and values
        if ($userLimit) {
            // User has custom limits - use those
            $dailyLimit = $userLimit->daily_limit;
            $monthlyLimit = $userLimit->monthly_limit;
            // Determine which limit to use based on what's set
            if ($dailyLimit && $monthlyLimit) {
                // Both set - use system default behavior
                $limitType = (string)$this->get('user_limit_type', 'daily');
            } else if ($dailyLimit) {
                $limitType = 'daily';
            } else if ($monthlyLimit) {
                $limitType = 'monthly';
            } else {
                // Neither set, fall back to system
                $limitType = (string)$this->get('user_limit_type', 'daily');
                $dailyLimit = (int)$this->get('user_daily_message_limit', 50);
                $monthlyLimit = (int)$this->get('user_monthly_message_limit', 1000);
            }
        } else {
            // No custom limits - use system defaults
            $limitType = (string)$this->get('user_limit_type', 'daily');
            $dailyLimit = (int)$this->get('user_daily_message_limit', 50);
            $monthlyLimit = (int)$this->get('user_monthly_message_limit', 1000);
        }
        
        $limit = $limitType === 'daily' ? $dailyLimit : $monthlyLimit;
        
        $limitRecord = ChatLimit::findOrCreateForIdentifier(
            'user',
            (string)$user->id,
            $limitType === 'daily' ? $limit : 0,
            $limitType === 'monthly' ? $limit : 0
        );
        
        // Handle resets
        $this->handleResets($limitRecord);
        
        $remaining = $limit - $limitRecord->message_count;
        $allowed = $remaining > 0;
        
        // Reset times per new rules
        $resetTime = null;
        $monthlyResetTime = null;
        if ($limitType === 'daily') {
            // Only show reset_time if limit is exhausted (remaining == 0) and last_reset_date exists
            if ($remaining <= 0 && $limitRecord->last_reset_date) {
                $resetTime = $limitRecord->last_reset_date->copy()->addHours(24);
            } else {
                $resetTime = null; // No countdown visible if not exhausted
            }
        } else {
            // Monthly: next reset is 30 days after anchor (first message)
            if ($limitRecord->last_monthly_reset) {
                $monthlyResetTime = $limitRecord->last_monthly_reset->copy()->addDays(30);
            } else {
                $monthlyResetTime = null; // Not started yet
            }
        }
        
        return [
            'allowed' => $allowed,
            'remaining' => max(0, $remaining),
            'daily_remaining' => $limitType === 'daily' ? max(0, $remaining) : 0,
            'monthly_remaining' => $limitType === 'monthly' ? max(0, $remaining) : 0,
            'reset_time' => $resetTime,
            'monthly_reset_time' => $monthlyResetTime,
            'limit_type' => $limitType,
            'limit_value' => $limit
        ];
    }
    
    /**
     * Check limit for guest IP
     */
    private function checkGuestLimit(string $ipAddress, ?string $deviceId = null): array
    {
        $limitType = (string)$this->get('guest_limit_type', 'daily');
        $limit = $limitType === 'daily' 
            ? (int)$this->get('guest_daily_message_limit', 5)
            : (int)$this->get('guest_monthly_message_limit', 100);
        
        // Identify guests by IP only to avoid reset on cookie/cache clear
        $identifierType = 'ip';
        $identifierValue = $ipAddress;
        
        $limitRecord = ChatLimit::findOrCreateForIdentifier(
            $identifierType,
            $identifierValue,
            $limitType === 'daily' ? $limit : 0,
            $limitType === 'monthly' ? $limit : 0
        );
        
        // Handle resets
        $this->handleResets($limitRecord);
        
        $remaining = $limit - $limitRecord->message_count;
        $allowed = $remaining > 0;
        
        $resetTime = null;
        $monthlyResetTime = null;
        if ($limitType === 'daily') {
            if ($remaining <= 0 && $limitRecord->last_reset_date) {
                $resetTime = $limitRecord->last_reset_date->copy()->addHours(24);
            } else {
                $resetTime = null;
            }
        } else {
            if ($limitRecord->last_monthly_reset) {
                $monthlyResetTime = $limitRecord->last_monthly_reset->copy()->addDays(30);
            } else {
                $monthlyResetTime = null;
            }
        }
        
        return [
            'allowed' => $allowed,
            'remaining' => max(0, $remaining),
            'daily_remaining' => $limitType === 'daily' ? max(0, $remaining) : 0,
            'monthly_remaining' => $limitType === 'monthly' ? max(0, $remaining) : 0,
            'reset_time' => $resetTime,
            'monthly_reset_time' => $monthlyResetTime,
            'limit_type' => $limitType,
            'limit_value' => $limit
        ];
    }
    
    /**
     * Handle daily and monthly resets
     */
    private function handleResets(ChatLimit $limitRecord): void
    {
        if ($limitRecord->needsDailyReset()) {
            $limitRecord->resetDaily();
        }
        
        if ($limitRecord->needsMonthlyReset()) {
            $limitRecord->resetMonthly();
        }
    }
    
    /**
     * Increment message count for user or IP
     */
    public function incrementMessageCount(?User $user, string $ipAddress, ?string $deviceId = null): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        // Determine active limit type and value, mirroring check methods
        if ($user) {
            $userLimit = UserChatLimit::where('user_id', $user->id)->first();
            if ($userLimit && $userLimit->unlimited_access) {
                return; // nothing to increment for unlimited users
            }

            if ($userLimit) {
                $dailyLimit = $userLimit->daily_limit;
                $monthlyLimit = $userLimit->monthly_limit;
                if ($dailyLimit && $monthlyLimit) {
                    $limitType = (string)$this->get('user_limit_type', 'daily');
                } elseif ($dailyLimit) {
                    $limitType = 'daily';
                } elseif ($monthlyLimit) {
                    $limitType = 'monthly';
                } else {
                    $limitType = (string)$this->get('user_limit_type', 'daily');
                    $dailyLimit = (int)$this->get('user_daily_message_limit', 50);
                    $monthlyLimit = (int)$this->get('user_monthly_message_limit', 1000);
                }
            } else {
                $limitType = (string)$this->get('user_limit_type', 'daily');
                $dailyLimit = (int)$this->get('user_daily_message_limit', 50);
                $monthlyLimit = (int)$this->get('user_monthly_message_limit', 1000);
            }

            $limit = $limitType === 'daily' ? $dailyLimit : $monthlyLimit;
            $limitRecord = ChatLimit::findOrCreateForIdentifier(
                'user',
                (string)$user->id,
                $limitType === 'daily' ? $limit : 0,
                $limitType === 'monthly' ? $limit : 0
            );
        } else {
            $limitType = (string)$this->get('guest_limit_type', 'daily');
            $limit = $limitType === 'daily'
                ? (int)$this->get('guest_daily_message_limit', 5)
                : (int)$this->get('guest_monthly_message_limit', 100);

            // Identify guests by IP only
            $identifierType = 'ip';
            $identifierValue = $ipAddress;

            $limitRecord = ChatLimit::findOrCreateForIdentifier(
                $identifierType,
                $identifierValue,
                $limitType === 'daily' ? $limit : 0,
                $limitType === 'monthly' ? $limit : 0
            );
        }

        // Ensure any due resets are applied before incrementing
        $this->handleResets($limitRecord);

        // Calculate remaining before this message is counted
        $remainingBefore = $limit - $limitRecord->message_count;
        if ($remainingBefore <= 0) {
            // Should not happen as we check before sending, but guard anyway
            return;
        }

        $willHitLimit = ($remainingBefore === 1);

        // Increment counter
        $limitRecord->incrementCount();
        
        // For monthly limit: if this is the FIRST message (no anchor yet), set the anchor now
        if ($limitType === 'monthly' && !$limitRecord->last_monthly_reset) {
            $limitRecord->update(['last_monthly_reset' => Carbon::now()]);
        }
        
        // If this increment hits the DAILY limit exactly, start the 24h cooldown window now
        if ($willHitLimit && $limitType === 'daily') {
            $limitRecord->update(['last_reset_date' => Carbon::now()]);
        }
    }
    
    /**
     * Check for duplicate IP registration
     */
    public function checkIpForDuplicateRegistration(string $ipAddress, string $email, string $name = null): array
    {
        if (!$this->isIpSecurityEnabled()) {
            return ['allowed' => true, 'existing_user' => null];
        }
        
        // Check if there's already a user with this IP
        $existingUser = User::where('registration_ip', $ipAddress)
            ->where('email', '!=', $email)
            ->first();
        
        if ($existingUser) {
            // Log the attempt
            IpSecurityLog::logAttempt(
                $ipAddress,
                $email,
                $name,
                $existingUser,
                [
                    'user_agent' => request()->userAgent(),
                    'timestamp' => now()->toISOString()
                ]
            );
            
            return [
                'allowed' => false,
                'existing_user' => $existingUser,
                'message' => $this->getDuplicateIpMessage()
            ];
        }
        
        // Log successful registration attempt
        IpSecurityLog::logAttempt(
            $ipAddress,
            $email,
            $name,
            null,
            [
                'user_agent' => request()->userAgent(),
                'timestamp' => now()->toISOString()
            ]
        );
        
        return ['allowed' => true, 'existing_user' => null];
    }
    
    /**
     * Get chat limit exceeded message
     */
    public function getLimitMessage(): string
    {
        return (string) Settings::get('chat_limit_message', 'Gündəlik mesaj limitiniz dolmuşdur. Sabah yenidən mesaj göndərə bilərsiniz və ya qeydiyyatdan keçin.');
    }
    
    /**
     * Get duplicate IP message
     */
    public function getDuplicateIpMessage(): string
    {
        return (string) Settings::get('ip_duplicate_message', 'Bu IP ünvanı ilə artıq bir hesab qeydiyyatdan keçmişdir. Təhlükəsizlik üçün duplikat qeydiyyat bloklanmışdır.');
    }
    
    /**
     * Get limit statistics for admin
     */
    public function getLimitStatistics(): array
    {
        $totalLimits = ChatLimit::count();
        $activeLimits = ChatLimit::where('message_count', '>', 0)->count();
        $ipLimits = ChatLimit::where('identifier_type', 'ip')->count();
        $userLimits = ChatLimit::where('identifier_type', 'user')->count();
        $guestLimits = ChatLimit::where('identifier_type', 'guest')->count();
        
        // Security statistics
        $totalSecurityLogs = IpSecurityLog::count();
        $unresolvedLogs = IpSecurityLog::unresolved()->count();
        $blockedAttempts = IpSecurityLog::where('action_type', 'blocked_duplicate')->count();
        
        return [
            'limits' => [
                'total' => $totalLimits,
                'active' => $activeLimits,
                'ip_based' => $ipLimits,
                'user_based' => $userLimits,
                'guest_based' => $guestLimits
            ],
            'security' => [
                'total_logs' => $totalSecurityLogs,
                'unresolved' => $unresolvedLogs,
                'blocked_attempts' => $blockedAttempts
            ]
        ];
    }
    
    /**
     * Reset all limits (admin function)
     */
    public function resetAllLimits(): int
    {
        return ChatLimit::query()->update([
            'message_count' => 0,
            'last_reset_date' => Carbon::today(),
            'last_monthly_reset' => Carbon::now()->startOfMonth()
        ]);
    }
    
    /**
     * Reset limits for specific identifier
     */
    public function resetLimit(string $type, string $value): bool
    {
        $limitRecord = ChatLimit::where('identifier_type', $type)
            ->where('identifier_value', $value)
            ->first();
            
        if ($limitRecord) {
            $limitRecord->update([
                'message_count' => 0,
                'last_reset_date' => Carbon::today(),
                'last_monthly_reset' => Carbon::now()->startOfMonth()
            ]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Reset limits for specific user (admin function)
     */
    public function resetUserLimits(int $userId): bool
    {
        return $this->resetLimit('user', (string)$userId);
    }
}
