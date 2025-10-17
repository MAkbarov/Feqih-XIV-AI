<?php

namespace Database\Seeders;

use App\Models\AiProcessSetting;
use Illuminate\Database\Seeder;

class AiProcessSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Search Settings
            [
                'key' => 'ai_search_method',
                'value' => 'deep_search',
                'category' => 'search',
                'description' => 'Axtarış metodu: deep_search (Dərin Axtarış) və ya standard_search (Standart Axtarış)'
            ],
            
            // Restriction Messages
            [
                'key' => 'ai_no_data_message',
                'value' => 'Bu mövzu haqqında məlumat bazamda məlumat yoxdur.',
                'category' => 'restrictions',
                'description' => 'Məlumat olmadıqda göstərilən mesaj'
            ],
            [
                'key' => 'ai_restriction_command',
                'value' => 'YALNIZ BU CÜMLƏ İLƏ CAVAB VER VƏ BAŞQA HEÇ NƏ YAZMA:',
                'category' => 'restrictions',
                'description' => 'Məhdudiyyət komandası'
            ],
            
            // Format Settings - Islamic Terms
            [
                'key' => 'ai_format_islamic_terms',
                'value' => json_encode([
                    'dəstəmaz', 'namaz', 'oruc', 'hac', 'zəkat',
                    'qiblə', 'imam', 'ayə', 'hadis', 'sünnet',
                    'fərz', 'vacib', 'məkruh', 'haram', 'halal',
                    'Allah', 'Peyğəmbər', 'İslam', 'Quran'
                ]),
                'category' => 'format',
                'description' => 'Bold ediləcək terminlər siyahısı (JSON format)'
            ],
            
            // System Prompts - Basic Identity
            [
                'key' => 'ai_prompt_strict_identity',
                'value' => 'Sən İslami köməkçi AI assistantsan və dini məsələlərdə yardım edirsən.',
                'category' => 'prompts',
                'description' => 'Strict mode aktiv olduqda istifadə edilən kimlik'
            ],
            [
                'key' => 'ai_prompt_normal_identity',
                'value' => 'Sən köməkçi AI assistantsan və istifadəçilərə yardım edirsən.',
                'category' => 'prompts',
                'description' => 'Normal mode-da istifadə edilən kimlik'
            ],
            
            // Knowledge Base Prompts
            [
                'key' => 'ai_prompt_kb_external_blocked',
                'value' => 'MƏLUMAT MƏNBƏLƏRİ: Yalnız aşağıda verilən məlumatları istifadə et, öz biliklərini deyil.',
                'category' => 'prompts',
                'description' => 'Xarici öyrənmə bloklandıqda istifadə edilən prompt'
            ],
            [
                'key' => 'ai_prompt_kb_external_allowed',
                'value' => 'MƏLUMAT MƏNBƏLƏRİ: Əsasən aşağıdakı məlumatları istifadə et, lazım gəldikdə ümumi biliklərinlə tamamla.',
                'category' => 'prompts',
                'description' => 'Xarici öyrənmə icazə verildikdə istifadə edilən prompt'
            ],
            [
                'key' => 'ai_prompt_no_kb_free',
                'value' => 'Sərbəst cavab ver, ümumi biliklərinə əsaslanaraq yardım et.',
                'category' => 'prompts',
                'description' => 'KB olmadıqda və xarici öyrənmə icazəli olduqda'
            ],
            [
                'key' => 'ai_prompt_no_kb_restricted',
                'value' => 'Yalnız admin tərəfindən verilən təlimatları izlə.',
                'category' => 'prompts',
                'description' => 'KB olmadıqda və xarici öyrənmə bloklandıqda'
            ],
            
            // Control Prompts
            [
                'key' => 'ai_prompt_internet_blocked',
                'value' => 'İnternet məlumatlarına müraciət etmə, yalnız mövcud məlumatları istifadə et.',
                'category' => 'prompts',
                'description' => 'İnternet əlaqəsi bloklandıqda'
            ],
            [
                'key' => 'ai_prompt_super_strict',
                'value' => 'SUPER STRİCT MODE: Təlimatdan kənara MÜTLƏQ çıxma! Yalnız admin təlimatlarını icra et.',
                'category' => 'prompts',
                'description' => 'Super strict mode aktiv olduqda'
            ],
            [
                'key' => 'ai_prompt_language',
                'value' => 'Azərbaycan dilində cavab ver.',
                'category' => 'prompts',
                'description' => 'Dil təlimi'
            ],
            
            // Response Guidelines
            [
                'key' => 'ai_prompt_response_rules',
                'value' => "=== CAVAB VERMƏ QAYDALARI ===\nCAVAB QAYDALAR:\n- YALNIZ yuxarıdakı məlumatların MUŠAYIQ həssələrinə əsaslanaraq cavab ver\n- MƏNBƏ HİSSƏSİNDƏ YALNIZ YUXARIDA VERİLƏN MƏTNLƏRƏ İSTİNAD ET",
                'category' => 'prompts',
                'description' => 'Cavab vermə qaydaları'
            ],
            [
                'key' => 'ai_prompt_focus_rules',
                'value' => "=== FOKUS QAYDALAR ===\n- YALNIZ sualın DƏQIQ məzmununa cavab ver\n- Əgər 'gündəlik namaz' soruşulursa, YALNIZ gündəlik namaz haqqında yaz\n- Əgər müəyyən bir mövzu soruşulursa, BAŞQA mövzulara keçmə\n- Uzun siyahılar və ya bütün variantları yazmaqdan QAÇIN\n- KONKRET və MƏQSƏDYÖNLÜ cavab ver\n- Sualda açıq-aydın soruşulanı ver, əlavə məlumat üçün ayrıca sual istə",
                'category' => 'prompts',
                'description' => 'Fokus qaydaları'
            ],
            [
                'key' => 'ai_prompt_final_rules',
                'value' => "- Dini məsələlərdə ehtiyatlı və dəqiq ol\n- Mənbə qəyd et\n- Səliqəli və qısa cavab ver",
                'category' => 'prompts',
                'description' => 'Final qaydalar'
            ]
        ];
        
        foreach ($settings as $setting) {
            AiProcessSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
