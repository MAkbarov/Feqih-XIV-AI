<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationPage extends Model
{
    protected $fillable = [
        'is_enabled',
        'title', 
        'content',
        'display_settings',
        'payment_methods',
        'custom_texts'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'display_settings' => 'array',
        'payment_methods' => 'array',
        'custom_texts' => 'array'
    ];

    public static function getActiveDonation()
    {
        return self::where('is_enabled', true)->first();
    }

    public static function isEnabled()
    {
        return self::where('is_enabled', true)->exists();
    }
}

