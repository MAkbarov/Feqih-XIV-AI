<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * XIV AI - Chat Limit Model
 * 
 * Manages message limits for guests (IP-based) and registered users
 */
class ChatLimit extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'identifier_type',
        'identifier_value', 
        'message_count',
        'daily_limit',
        'monthly_limit',
        'last_reset_date',
        'last_monthly_reset'
    ];
    
    protected $casts = [
        'last_reset_date' => 'datetime',
        'last_monthly_reset' => 'datetime',
        'message_count' => 'integer',
        'daily_limit' => 'integer',
        'monthly_limit' => 'integer'
    ];
    
    /**
     * Check if daily reset is needed
     *
     * New logic: Daily reset should happen ONLY after the limit was exhausted (i.e., countdown started),
     * and 24 hours have passed since that exhaustion time (stored in last_reset_date).
     * If the limit has not been exhausted yet (last_reset_date is null), no reset should occur.
     */
    public function needsDailyReset(): bool
    {
        // Only check daily reset if daily_limit is set and active
        if (!$this->daily_limit) {
            return false;
        }
        
        // If limit was never exhausted (no reset countdown started), no reset needed
        if (!$this->last_reset_date) {
            return false;
        }
        
        // Only reset if limit is still exhausted AND 24h have passed since exhaustion
        $isLimitExhausted = $this->message_count >= $this->daily_limit;
        $has24HoursPassed = Carbon::now()->greaterThanOrEqualTo($this->last_reset_date->copy()->addHours(24));
        
        return $isLimitExhausted && $has24HoursPassed;
    }
    
    /**
     * Check if monthly reset is needed
     *
     * New logic: Monthly reset is time-based and anchored to the first successful message time
     * (stored in last_monthly_reset). If not set, we DON'T auto-reset regardless of time until
     * the first message occurs (service will set it on first increment). After that, every 30 days.
     */
    public function needsMonthlyReset(): bool
    {
        if (!$this->last_monthly_reset) {
            // No anchor yet -> no monthly reset
            return false;
        }
        // 30-day cycle since anchor
        return Carbon::now()->greaterThanOrEqualTo($this->last_monthly_reset->copy()->addDays(30));
    }
    
    /**
     * Reset daily count
     */
    public function resetDaily(): void
    {
        $this->update([
            'message_count' => 0,
            'last_reset_date' => null  // Clear countdown after reset
        ]);
    }
    
    /**
     * Reset monthly count
     */
    public function resetMonthly(): void
    {
        $this->update([
            'message_count' => 0,
            'last_monthly_reset' => Carbon::now()
        ]);
    }
    
    /**
     * Increment message count
     */
    public function incrementCount(): void
    {
        $this->increment('message_count');
    }
    
    /**
     * Get limit record for IP (guest)
     */
    public static function forIp(string $ip): ?self
    {
        return static::where('identifier_type', 'ip')
            ->where('identifier_value', $ip)
            ->first();
    }
    
    /**
     * Get limit record for user
     */
    public static function forUser(int $userId): ?self
    {
        return static::where('identifier_type', 'user')
            ->where('identifier_value', (string)$userId)
            ->first();
    }
    
    /**
     * Create or get existing limit record
     */
    public static function findOrCreateForIdentifier(string $type, string $value, int $dailyLimit = null, int $monthlyLimit = null): self
    {
        return static::firstOrCreate(
            [
                'identifier_type' => $type,
                'identifier_value' => $value
            ],
            [
                'message_count' => 0,
                'daily_limit' => $dailyLimit,
                'monthly_limit' => $monthlyLimit,
                // Do NOT start any countdowns by default. These will be set by service at proper times
                'last_reset_date' => null,
                'last_monthly_reset' => null
            ]
        );
    }
}
