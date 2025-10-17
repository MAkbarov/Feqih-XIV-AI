<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use App\Models\AiProcessSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class SettingsController extends Controller
{
    use HasFooterData;
    public function index(): Response
    {
        $settings = [
            'chatbot_name' => Settings::get('chatbot_name', 'AI Assistant'),
            'message_input_limit' => Settings::get('message_input_limit', Settings::get('guest_input_limit', '500')),
            'enter_sends_message' => Settings::getBool('enter_sends_message', true),
            'ai_typing_speed' => Settings::get('ai_typing_speed', '50'),
            'ai_thinking_time' => Settings::get('ai_thinking_time', '1000'),
            'ai_response_type' => Settings::get('ai_response_type', 'typewriter'),
            'ai_use_knowledge_base' => Settings::getBool('ai_use_knowledge_base', true),
            'ai_strict_mode' => Settings::getBool('ai_strict_mode', true),
            'ai_topic_restrictions' => Settings::get('ai_topic_restrictions', ''),
            'ai_internet_blocked' => Settings::getBool('ai_internet_blocked', true),
            'ai_external_learning_blocked' => Settings::getBool('ai_external_learning_blocked', true),
            'ai_super_strict_mode' => Settings::getBool('ai_super_strict_mode', false),
            // RAG-Specific Strict Modes
            'rag_strict_mode' => Settings::getBool('rag_strict_mode', true),
            'rag_super_strict_mode' => Settings::getBool('rag_super_strict_mode', false),
            // AI Process Settings
            'ai_search_method' => AiProcessSetting::get('ai_search_method', 'deep_search'),
            'ai_no_data_message' => AiProcessSetting::get('ai_no_data_message', 'Bu mövzu haqqında məlumat bazamda məlumat yoxdur.'),
            'ai_restriction_command' => AiProcessSetting::get('ai_restriction_command', 'YALNIZ BU CÜMLƏ İLƏ CAVAB VER VƏ BAŞQA HEÇ NƏ YAZMA:'),
            'ai_format_islamic_terms' => AiProcessSetting::get('ai_format_islamic_terms', 'dəstəmaz,namaz,oruc,hac,zəkat,qiblə,imam,ayə,hadis,sünnet,fərz,vacib,məkruh,haram,halal,Allah,Peyğəmbər,İslam,Quran'),
            'ai_prompt_strict_identity' => AiProcessSetting::get('ai_prompt_strict_identity', 'Sən İslami köməkçi AI assistantsan və dini məsələlərdə yardım edirsən.'),
            'ai_prompt_normal_identity' => AiProcessSetting::get('ai_prompt_normal_identity', 'Sən köməkçi AI assistantsan və istifadəçilərə yardım edirsən.'),
            // Footer Settings
            'footer_text' => Settings::get('footer_text', '© 2025 XIV AI. Bütün hüquqlar qorunur.'),
            'footer_enabled' => Settings::getBool('footer_enabled', true),
            'footer_text_color' => Settings::get('footer_text_color', '#6B7280'),
            'footer_author_text' => Settings::get('footer_author_text', 'Developed by DeXIV'),
            'footer_author_color' => Settings::get('footer_author_color', '#6B7280'),
            // Additional Footer Elements (removed security texts)
            // Chat Disclaimer
            'chat_disclaimer_text' => Settings::get('chat_disclaimer_text', 'Çatbotun cavablarını yoxlayın, səhv edə bilər!'),
            // Site Settings
'site_name' => Settings::get('site_name', 'XIV AI Chatbot Platform'),
            'brand_mode' => Settings::get('brand_mode', 'icon'), // icon | logo | none
            'brand_icon_name' => Settings::get('brand_icon_name', 'nav_chat'),
            // Logo və favicon idarəsi Theme Settings bölməsinə köçürüldü
            // Admin Settings
            'admin_email' => Settings::get('admin_email', config('mail.from.address', 'admin@example.com')),
            
            // RAG System Settings
'rag_enabled' => Settings::getBool('rag_enabled', false),
            'rag_chunk_size' => Settings::get('rag_chunk_size', '1024'),
            'rag_chunk_overlap' => Settings::get('rag_chunk_overlap', '200'),
'rag_top_k' => Settings::get('rag_top_k', '5'),
            'rag_min_score' => Settings::get('rag_min_score', '0'),
            'rag_allowed_hosts' => Settings::get('rag_allowed_hosts', ''),
            
            // Pinecone Vector Database Settings
            'pinecone_api_key' => Settings::get('pinecone_api_key', ''),
            'pinecone_host' => Settings::get('pinecone_host', ''),
            'pinecone_environment' => Settings::get('pinecone_environment', ''),
            'pinecone_index_name' => Settings::get('pinecone_index_name', 'chatbot-knowledge'),
        ];

        return Inertia::render('Admin/Settings', $this->addFooterDataToResponse([
            'settings' => $settings,
        ]));
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'chatbot_name' => 'required|string|max:255',
'message_input_limit' => 'required|integer|min:10|max:10000',
                'enter_sends_message' => 'boolean',
                'ai_typing_speed' => 'required|integer|min:10|max:500',
                'ai_thinking_time' => 'required|integer|min:0|max:5000',
                'ai_response_type' => 'required|in:typewriter,instant',
                'ai_use_knowledge_base' => 'boolean',
                'ai_strict_mode' => 'boolean',
                'ai_topic_restrictions' => 'nullable|string|max:5000',
                'ai_internet_blocked' => 'boolean',
                'ai_external_learning_blocked' => 'boolean',
                'ai_super_strict_mode' => 'boolean',
                'rag_strict_mode' => 'boolean',
                'rag_super_strict_mode' => 'boolean',
                // AI Process validation
                'ai_search_method' => 'nullable|in:deep_search,standard_search',
                'ai_no_data_message' => 'nullable|string|max:500',
                'ai_restriction_command' => 'nullable|string|max:500',
                'ai_format_islamic_terms' => 'nullable|string|max:2000',
                'ai_prompt_strict_identity' => 'nullable|string|max:1000',
                'ai_prompt_normal_identity' => 'nullable|string|max:1000',
                // Footer validation
                'footer_text' => 'required|string|max:500',
                'footer_enabled' => 'boolean',
                'footer_text_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'footer_author_text' => 'required|string|max:500',
                'footer_author_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                // Additional footer elements validation (removed security texts)
                // Chat disclaimer validation
                'chat_disclaimer_text' => 'required|string|max:300',
                // Site validation
'site_name' => 'required|string|max:100',
                'brand_mode' => 'required|in:icon,logo,none',
                'brand_icon_name' => 'nullable|string|max:100',
                // Admin validation
                'admin_email' => 'nullable|email|max:255',
                
                // RAG System validation
'rag_enabled' => 'nullable|boolean',
                'rag_chunk_size' => 'nullable|integer|min:128|max:4096',
                'rag_chunk_overlap' => 'nullable|integer|min:0|max:1024',
'rag_top_k' => 'nullable|integer|min:1|max:20',
                'rag_min_score' => 'nullable|numeric|min:0|max:1',
                'rag_allowed_hosts' => 'nullable|string|max:1000',
                
                // Pinecone validation
                'pinecone_api_key' => 'nullable|string|max:500',
'pinecone_host' => 'nullable|string|max:500',
                'pinecone_environment' => 'nullable|string|max:100',
                'pinecone_index_name' => 'nullable|string|max:100',
            ]);

            // Logo yükləmə və URL idarəsi Theme Settings bölməsinə köçürüldü
            
            // Favicon yükləmə və URL idarəsi Theme Settings bölməsinə köçürüldü
            
            // Do not overwrite existing admin_email with null/empty values
            if (array_key_exists('admin_email', $validated) && ($validated['admin_email'] === null || $validated['admin_email'] === '')) {
                unset($validated['admin_email']);
            }

            // Map legacy keys if present
            if (array_key_exists('guest_input_limit', $validated)) {
                $validated['message_input_limit'] = $validated['guest_input_limit'];
                unset($validated['guest_input_limit']);
            }

            // Logo/favicon açarlarını bu ekrandan yazmırıq
            unset($validated['brand_logo_url'], $validated['favicon_url']);
            
            // AI Process ayarlarını ayrıca handle et
            $aiProcessKeys = [
                'ai_search_method',
                'ai_no_data_message', 
                'ai_restriction_command',
                'ai_format_islamic_terms',
                'ai_prompt_strict_identity',
                'ai_prompt_normal_identity'
            ];
            
            foreach ($aiProcessKeys as $key) {
                if (isset($validated[$key])) {
                    // Kategoriyaları təyin et
                    $category = 'general';
                    if (strpos($key, 'search') !== false) $category = 'search';
                    elseif (strpos($key, 'restriction') !== false || strpos($key, 'no_data') !== false) $category = 'restrictions';
                    elseif (strpos($key, 'format') !== false) $category = 'format';
                    elseif (strpos($key, 'prompt') !== false) $category = 'prompts';
                    
                    AiProcessSetting::set($key, $validated[$key], $category);
                    unset($validated[$key]);
                }
            }
            
            // Qalan ayarları normal Settings-ə yaz
            foreach ($validated as $key => $value) {
                // Trim string values
                if (is_string($value)) {
                    $value = trim($value);
                }
                Settings::set($key, $value);
            }

            // Explicitly persist RAG/Pinecone fields from request (even if validation filtered them)
            $ragKeys = [
                'pinecone_api_key',
                'pinecone_host',
                'pinecone_environment',
                'pinecone_index_name',
                'rag_chunk_size',
'rag_chunk_overlap',
                'rag_top_k',
                'rag_min_score',
                'rag_allowed_hosts',
                'rag_enabled',
            ];
            foreach ($ragKeys as $rk) {
                if ($request->has($rk)) {
                    $val = $request->input($rk);
                    if (is_string($val)) { $val = trim($val); }
                    Settings::set($rk, $val);
                }
            }

            return back()->with('success', 'Parametrlər uğurla yeniləndi!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Settings validation error', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors($e->errors())->with('error', 'Parametrləri yoxlayın və yenidən cəhd edin!');
        } catch (\Exception $e) {
            \Log::error('Settings update error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return back()->with('error', 'Parametrləri yeniləyərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Save Pinecone-only settings from RAG tab
     */
    public function updatePinecone(Request $request)
    {
        // Minimal validation just for Pinecone fields
        $validated = $request->validate([
            'pinecone_api_key' => 'required|string|max:8192',
            'pinecone_host' => 'nullable|string|max:500',
            'pinecone_environment' => 'nullable|string|max:100',
            'pinecone_index_name' => 'nullable|string|max:100',
            'rag_chunk_size' => 'nullable|integer|min:128|max:4096',
            'rag_chunk_overlap' => 'nullable|integer|min:0|max:1024',
'rag_top_k' => 'nullable|integer|min:1|max:20',
            'rag_min_score' => 'nullable|numeric|min:0|max:1',
            'rag_allowed_hosts' => 'nullable|string|max:1000',
        ]);

        // Persist provided keys
        foreach ($validated as $key => $value) {
            if (is_string($value)) $value = trim($value);
            \App\Models\Settings::set($key, $value);
        }

        // Return JSON for axios caller
        return response()->json([
            'success' => true,
            'message' => 'Pinecone parametrləri yadda saxlandı',
        ]);
    }

    /**
     * Get theme settings as JSON for frontend consumption
     */
    public function theme()
    {
        return response()->json([
            'primary_color' => Settings::get('primary_color', '#6366f1'),
            'secondary_color' => Settings::get('secondary_color', '#8b5cf6'),
            'accent_color' => Settings::get('accent_color', '#fbbf24'),
            'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'),
            'text_color' => Settings::get('text_color', '#1f2937'),
        ]);
    }
}
