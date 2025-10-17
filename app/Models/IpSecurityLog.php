<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * XIV AI - IP Security Log Model
 * 
 * Tracks duplicate registration attempts from same IP addresses
 */
class IpSecurityLog extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'ip_address',
        'existing_user_id',
        'existing_user_email',
        'attempted_email',
        'attempted_name',
        'action_type',
        'additional_data',
        'is_resolved',
        'admin_notes'
    ];
    
    protected $casts = [
        'additional_data' => 'array',
        'is_resolved' => 'boolean'
    ];
    
    /**
     * Relationship to existing user
     */
    public function existingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'existing_user_id');
    }
    
    /**
     * Get unresolved security logs
     */
    public static function unresolved()
    {
        return static::where('is_resolved', false)
            ->orderBy('created_at', 'desc');
    }
    
    /**
     * Get logs for specific IP
     */
    public static function forIp(string $ip)
    {
        return static::where('ip_address', $ip)
            ->orderBy('created_at', 'desc');
    }
    
    /**
     * Mark as resolved
     */
    public function markResolved(string $adminNotes = null): void
    {
        $this->update([
            'is_resolved' => true,
            'admin_notes' => $adminNotes
        ]);
    }
    
    /**
     * Log a registration attempt
     */
    public static function logAttempt(string $ip, string $attemptedEmail, string $attemptedName = null, User $existingUser = null, array $additionalData = []): self
    {
        return static::create([
            'ip_address' => $ip,
            'existing_user_id' => $existingUser?->id,
            'existing_user_email' => $existingUser?->email,
            'attempted_email' => $attemptedEmail,
            'attempted_name' => $attemptedName,
            'action_type' => $existingUser ? 'blocked_duplicate' : 'registration_attempt',
            'additional_data' => $additionalData,
            'is_resolved' => false
        ]);
    }
}
