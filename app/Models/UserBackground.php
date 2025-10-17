<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBackground extends Model
{
    protected $fillable = [
        'user_id',
        'active_type',
        'solid_color',
        'gradient_value',
        'image_url',
        'image_size', 
        'image_position',
    ];
    
    protected $casts = [
        'active_type' => 'string',
        'image_size' => 'string',
    ];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get the active background CSS for this user
     * Returns null for default to allow CSS classes to work
     */
    public function getActiveBackgroundCss(): ?string
    {
        return match($this->active_type) {
            'solid' => $this->solid_color ?? null, // null means use design default
            'gradient' => $this->gradient_value ?? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'image' => $this->image_url ? "url({$this->image_url})" : null,
            'default' => null, // Default uses CSS classes (bg-white dark:bg-gray-800)
            default => null
        };
    }
}
