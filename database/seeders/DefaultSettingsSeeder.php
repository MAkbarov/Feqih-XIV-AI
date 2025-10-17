<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Settings;

class DefaultSettingsSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultSettings = [
            // Application Settings
            'app_version' => '1.0.0',
            'site_name' => 'XIV AI Chatbot Platform',
            'chatbot_name' => 'XIV AI',
            
            // Brand Settings
            'brand_mode' => 'icon',
            'brand_icon_name' => 'nav_chat',
            'brand_logo_url' => '',
            'favicon_url' => '',
            
            // Theme Settings
            'primary_color' => '#10b981',
            'secondary_color' => '#97a5a1',
            'accent_color' => '#fbbf24',
            'background_gradient' => 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
            'text_color' => '#1f2937',
            
            // Chat Settings
            'message_input_limit' => '500',
            'ai_output_limit' => '1000',
            'enter_sends_message' => true,
            'ai_typing_speed' => '50',
            'ai_thinking_time' => '1000',
            'ai_response_type' => 'typewriter',
            'ai_use_knowledge_base' => true,
            'ai_strict_mode' => true,
            'ai_topic_restrictions' => '',
            'ai_internet_blocked' => true,
            'ai_external_learning_blocked' => true,
            'ai_super_strict_mode' => false,
            'chat_disclaimer_text' => 'Çatbotun cavablarını yoxlayın, səhv edə bilər!',
            
            // Chat Background Settings
            'chat_background_type' => 'default',
            'chat_background_color' => '#f3f4f6',
            'chat_background_gradient' => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'chat_background_image' => '',
            
            // Footer Settings
            'footer_enabled' => true,
            'footer_text' => '© 2025 XIV AI. Bütün hüquqlar qorunur.',
            'footer_text_color' => '#6B7280',
            'footer_author_text' => 'Developed by DeXIV',
            'footer_author_color' => '#6B7280',
            
            // Admin Settings
            'admin_email' => 'admin@xiv-ai.com',
            
            // AI System Prompt
            'ai_system_prompt' => 'Sen XIV AI adlı Azərbaycan dilində cavab verən köməkçi süni zəka sistemisiniz. İstifadəçilərə faydalı, dəqiq və təhlükəsiz cavablar ver.',
        ];

        foreach ($defaultSettings as $key => $value) {
            Settings::firstOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : $value]
            );
        }
    }
}