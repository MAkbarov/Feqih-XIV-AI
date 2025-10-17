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
     */
    public function getActiveBackgroundCss(): string
    {
        return match($this->active_type) {
            'solid' => $this->solid_color ?? '#f3f4f6',
            'gradient' => $this->gradient_value ?? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'image' => $this->image_url ? "url({$this->image_url})" : ($this->solid_color ?? '#f3f4f6'),
            'default' => 'transparent', // Default uses CSS classes, no override
            default => 'transparent'
        };
    }
}
