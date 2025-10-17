<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiProcessSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'category',
        'description',
        'is_active'
    ];
    
    protected $casts = [
        'is_active' => 'boolean'
    ];
    
    /**
     * Get setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->where('is_active', true)->first();
        return $setting ? $setting->value : $default;
    }
    
    /**
     * Set setting value by key
     */
    public static function set(string $key, $value, string $category = 'general', string $description = null)
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'category' => $category,
                'description' => $description,
                'is_active' => true
            ]
        );
    }
    
    /**
     * Get settings by category
     */
    public static function getByCategory(string $category)
    {
        return static::where('category', $category)
                    ->where('is_active', true)
                    ->pluck('value', 'key')
                    ->toArray();
    }
}
