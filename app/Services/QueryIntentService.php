<?php

namespace App\Services;

use App\Interfaces\ChatProviderInterface;
use App\Models\Settings;
use Illuminate\Support\Facades\Log;

class QueryIntentService
{
    public const INTENT_SMALL_TALK    = 'SMALL_TALK';
    public const INTENT_META          = 'META';
    public const INTENT_FIQH_QUESTION = 'FIQH_QUESTION';
    public const INTENT_OUT_OF_SCOPE  = 'OUT_OF_SCOPE';

    protected ChatProviderInterface $chatProvider;

    public function __construct(ChatProviderInterface $chatProvider)
    {
        $this->chatProvider = $chatProvider;
    }

    /**
     * Main entry point: detect high-level intent of user message.
     * Heuristics first, optional model-based classifier as fallback.
     */
    public function detectIntent(string $text): string
    {
        $raw   = trim($text ?? '');
        $norm  = $this->normalizeAz(mb_strtolower($raw, 'UTF-8'));
        $len   = mb_strlen($norm, 'UTF-8');
        $isQ   = $this->looksLikeQuestion($raw, $norm);

        if ($len === 0) {
            return self::INTENT_SMALL_TALK;
        }

        // 1) Cheap heuristics
        if ($this->looksLikeSmallTalk($norm, $raw)) {
            $intent = self::INTENT_SMALL_TALK;
        } elseif ($this->looksLikeMeta($norm)) {
            $intent = self::INTENT_META;
        } else {
            $hasFiqhTerms = $this->containsFiqhKeywords($norm);
            $clearlyOut   = $this->looksClearlyOutOfScope($norm);

            if ($isQ && $hasFiqhTerms) {
                $intent = self::INTENT_FIQH_QUESTION;
            } elseif ($clearlyOut) {
                $intent = self::INTENT_OUT_OF_SCOPE;
            } else {
                $intent = null; // ambiguous → may consult model
            }
        }

        $usedModel = false;

        // 2) Optional model-based classifier when heuristics are unsure
        $aiClassifierEnabled = (bool) Settings::get('rag_intent_ai_classifier_enabled', true);
        if ($aiClassifierEnabled && $intent === null) {
            $modelIntent = $this->classifyWithModel($raw);
            if ($modelIntent !== null) {
                $intent    = $modelIntent;
                $usedModel = true;
            }
        }

        // 3) Final fallbacks if still unknown
        if ($intent === null) {
            $hasFiqhTerms = $this->containsFiqhKeywords($norm);
            if ($isQ) {
                $intent = $hasFiqhTerms ? self::INTENT_FIQH_QUESTION : self::INTENT_OUT_OF_SCOPE;
            } else {
                $intent = self::INTENT_SMALL_TALK;
            }
        }

        try {
            Log::info('RAG INTENT DETECTED', [
                'raw' => $raw,
                'normalized' => $norm,
                'intent' => $intent,
                'used_model' => $usedModel,
            ]);
        } catch (\Throwable $e) {
            // logging must not break flow
        }

        return $intent;
    }

    private function looksLikeQuestion(string $raw, string $norm): bool
    {
        if (str_contains($raw, '?')) {
            return true;
        }
        // Azerbaijani/Turkish "what/why/how" cues
        $cues = [
            'necə', 'nece', 'nədir', 'nedir', 'niyə', 'niye', 'hara', 'hardadir',
            'olarmı', 'olarmi', 'düzdürmü', 'duzdurmu', 'mü', 'mi', 'mu', 'mı',
        ];
        foreach ($cues as $c) {
            if (mb_strpos($norm, $c, 0, 'UTF-8') !== false) {
                return true;
            }
        }
        return false;
    }

    private function looksLikeSmallTalk(string $norm, string $raw): bool
    {
        $t = trim($norm);
        if ($t === '') return false;

        // pure greeting / thanks / very short no-question
        $patterns = [
            '/^(salam|selam|salam aleykum|salamun aleykum|salamün aleykum|merhaba|hello|hi|hey)[.!?\s]*$/u',
            '/(nec[əe]s[əe]n|necesen|necəsen|haliniz necedir|hal-?iniz necedir)/u',
            '/^(tesekkur|tewekkur|təşəkkür|təşəkkürlər|sag ol|sağ ol|minnetdar(am)?)[.!?\s]*$/u',
        ];
        foreach ($patterns as $re) {
            if (preg_match($re, $t)) return true;
        }

        $len = mb_strlen($t, 'UTF-8');
        if ($len <= 12 && !str_contains($raw, '?')) {
            $short = [
                'salam','salamlar','selam','merhaba','hello','hi','hey',
                'saqol','sag ol','sağ ol','tesekkur','tesekkurler','təşəkkür',
            ];
            if (in_array($t, $short, true)) return true;
        }

        return false;
    }

    private function looksLikeMeta(string $norm): bool
    {
        $metaCues = [
            'sen yalniz', 'sən yalniz', 'sən yalnız', 'sen sadece',
            'yalniz serif', 'yalniz şeri', 'yalnız şəri', 'yalnız şəriət',
            'yalniz serif sual', 'yalnız şəriət sual',
            'sen ne edirs', 'sən nə edirs', 'sen ne is gorurs', 'sən nə iş görürs',
            'sen kims', 'sən kims', 'kimsən sen', 'bot san', 'botsan',
            'chatbot', 'çatbot', 'ai botu', 'ai bot',
            'nə edə bilirsən', 'ne ede bilirs', 'nə iş görürsən',
        ];
        foreach ($metaCues as $c) {
            if (mb_strpos($norm, $c, 0, 'UTF-8') !== false) return true;
        }
        return false;
    }

    private function containsFiqhKeywords(string $norm): bool
    {
        $keywords = [
            'destemaz','deste maz','dəstəmaz','abdest','wudu','vudu','vuzu',
            'gusl','qusl','qüsl','ghusl','boyuk teheret','böyük təhar',
            'teyemmum','təyəmmüm',
            'namaz','salat','salah','ibadet','ibadət',
            'oruc','siyam','ruze','ruzə',
            'zekat','zəkat','sadaka','sədəqə',
            'hecc','həcc','hac',
            'qurban','qurbani',
            'fiqh','fiqhi','fıqh','şəriət','seriet','shariat','sharia',
            'halal','haram','mekruh','məkruh','mubah','mübah',
            'necaset','nəcasət','napak','murdar',
            'qible','qiblə','kible',
            'dua','qunut','qunut duas',
            'cuma namazi','cümə namaz',
        ];
        foreach ($keywords as $k) {
            if (mb_strpos($norm, $k, 0, 'UTF-8') !== false) return true;
        }
        return false;
    }

    private function looksClearlyOutOfScope(string $norm): bool
    {
        $out = [
            'php','javascript','python','java','css','html','react','laravel',
            'server','database','mysql','postgres','mongodb','api','frontend','backend',
            'bitcoin','btc','eth','ethereum','kripto','crypto','dollar','usd','eur',
            'seo','marketing','reklam','smm',
        ];
        foreach ($out as $k) {
            if (mb_strpos($norm, $k, 0, 'UTF-8') !== false) return true;
        }
        return false;
    }

    /**
     * Very small model-based classifier: returns one of the INTENT_* constants or null.
     */
    private function classifyWithModel(string $raw): ?string
    {
        try {
            $prompt = <<<PROMPT
Sən yalnız TƏSNİFAT edən sistemsən.
Aşağıdakı mətni dörd kateqoriyadan birinə ayır:
- SMALL_TALK: salamlaşma, təşəkkür, hal-əhval, qısa söhbət.
- META: çatbotun rolu və imkanları barədə sual ("sən nə edirsən?", "yalnız şəriət sualına cavab verirsən?").
- FIQH_QUESTION: İslam fiqhi/şəriəti, ibadət, halal-haram, hökmlər barədə sual.
- OUT_OF_SCOPE: İslam fiqhindən kənar mövzu (proqramlaşdırma, biznes, başqa hər şey).

YALNIZ bu sözlərdən BİRİNİ qaytar: SMALL_TALK, META, FIQH_QUESTION, OUT_OF_SCOPE.

Mətn: "{$raw}"
Cavab:
PROMPT;

            $response = $this->chatProvider->generateResponse($prompt, [
                'temperature' => 0.0,
                'max_tokens' => 8,
            ]);

            $val = strtoupper(trim($response));
            $val = preg_replace('/[^A-Z_]/', '', $val ?? '');
            $allowed = [
                self::INTENT_SMALL_TALK,
                self::INTENT_META,
                self::INTENT_FIQH_QUESTION,
                self::INTENT_OUT_OF_SCOPE,
            ];
            if (in_array($val, $allowed, true)) {
                return $val;
            }
        } catch (\Throwable $e) {
            try {
                Log::warning('RAG INTENT MODEL CLASSIFIER FAILED', [
                    'error' => $e->getMessage(),
                ]);
            } catch (\Throwable $e2) {
                // ignore
            }
        }
        return null;
    }

    /**
     * Normalize Azerbaijani/Turkish letters and strip combining marks for matching.
     */
    private function normalizeAz(string $text): string
    {
        $map = [
            'ə' => 'e', 'Ə' => 'e',
            'ı' => 'i', 'İ' => 'i',
            'ş' => 's', 'Ş' => 's',
            'ç' => 'c', 'Ç' => 'c',
            'ö' => 'o', 'Ö' => 'o',
            'ü' => 'u', 'Ü' => 'u',
            'ğ' => 'g', 'Ğ' => 'g',
        ];
        $t = strtr($text, $map);
        if (class_exists('Normalizer')) {
            $t = \Normalizer::normalize($t, \Normalizer::FORM_KD);
        }
        $t = preg_replace('/[\p{Mn}]+/u', '', $t);
        return $t ?? '';
    }
}
