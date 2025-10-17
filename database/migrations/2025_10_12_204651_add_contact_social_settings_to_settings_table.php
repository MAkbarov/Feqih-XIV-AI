<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Settings;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add contact social media settings to the settings table
        $contactSettings = [
            // Phone settings
            'contact_phone' => '',
            'contact_phone_enabled' => '0',
            
            // WhatsApp settings
            'contact_whatsapp' => '',
            'contact_whatsapp_enabled' => '0',
            
            // TikTok settings
            'contact_tiktok' => '',
            'contact_tiktok_enabled' => '0',
            
            // Instagram settings
            'contact_instagram' => '',
            'contact_instagram_enabled' => '0',
            
            // GitHub settings
            'contact_github' => '',
            'contact_github_enabled' => '0',
            
            // Facebook settings
            'contact_facebook' => '',
            'contact_facebook_enabled' => '0',
        ];
        
        foreach ($contactSettings as $key => $value) {
            Settings::firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove contact social media settings
        $contactSettingKeys = [
            'contact_phone',
            'contact_phone_enabled',
            'contact_whatsapp',
            'contact_whatsapp_enabled',
            'contact_tiktok',
            'contact_tiktok_enabled',
            'contact_instagram',
            'contact_instagram_enabled',
            'contact_github',
            'contact_github_enabled',
            'contact_facebook',
            'contact_facebook_enabled',
        ];
        
        Settings::whereIn('key', $contactSettingKeys)->delete();
    }
};
