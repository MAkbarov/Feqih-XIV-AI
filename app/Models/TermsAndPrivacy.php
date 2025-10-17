<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TermsAndPrivacy extends Model
{
    protected $fillable = [
        'type',
        'title', 
        'content',
        'is_active'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
    
    public static function getTerms()
    {
        return static::where('type', 'terms')->where('is_active', true)->first();
    }
    
    public static function getPrivacy()
    {
        return static::where('type', 'privacy')->where('is_active', true)->first();
    }
}
