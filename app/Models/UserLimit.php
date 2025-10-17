<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class UserLimit extends Model
{
    protected $fillable = [
        'identifier',
        'user_type',
        'limit_type', 
        'message_count',
        'character_count',
        'period_date'
    ];

    protected $casts = [
        'period_date' => 'date'
    ];

    /**
     * Get user identifier (user_id, guest_ip, or session)
     */
    public static function getUserIdentifier($user = null, $request = null)
    {
        if ($user) {
            return (string) $user->id;
        }
        
        // For guests, use combination of IP and session for better tracking
        $ip = $request ? $request->ip() : request()->ip();
        $session = session()->getId();
        return "guest_{$ip}_{$session}";
    }

    /**
     * Track message usage
     */
    public static function trackUsage($identifier, $userType, $messageLength)
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth()->toDateString();
        
        // Track daily usage
        static::updateOrCreate(
            [
                'identifier' => $identifier,
                'user_type' => $userType,
                'limit_type' => 'daily',
                'period_date' => $today
            ],
            [
                'message_count' => \DB::raw('message_count + 1'),
                'character_count' => \DB::raw("character_count + {$messageLength}")
            ]
        );
        
        // Track monthly usage
        static::updateOrCreate(
            [
                'identifier' => $identifier,
                'user_type' => $userType,
                'limit_type' => 'monthly',
                'period_date' => $thisMonth
            ],
            [
                'message_count' => \DB::raw('message_count + 1'),
                'character_count' => \DB::raw("character_count + {$messageLength}")
            ]
        );
    }

    /**
     * Check if user exceeded limits
     */
    public static function checkLimits($identifier, $userType, $messageLength = 0)
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth()->toDateString();
        
        // Get current limits from settings
        $limits = static::getLimitsFromSettings($userType);
        
        // Check daily limits
        if ($limits['daily_messages'] > 0 || $limits['daily_characters'] > 0) {
            $dailyUsage = static::where('identifier', $identifier)
                ->where('user_type', $userType)
                ->where('limit_type', 'daily')
                ->where('period_date', $today)
                ->first();
                
            if ($dailyUsage) {
                if ($limits['daily_messages'] > 0 && ($dailyUsage->message_count + 1) > $limits['daily_messages']) {
                    return ['exceeded' => true, 'type' => 'daily_messages', 'limit' => $limits['daily_messages']];
                }
                if ($limits['daily_characters'] > 0 && ($dailyUsage->character_count + $messageLength) > $limits['daily_characters']) {
                    return ['exceeded' => true, 'type' => 'daily_characters', 'limit' => $limits['daily_characters']];
                }
            }
        }
        
        // Check monthly limits
        if ($limits['monthly_messages'] > 0 || $limits['monthly_characters'] > 0) {
            $monthlyUsage = static::where('identifier', $identifier)
                ->where('user_type', $userType)
                ->where('limit_type', 'monthly')
                ->where('period_date', $thisMonth)
                ->first();
                
            if ($monthlyUsage) {
                if ($limits['monthly_messages'] > 0 && ($monthlyUsage->message_count + 1) > $limits['monthly_messages']) {
                    return ['exceeded' => true, 'type' => 'monthly_messages', 'limit' => $limits['monthly_messages']];
                }
                if ($limits['monthly_characters'] > 0 && ($monthlyUsage->character_count + $messageLength) > $limits['monthly_characters']) {
                    return ['exceeded' => true, 'type' => 'monthly_characters', 'limit' => $limits['monthly_characters']];
                }
            }
        }
        
        return ['exceeded' => false];
    }

    /**
     * Get current usage statistics
     */
    public static function getCurrentUsage($identifier, $userType)
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth()->toDateString();
        
        $dailyUsage = static::where('identifier', $identifier)
            ->where('user_type', $userType)
            ->where('limit_type', 'daily')
            ->where('period_date', $today)
            ->first();
            
        $monthlyUsage = static::where('identifier', $identifier)
            ->where('user_type', $userType)
            ->where('limit_type', 'monthly')
            ->where('period_date', $thisMonth)
            ->first();
        
        return [
            'daily' => [
                'messages' => $dailyUsage ? $dailyUsage->message_count : 0,
                'characters' => $dailyUsage ? $dailyUsage->character_count : 0
            ],
            'monthly' => [
                'messages' => $monthlyUsage ? $monthlyUsage->message_count : 0,
                'characters' => $monthlyUsage ? $monthlyUsage->character_count : 0
            ]
        ];
    }

    /**
     * Get limits from settings
     */
    private static function getLimitsFromSettings($userType)
    {
        if ($userType === 'guest') {
            return [
                'daily_messages' => (int) \App\Models\Settings::get('guest_daily_message_limit', 10),
                'daily_characters' => (int) \App\Models\Settings::get('guest_daily_character_limit', 2000),
                'monthly_messages' => (int) \App\Models\Settings::get('guest_monthly_message_limit', 100),
                'monthly_characters' => (int) \App\Models\Settings::get('guest_monthly_character_limit', 20000),
            ];
        } else {
            return [
                'daily_messages' => (int) \App\Models\Settings::get('user_daily_message_limit', 100),
                'daily_characters' => (int) \App\Models\Settings::get('user_daily_character_limit', 50000),
                'monthly_messages' => (int) \App\Models\Settings::get('user_monthly_message_limit', 1000),
                'monthly_characters' => (int) \App\Models\Settings::get('user_monthly_character_limit', 500000),
            ];
        }
    }
}

