<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Models\KnowledgeBase;
use App\Models\Settings;
use App\Models\AiProcessSetting;
use OpenAI;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class AiService
{
    /**
     * Normalize text for broader matching across encodings/dialects.
     */
    protected function normalizeForSearch(string $text): string
    {
        $t = mb_strtolower($text, 'UTF-8');
        // Azerbaijani/Turkish character folding
        $map = [
            'ə'=>'e','Ə'=>'e','ı'=>'i','İ'=>'i','ş'=>'s','Ş'=>'s','ç'=>'c','Ç'=>'c','ö'=>'o','Ö'=>'o','ü'=>'u','Ü'=>'u','ğ'=>'g','Ğ'=>'g'
        ];
        $t = strtr($t, $map);
        // Arabic common forms to Latin approximations for search
        $t = str_replace(['وضوء','صلاة','صوم','زكاة'], ['wudu','salat','sawm','zakat'], $t);
        // Remove accents/diacritics (best-effort)
        if (class_exists('Normalizer')) {
            $t = \Normalizer::normalize($t, \Normalizer::FORM_KD);
        }
        $t = preg_replace('/[\p{Mn}]+/u', '', $t); // strip combining marks
        return $t ?? '';
    }

    /**
     * Detect dominant script of a text (for logging/diagnostics)
     */
    protected function detectScript(string $text): string
    {
        $hasArabic = preg_match('/\p{Arabic}/u', $text) === 1;
        $hasCyrillic = preg_match('/\p{Cyrillic}/u', $text) === 1;
        $hasLatin = preg_match('/[A-Za-zÇƏĞIİÖŞÜçəğıiöşü]/u', $text) === 1;
        $count = ($hasArabic?1:0)+($hasCyrillic?1:0)+($hasLatin?1:0);
        if ($count > 1) return 'mixed';
        if ($hasArabic) return 'arabic';
        if ($hasCyrillic) return 'cyrillic';
        if ($hasLatin) return 'latin';
        return 'unknown';
    }
    protected $provider;
    protected $client;
    protected $trainingService;
    protected $embeddingService;

    public function __construct(TrainingService $trainingService, EmbeddingService $embeddingService)
    {
        $this->trainingService = $trainingService;
        $this->embeddingService = $embeddingService;
        $this->provider = AiProvider::getActive();
        
        if ($this->provider) {
            $this->initializeClient();
        }
    }

    protected function initializeClient(): void
    {
        // Check if API key is properly set
        if (empty($this->provider->api_key)) {
            Log::warning('AI Provider API key is not set', [
                'provider' => $this->provider->name,
                'driver' => $this->provider->driver
            ]);
            $this->client = null;
            return;
        }
        
        switch ($this->provider->driver) {
            case 'openai':
                $this->client = OpenAI::client($this->provider->api_key);
                break;
            case 'deepseek':
                // DeepSeek uses OpenAI-compatible API
                $this->client = OpenAI::factory()
                    ->withApiKey($this->provider->api_key)
                    ->withBaseUri($this->provider->base_url ?: 'https://api.deepseek.com')
                    ->make();
                break;
            case 'anthropic':
                // Anthropic needs custom implementation
                $this->client = null; // Will use HTTP client directly
                break;
            case 'custom':
                // For custom OpenAI-compatible APIs
                $this->client = OpenAI::factory()
                    ->withApiKey($this->provider->api_key)
                    ->withBaseUri($this->provider->base_url)
                    ->make();
                break;
        }
    }

    public function chat(array $messages, ?int $maxTokens = null): array
    {
        if (!$this->provider) {
            throw new Exception('AI provayder konfiqurasiya edilməyib.');
        }

        // Add knowledge base context if available
        $messages = $this->enhanceWithKnowledge($messages);

        // Determine safe max tokens automatically per model/provider
        $requested = ($maxTokens === null) ? 16000 : (int)$maxTokens; // user/requested preference
        $safeMax = $this->computeSafeMaxTokens($messages, $requested);

        switch ($this->provider->driver) {
            case 'openai':
            case 'deepseek':
            case 'custom':
                return $this->chatWithOpenAICompatible($messages, $safeMax);
            case 'anthropic':
                return $this->chatWithAnthropic($messages, $safeMax);
            default:
                throw new Exception('Dəstəklənməyən AI driver: ' . $this->provider->driver);
        }
    }

    protected function chatWithOpenAICompatible(array $messages, int $maxTokens): array
    {
        try {
            // Ensure client exists (API key configured)
            if (!$this->client) {
                throw new Exception('AI provayder API açarı konfiqurasiya edilməyib.');
            }

            // Set timeout for the request
            set_time_limit(120); // 2 minutes timeout
            
            $params = [
                'model' => $this->provider->model ?: 'gpt-3.5-turbo',
                'messages' => $messages,
                'max_tokens' => $maxTokens,
                'temperature' => floatval($this->provider->temperature ?? 0.7),
            ];

            // Force ultra-strict generation when external learning is blocked
            $strictMode = (bool) Settings::get('ai_strict_mode', true);
            $superStrictMode = (bool) Settings::get('ai_super_strict_mode', false);
            $blockExternalLearning = (bool) Settings::get('ai_external_learning_blocked', true);
            if ($blockExternalLearning && ($strictMode || $superStrictMode)) {
                $params['temperature'] = 0.0;
                // Optionally constrain sampling even more if supported
                $params['top_p'] = 0.1;
                $params['presence_penalty'] = 0.0;
                $params['frequency_penalty'] = 0.0;
            }

            // Add custom parameters if defined (but re-clamp max_tokens after merge)
            if ($this->provider->custom_params) {
                $customParams = json_decode($this->provider->custom_params, true);
                if (is_array($customParams)) {
                    $params = array_merge($params, $customParams);
                }
            }
            // Re-compute safe max in case custom params changed it
            $params['max_tokens'] = $this->computeSafeMaxTokens($messages, (int)($params['max_tokens'] ?? $maxTokens));

            Log::info('Sending AI request', [
                'provider' => $this->provider->name,
                'model' => $params['model'],
                'message_count' => count($messages)
            ]);

            $response = $this->client->chat()->create($params);

            return [
                'content' => $response->choices[0]->message->content,
                'tokens' => $response->usage->total_tokens ?? 0,
            ];
        } catch (\Throwable $e) {
            Log::error('AI request failed', [
                'provider' => $this->provider->name ?? null,
                'error' => $e->getMessage()
            ]);
            throw new Exception('AI sorğusu uğursuz oldu: ' . $e->getMessage());
        }
    }

    protected function chatWithAnthropic(array $messages, int $maxTokens): array
    {
        try {
            // Set timeout for the request
            set_time_limit(120); // 2 minutes timeout
            
            // Convert messages to Anthropic format
            $systemMessage = '';
            $anthropicMessages = [];
            
            foreach ($messages as $msg) {
                if ($msg['role'] === 'system') {
                    $systemMessage = $msg['content'];
                } else {
                    $anthropicMessages[] = [
                        'role' => $msg['role'] === 'user' ? 'user' : 'assistant',
                        'content' => $msg['content']
                    ];
                }
            }
            
            Log::info('Sending Anthropic request', [
                'model' => $this->provider->model ?: 'claude-3-sonnet-20240229',
                'message_count' => count($anthropicMessages)
            ]);

            $safeMax = $this->computeSafeMaxTokens($messages, $maxTokens);
            $response = Http::timeout(90)->withHeaders([
                'x-api-key' => $this->provider->api_key,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->post($this->provider->base_url ?: 'https://api.anthropic.com/v1/messages', [
                'model' => $this->provider->model ?: 'claude-3-sonnet-20240229',
                'system' => $systemMessage,
                'messages' => $anthropicMessages,
                'max_tokens' => $safeMax,
            ]);

            if (!$response->successful()) {
                throw new Exception($response->json()['error']['message'] ?? 'Anthropic API error');
            }

            $data = $response->json();
            
            return [
                'content' => $data['content'][0]['text'],
                'tokens' => $data['usage']['input_tokens'] + $data['usage']['output_tokens'],
            ];
        } catch (Exception $e) {
            Log::error('Anthropic request failed', [
                'error' => $e->getMessage()
            ]);
            throw new Exception('Anthropic sorğusu uğursuz oldu: ' . $e->getMessage());
        }
    }

    protected function enhanceWithKnowledge(array $messages): array
    {
        // Check if knowledge base is enabled
        $useKnowledgeBase = (bool) Settings::get('ai_use_knowledge_base', true);
        
        // Get the last user message
        $lastUserMessage = null;
        foreach (array_reverse($messages) as $msg) {
            if ($msg['role'] === 'user') {
                $lastUserMessage = $msg['content'];
                break;
            }
        }

        if (!$lastUserMessage) {
            return $messages;
        }

        Log::info('AI ENHANCEMENT ACTIVATED', [
            'query' => $lastUserMessage,
            'query_script' => $this->detectScript($lastUserMessage),
            'provider' => $this->provider?->name,
            'model' => $this->provider?->model,
            'use_knowledge_base' => $useKnowledgeBase
        ]);

        // Initialize content variables
        $urlContent = '';
        $qaContent = '';
        $generalContent = '';
        
        // Only search knowledge base if enabled
        if ($useKnowledgeBase) {
            // Get search method from admin settings
            $searchMethod = AiProcessSetting::get('ai_search_method', 'deep_search');
            
            // Debug: Database query
            // Safe database stats - check if source_url column exists
            $urlItemsCount = 0;
            try {
                $urlItemsCount = KnowledgeBase::whereNotNull('source_url')->where('source_url', '!=', '')->count();
            } catch (\Exception $e) {
                // source_url column doesn't exist, count by source field containing URLs
                $urlItemsCount = KnowledgeBase::where('source', 'LIKE', 'http%')->count();
            }
            
            Log::info('KNOWLEDGE BASE SEARCH ACTIVE', [
                'user_query' => $lastUserMessage,
                'search_method' => $searchMethod,
                'total_knowledge_items' => KnowledgeBase::count(),
                'active_items' => KnowledgeBase::where('is_active', true)->count(),
                'url_items' => $urlItemsCount,
                'qa_items' => KnowledgeBase::where('category', 'qa')->count()
            ]);
            
            // Pre-log keyword extraction for visibility
            $__dbgKeywords = $this->extractSmartKeywords($lastUserMessage);
            Log::debug('KB SEARCH PREVIEW', [
                'search_method' => $searchMethod,
                'keywords' => array_slice($__dbgKeywords, 0, 10)
            ]);

            if ($searchMethod === 'standard_search') {
                // STANDARD SEARCH: Only URL content (fast performance)
                $urlContent = $this->getUrlTrainedContent($lastUserMessage);  // ONLY PRIORITY 1
                Log::info('STANDARD SEARCH MODE: Only URL content searched');
            } else {
                // DEEP SEARCH: Full 3-tier priority system
                $urlContent = $this->getUrlTrainedContent($lastUserMessage);  // PRIORITY 1
                $qaContent = $this->getQATrainedContent($lastUserMessage);    // PRIORITY 2
                $generalContent = $this->getGeneralKnowledgeContent($lastUserMessage); // PRIORITY 3
                
                // Fallback: Try broad search if nothing found
                if (empty($urlContent) && empty($qaContent) && empty($generalContent)) {
                    Log::info('NO CONTENT FOUND - Trying broad search');
                    $broadContent = $this->getBroadSearchContent($lastUserMessage);
                    if (!empty($broadContent)) {
                        $generalContent = $broadContent;
                    }
                }
                Log::info('DEEP SEARCH MODE: Full 3-tier priority system used');
            }
        } else {
            Log::info('KNOWLEDGE BASE DISABLED - Using admin prompt only');
        }
        
        // Build Universal System Prompt with configurable controls
        $universalSystemPrompt = $this->buildAdvancedSystemPrompt($urlContent, $qaContent, $generalContent, $lastUserMessage);

        // CRITICAL LOG: Check if external learning is blocked without content
        $blockExternalLearning = (bool) Settings::get('ai_external_learning_blocked', true);
        $hasAnyKbContent = !empty($urlContent) || !empty($qaContent) || !empty($generalContent);
        
        if ($blockExternalLearning && !$hasAnyKbContent) {
            Log::warning('🔴 CRITICAL RESTRICTION ACTIVE: External learning blocked, no KB content available', [
                'user_query' => $lastUserMessage,
                'restriction_active' => true,
                'knowledge_base_empty' => true,
                'will_force_no_data_message' => true
            ]);
        }
        
        if ($blockExternalLearning && $hasAnyKbContent) {
            Log::info('🟡 RESTRICTION MODE: External learning blocked but KB content available', [
                'user_query' => $lastUserMessage,
                'has_url_content' => !empty($urlContent),
                'has_qa_content' => !empty($qaContent),
                'has_general_content' => !empty($generalContent)
            ]);
        }

        // Log content summary before applying prompt
        Log::debug('KB CONTENT SUMMARY', [
            'url_content_len' => strlen($urlContent),
            'qa_content_len' => strlen($qaContent),
            'general_content_len' => strlen($generalContent),
            'has_any' => (!empty($urlContent) || !empty($qaContent) || !empty($generalContent))
        ]);

        // Apply system prompt to messages
        $systemMessageIndex = null;
        foreach ($messages as $index => $msg) {
            if ($msg['role'] === 'system') {
                $systemMessageIndex = $index;
                break;
            }
        }

        if ($systemMessageIndex !== null) {
            $messages[$systemMessageIndex]['content'] = $universalSystemPrompt;
        } else {
            array_unshift($messages, [
                'role' => 'system',
                'content' => $universalSystemPrompt
            ]);
        }

        return $messages;
    }

    /**
     * Compute a safe max_tokens value based on model capabilities and current prompt size.
     */
    protected function computeSafeMaxTokens(array $messages, int $requested): int
    {
        $caps = $this->getModelCaps();
        $context = $caps['context'] ?? 8192;
        $maxOut = $caps['max_output'] ?? 8192;

        $promptTokens = $this->estimateTokensFromMessages($messages);
        // Keep a safety margin
        $budget = max(1, $context - $promptTokens - 100);
        $safe = max(1, min($requested, $maxOut, $budget));
        return $safe;
    }

    /**
     * Very rough token estimator (characters/4 heuristic)
     */
    protected function estimateTokensFromMessages(array $messages): int
    {
        $chars = 0;
        foreach ($messages as $m) {
            $chars += isset($m['content']) && is_string($m['content']) ? mb_strlen($m['content']) : 0;
        }
        return (int) max(1, ceil($chars / 4));
    }

    /**
     * Return per-model capability: context window and max output tokens.
     */
    protected function getModelCaps(): array
    {
        $driver = $this->provider->driver ?? 'openai';
        $model = strtolower((string) ($this->provider->model ?? ''));

        // Defaults (conservative)
        $caps = ['context' => 8192, 'max_output' => 8192];

        if ($driver === 'anthropic' || str_contains($model, 'claude')) {
            // Claude 3 family often supports large contexts (e.g., 200k), outputs usually <= 4096
            $caps = ['context' => 200000, 'max_output' => 4096];
        } elseif (str_contains($model, 'gpt-4o') || str_contains($model, '4o')) {
            $caps = ['context' => 128000, 'max_output' => 8192];
        } elseif (str_contains($model, 'gpt-4') || str_contains($model, '4.1') || str_contains($model, '4-turbo')) {
            $caps = ['context' => 128000, 'max_output' => 8192];
        } elseif (str_contains($model, 'gpt-3.5') || str_contains($model, '3.5')) {
            // Many 3.5 variants ~4k or 16k. Use safe mid.
            $caps = ['context' => 8192, 'max_output' => 4096];
        } elseif ($driver === 'deepseek' || str_contains($model, 'deepseek')) {
            $caps = ['context' => 128000, 'max_output' => 8192];
        }

        // If admin set custom context via custom_params (optional advanced)
        // Example: {"context_window": 32768, "max_output": 4096}
        if ($this->provider->custom_params) {
            $cp = json_decode($this->provider->custom_params, true);
            if (is_array($cp)) {
                if (isset($cp['context_window']) && (int)$cp['context_window'] > 0) {
                    $caps['context'] = (int)$cp['context_window'];
                }
                if (isset($cp['max_output']) && (int)$cp['max_output'] > 0) {
                    $caps['max_output'] = (int)$cp['max_output'];
                }
            }
        }

        return $caps;
    }
    
    /**
     * Language-agnostic keyword extraction for multilingual search.
     * - Works with any script (Latin, Arabic, Cyrillic, etc.)
     * - Minimal stopwords across languages to avoid over-filtering
     * - Keeps tokens length >= 2 and prioritizes longer tokens
     */
    protected function extractSmartKeywords(string $query): array
    {
        $originalQuery = $query;
        // Normalize spacing
        $query = trim(preg_replace('/\s+/u', ' ', $query));

        // Collect letter sequences across all languages (Unicode letter category)
        // This will capture words in Arabic, Persian, Turkish, English, etc.
        $matches = [];
        preg_match_all('/\p{L}{2,}/u', mb_strtolower($query, 'UTF-8'), $matches);
        $tokens = $matches[0] ?? [];

        // Minimal multilingual stopword set (Keeps recall high)
        $stop = [
            // Azerbaijani/Turkish
            've','və','ki','da','də','ile','ilə','için','üçün','bu','o','bir','mi','mu','mı','mü','ne','nə','nasıl','necə','hangi','hansı',
            // English
            'the','and','or','for','with','about','how','what','which','who','when','where','why',
            // Arabic/Persian common particles
            'و','في','من','على','الى','عن','ما','كيف','متى','أين','اي','که','در','با','از','برای','چی','چه'
        ];

        $filtered = array_filter($tokens, function ($t) use ($stop) {
            // Keep token if not in stopwords and length >= 2 (already ensured)
            return !in_array($t, $stop, true);
        });

        // Sort by length desc to prioritize more specific tokens
        usort($filtered, function ($a, $b) {
            return mb_strlen($b, 'UTF-8') <=> mb_strlen($a, 'UTF-8');
        });

        // Unique while preserving order
        $seen = [];
        $keywords = [];
        foreach ($filtered as $t) {
            if (!isset($seen[$t])) {
                $seen[$t] = true;
                $keywords[] = $t;
            }
        }

        // Expand with multilingual synonyms (domain aware)
        $keywords = $this->expandKeywordsWithSynonyms($keywords);

        Log::info('SMART KEYWORD EXTRACTION (UNIVERSAL)', [
            'original_query' => $originalQuery,
            'detected_script' => $this->detectScript($originalQuery),
            'tokens_total' => count($tokens),
            'filtered_total' => count($keywords),
            'keywords_top' => array_slice($keywords, 0, 8)
        ]);

        return $keywords;
    }
    
    /**
     * PRIORITY 1: Get URL-based trained content (HIGHEST PRIORITY)
     */
    protected function getUrlTrainedContent(string $query): string
    {
        try {
            // Smart keyword extraction
            $keywords = $this->extractSmartKeywords($query);
            $exactPhrase = trim($query);
            
        Log::info('ADVANCED URL SEARCH DEBUG', [
                'original_query' => $query,
                'query_script' => $this->detectScript($query),
                'smart_keywords' => $keywords,
                'exact_phrase' => $exactPhrase
            ]);
            
            // Safe query - check if source_url column exists
            $urlKnowledge = collect();
            
            try {
                // Advanced multi-tier search strategy
                $urlKnowledge = KnowledgeBase::where('is_active', true)
                    ->whereNotNull('source_url')
                    ->where('source_url', '!=', '')
                    ->where(function ($q) use ($exactPhrase, $keywords, $query) {
                        // TIER 1: Exact phrase match (highest priority)
                        $q->where(function($exact) use ($exactPhrase) {
                            $exact->where('title', 'LIKE', "%{$exactPhrase}%")
                                  ->orWhere('content', 'LIKE', "%{$exactPhrase}%");
                        });
                        
                        // TIER 2: All keywords present (high priority)
                        if (count($keywords) >= 2) {
                            $q->orWhere(function($all) use ($keywords) {
                                foreach ($keywords as $keyword) {
                                    $all->where('title', 'LIKE', "%{$keyword}%")
                                        ->orWhere('content', 'LIKE', "%{$keyword}%");
                                }
                            });
                        }
                        
                        // TIER 3: Important keywords only
                        $q->orWhere(function($important) use ($keywords) {
                            foreach ($keywords as $keyword) {
                                if (strlen($keyword) >= 4) { // Only longer, more specific words
                                    $important->orWhere('title', 'LIKE', "%{$keyword}%")
                                             ->orWhere('content', 'LIKE', "%{$keyword}%");
                                }
                            }
                        });
                    })
                    ->orderByRaw('CASE 
                        WHEN title LIKE ? THEN 1 
                        WHEN content LIKE ? THEN 2
                        WHEN title LIKE ? THEN 3
                        ELSE 4 END', ["%{$exactPhrase}%", "%{$exactPhrase}%", "%" . (isset($keywords[0]) ? $keywords[0] : '') . "%"])
                    ->limit(3)
                    ->get();
            } catch (\Exception $e) {
                // Fallback: search by source field containing URLs
                $urlKnowledge = KnowledgeBase::where('is_active', true)
                    ->where(function ($q) {
                        $q->where('source', 'LIKE', 'http%')
                          ->orWhere('source', 'LIKE', 'https%')
                          ->orWhere('source', 'LIKE', '%URL%');
                    })
                    ->where(function ($q) use ($query, $keywords) {
                        // Exact phrase search
                        $q->where('title', 'LIKE', "%{$query}%")
                          ->orWhere('content', 'LIKE', "%{$query}%");
                        
                        // Token-by-token search (language-agnostic)
                        foreach ($keywords as $word) {
                            $q->orWhere('title', 'LIKE', "%{$word}%")
                              ->orWhere('content', 'LIKE', "%{$word}%");
                        }
                    })
                    ->orderBy('updated_at', 'desc')
                    ->limit(3)
                    ->get();
                
                Log::warning('source_url column not found, using source field fallback');
            }
                
            Log::info('URL SEARCH RESULT', [
                'found_items' => $urlKnowledge->count(),
                'titles' => $urlKnowledge->pluck('title')->toArray(),
                'keywords_used' => $keywords,
                'exact_phrase' => $exactPhrase
            ]);
                
            if ($urlKnowledge->isEmpty()) {
                Log::debug('URL SEARCH: No results in primary strategy, trying synonym/loose fallback');
                // Fallback: try with synonyms-only tokens and ANY-match (looser)
                $synKeywords = $this->expandKeywordsWithSynonyms($keywords);
                $urlKnowledge = KnowledgeBase::where('is_active', true)
                    ->whereNotNull('source_url')
                    ->where('source_url', '!=', '')
                    ->where(function ($q) use ($synKeywords) {
                        foreach (array_slice($synKeywords, 0, 6) as $word) {
                            $q->orWhere('title', 'LIKE', "%{$word}%")
                              ->orWhere('content', 'LIKE', "%{$word}%");
                        }
                    })
                    ->orderBy('updated_at', 'desc')
                    ->limit(5)
                    ->get();
                Log::info('URL SEARCH FALLBACK RESULT', [
                    'found_items' => $urlKnowledge->count(),
                    'syn_keywords_used' => array_slice($synKeywords, 0, 6)
                ]);
                if ($urlKnowledge->isEmpty()) {
                    // Fallback stage 2: Load recent imported items and match in PHP with normalization (handles encoding issues)
                    Log::debug('URL SEARCH: No results after synonym fallback, trying PHP-normalized scan');
                    $candidates = KnowledgeBase::where('is_active', true)
                        ->whereNotNull('source_url')
                        ->where('source_url', '!=', '')
                        ->orderBy('updated_at', 'desc')
                        ->limit(120)
                        ->get(['id','title','content','source','source_url','category','updated_at']);

                    $normKeywords = $this->expandKeywordsWithSynonyms($keywords);
                    $ranked = [];
                    foreach ($candidates as $item) {
                        $hay = $this->normalizeForSearch(($item->title ?? '') . ' ' . ($item->content ?? ''));
                        $score = 0;
                        foreach (array_slice($normKeywords, 0, 10) as $kw) {
                            $kwN = $this->normalizeForSearch($kw);
                            if ($kwN !== '' && mb_stripos($hay, $kwN) !== false) {
                                $score += 1;
                            }
                        }
                        if ($score > 0) {
                            $ranked[] = ['score' => $score, 'item' => $item];
                        }
                    }
                    usort($ranked, function($a, $b){ return $b['score'] <=> $a['score']; });
                    $urlKnowledge = collect(array_map(function($r){ return $r['item']; }, array_slice($ranked, 0, 5)));

                    Log::info('URL SEARCH PHP-FILTER RESULT', [
                        'found_items' => $urlKnowledge->count(),
                        'top_scores' => array_slice(array_map(function($r){ return $r['score']; }, $ranked), 0, 5)
                    ]);

                    if ($urlKnowledge->isEmpty()) {
                        return '';
                    }
                }
            }
            
            $context = "URL MƏLUMAT MƏNBƏLƏR (ƏN YÜKSƏK PRİORİTET):\n\n";
            foreach ($urlKnowledge as $item) {
                $context .= "BAŞLIQ: {$item->title}\n";
                $context .= "MƏZMUN: {$item->content}\n";
                
                // Safe access to source_url
                try {
                    $sourceUrl = $item->source_url ?? $item->source ?? 'N/A';
                } catch (\Exception $e) {
                    $sourceUrl = $item->source ?? 'N/A';
                }
                $context .= "MƏNBƏ LINK: {$sourceUrl}\n";
                $context .= "KATEQORİYA: {$item->category}\n\n";
            }
            
            // Safe logging
            $urlArray = [];
            try {
                $urlArray = $urlKnowledge->pluck('source_url')->toArray();
            } catch (\Exception $e) {
                $urlArray = $urlKnowledge->pluck('source')->toArray();
            }
            
            Log::info('URL CONTENT PROVIDED (PRIORITY 1)', [
                'items_count' => $urlKnowledge->count(),
                'urls' => $urlArray
            ]);
            
            return $context;
            
        } catch (Exception $e) {
            Log::error('Error getting URL content', ['error' => $e->getMessage()]);
            return '';
        }
    }
    
    /**
     * PRIORITY 2: Get Q&A trained content
     */
    protected function getQATrainedContent(string $query): string
    {
        try {
            // 1) Try semantic best match using embeddings
            $best = $this->findBestQAMatch($query);
            if ($best) {
                $context = "SUAL-CAVAB MƏLUMATLARı (Q&A OVERRIDE):\n\n";
                $context .= "BAŞLIQ: {$best->title}\n";
                $context .= "MƏZMUN: {$best->content}\n";
                $context .= "MƏNBƏ: Q&A Training\n";
                $context .= "KATEQORİYA: {$best->category}\n\n";
                return $context;
            }

            // 2) Fallback to keyword search
            $words = explode(' ', strtolower($query));
            $words = array_filter($words, function($word) { return strlen($word) > 2; });
            $qaKnowledge = KnowledgeBase::where('is_active', true)
                ->where('category', 'qa')
                ->where(function ($subQ) use ($query, $words) {
                    $subQ->where('title', 'LIKE', "%{$query}%")
                         ->orWhere('content', 'LIKE', "%{$query}%");
                    foreach ($words as $word) {
                        $subQ->orWhere('title', 'LIKE', "%{$word}%")
                             ->orWhere('content', 'LIKE', "%{$word}%");
                    }
                })
                ->orderBy('created_at', 'desc')
                ->limit(2)
                ->get();

            if ($qaKnowledge->isEmpty()) { return ''; }

            $context = "SUAL-CAVAB MƏLUMATLARı (2-Cİ PRİORİTET):\n\n";
            foreach ($qaKnowledge as $item) {
                $context .= "BAŞLIQ: {$item->title}\n";
                $context .= "MƏZMUN: {$item->content}\n";
                $context .= "MƏNBƏ: Q&A Training\n";
                $context .= "KATEQORİYA: {$item->category}\n\n";
            }
            return $context;
            
        } catch (Exception $e) {
            Log::error('Error getting Q&A content', ['error' => $e->getMessage()]);
            return '';
        }
    }
    
    /**
     * PRIORITY 3: Get general knowledge content (fallback)
     */
    protected function getGeneralKnowledgeContent(string $query): string
    {
        try {
            // Safe query for general knowledge - avoid source_url if column doesn't exist
            $generalKnowledge = collect();
            
            try {
                // Try with source_url column
                $generalKnowledge = KnowledgeBase::where('is_active', true)
                    ->whereNull('source_url')
                    ->where('category', '!=', 'qa')
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'LIKE', "%{$query}%")
                          ->orWhere('content', 'LIKE', "%{$query}%");
                    })
                    ->orderBy('created_at', 'desc')
                    ->limit(2)
                    ->get();
            } catch (\Exception $e) {
                // Fallback: don't use source_url column
                $generalKnowledge = KnowledgeBase::where('is_active', true)
                    ->where('category', '!=', 'qa')
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'LIKE', "%{$query}%")
                          ->orWhere('content', 'LIKE', "%{$query}%");
                    })
                    ->orderBy('created_at', 'desc')
                    ->limit(2)
                    ->get();
            }
                
            if ($generalKnowledge->isEmpty()) {
                return '';
            }
            
            $context = "ÜMUMI BİLİK BAZASI (3-CÜ PRİORİTET):\n\n";
            foreach ($generalKnowledge as $item) {
                $context .= "BAŞLIQ: {$item->title}\n";
                $context .= "MƏZMUN: {$item->content}\n";
                $context .= "MƏNBƏ: {$item->source}\n";
                $context .= "KATEQORİYA: {$item->category}\n\n";
            }
            
            Log::info('GENERAL KNOWLEDGE PROVIDED (PRIORITY 3)', [
                'items_count' => $generalKnowledge->count()
            ]);
            
            return $context;
            
        } catch (Exception $e) {
            Log::error('Error getting general knowledge', ['error' => $e->getMessage()]);
            return '';
        }
    }
    
    /**
     * Broad search for any content when specific searches fail
     */
    protected function getBroadSearchContent(string $query): string
    {
        try {
            $keywords = $this->extractSmartKeywords($query);
            $exactPhrase = trim($query);
            
            Log::info('SMART BROAD SEARCH DEBUG', [
                'original_query' => $query,
                'smart_keywords' => $keywords,
                'exact_phrase' => $exactPhrase
            ]);
            
            $broadKnowledge = KnowledgeBase::where('is_active', true)
                ->where(function ($q) use ($exactPhrase, $keywords, $query) {
                    // TIER 1: Exact phrase match (highest priority)
                    $q->where(function($exact) use ($exactPhrase) {
                        $exact->where('title', 'LIKE', "%{$exactPhrase}%")
                              ->orWhere('content', 'LIKE', "%{$exactPhrase}%");
                    });
                    
                    // TIER 2: Important keywords (high priority)
                    foreach (array_slice($keywords, 0, 3) as $keyword) {
                        if (strlen($keyword) >= 4) {
                            $q->orWhere(function($kw) use ($keyword) {
                                $kw->where('title', 'LIKE', "%{$keyword}%")
                                   ->orWhere('content', 'LIKE', "%{$keyword}%");
                            });
                        }
                    }
                    
                    // TIER 3: All keywords (fallback)
                    foreach ($keywords as $keyword) {
                        $q->orWhere('title', 'LIKE', "%{$keyword}%")
                          ->orWhere('content', 'LIKE', "%{$keyword}%");
                    }
                })
                ->orderByRaw('CASE 
                    WHEN title LIKE ? THEN 1 
                    WHEN content LIKE ? THEN 2
                    WHEN title LIKE ? THEN 3
                    ELSE 4 END', ["%{$exactPhrase}%", "%{$exactPhrase}%", "%" . (isset($keywords[0]) ? $keywords[0] : '') . "%"])
                ->limit(3)
                ->get();
                
            if ($broadKnowledge->isEmpty()) {
                Log::info('BROAD SEARCH: No results found');
                return '';
            }
            
            $context = "GENIŞ AXTARİŞ NƏTİCƏLƏRİ:\n\n";
            foreach ($broadKnowledge as $item) {
                $source = $item->source_url ? "URL: {$item->source_url}" : "Mənbə: {$item->source}";
                $context .= "BAŞLIQ: {$item->title}\n";
                $context .= "MƏZMUN: {$item->content}\n";
                $context .= "MƏNBƏ: {$source}\n";
                $context .= "KATEQORİYA: {$item->category}\n\n";
            }
            
            Log::info('BROAD SEARCH RESULTS', [
                'found_items' => $broadKnowledge->count(),
                'titles' => $broadKnowledge->pluck('title')->toArray()
            ]);
            
            return $context;
            
        } catch (Exception $e) {
            Log::error('Error in broad search', ['error' => $e->getMessage()]);
            return '';
        }
    }
    /**
     * Expand extracted keywords with multilingual synonyms for better recall
     */
    protected function expandKeywordsWithSynonyms(array $keywords): array
    {
        $map = [
            // Ablution
            'dəstəmaz' => ['destamaz','abdest','vuzu','wudu','wudhu','وضوء'],
            'abdest' => ['dəstəmaz','destamaz','vuzu','wudu','wudhu','وضوء'],
            'wudu' => ['dəstəmaz','abdest','vuzu','wudhu','وضوء'],
            'vuzu' => ['dəstəmaz','abdest','wudu','wudhu','وضوء'],
            'وضوء' => ['dəstəmaz','abdest','wudu','wudhu','vuzu'],
            // Prayer
            'namaz' => ['salat','prayer','صلاة'],
            'salat' => ['namaz','prayer','صلاة'],
            'صلاة' => ['namaz','salat','prayer'],
            // Fasting
            'oruc' => ['sawm','roza','صوم'],
            'sawm' => ['oruc','roza','صوم'],
            'صوم' => ['oruc','sawm','roza'],
            // Zakat
            'zəkat' => ['zekat','zakat','زكاة'],
            'zekat' => ['zəkat','zakat','زكاة'],
            'زكاة' => ['zəkat','zekat','zakat'],
        ];
        $out = [];
        $seen = [];
        foreach ($keywords as $k) {
            if (!isset($seen[$k])) { $out[] = $k; $seen[$k]=true; }
            if (isset($map[$k])) {
                foreach ($map[$k] as $syn) {
                    if (!isset($seen[$syn])) { $out[] = $syn; $seen[$syn]=true; }
                }
            }
        }
        return $out;
    }

    protected function findBestQAMatch(string $query): ?\App\Models\KnowledgeBase
    {
        try {
            $queryVec = $this->embeddingService->embed($query);
            if (!$queryVec) return null;

            $candidates = \App\Models\KnowledgeBase::where('is_active', true)
                ->where('category', 'qa')
                ->orderBy('updated_at', 'desc')
                ->limit(500)
                ->get(['id','title','content','embedding','updated_at']);

            $bestScore = 0.0; $best = null;
            foreach ($candidates as $item) {
                $vec = $item->embedding ? json_decode($item->embedding, true) : null;
                if (!is_array($vec)) { continue; }
                $score = EmbeddingService::cosine($queryVec, $vec);
                if ($score > $bestScore) { $bestScore = $score; $best = $item; }
            }

            // Use a reasonable threshold (tuneable)
            if ($best && $bestScore >= 0.82) {
                return $best;
            }
            return null;
        } catch (\Throwable $e) {
            \Log::warning('findBestQAMatch failed: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Build advanced system prompt with configurable admin controls
     */
    protected function buildAdvancedSystemPrompt(string $urlContent, string $qaContent, string $generalContent, string $userQuery): string
    {
        // Get admin settings from both Settings and AiProcessSetting
        $adminPrompt = Settings::get('ai_system_prompt', '');
        $useKnowledgeBase = (bool) Settings::get('ai_use_knowledge_base', true);
        $strictMode = (bool) Settings::get('ai_strict_mode', true);
        $topicRestrictions = Settings::get('ai_topic_restrictions', '');
        $blockInternet = (bool) Settings::get('ai_internet_blocked', true);
        $blockExternalLearning = (bool) Settings::get('ai_external_learning_blocked', true);
        $superStrictMode = (bool) Settings::get('ai_super_strict_mode', false);
        
        // Get new AI Process Settings
        $noDataMessage = AiProcessSetting::get('ai_no_data_message', 'Bu mövzu haqqında məlumat bazamda məlumat yoxdur.');
        $restrictionCommand = AiProcessSetting::get('ai_restriction_command', 'YALNIZ BU CÜMLƏ İLƏ CAVAB VER VƏ BAŞQA HEÇ NƏ YAZMA:');
        $strictIdentity = AiProcessSetting::get('ai_prompt_strict_identity', 'Sən İslami köməkçi AI assistantsan və dini məsələlərdə yardım edirsən.');
        $normalIdentity = AiProcessSetting::get('ai_prompt_normal_identity', 'Sən köməkçi AI assistantsan və istifadəçilərə yardım edirsən.');
        
        // Check if we have any knowledge base content
        $hasContent = !empty($urlContent) || !empty($qaContent) || !empty($generalContent);
        
        // CRITICAL LOG: External learning status
        if ($blockExternalLearning && !$hasContent) {
            Log::warning('EXTERNAL_LEARNING_BLOCKED: No content available, will add restriction in prompt');
        }
        
        // Build STRONG prompt with MAXIMUM restrictions
        $prompt = "";
        
        // 1. IDENTITY - Use strict by default if any restrictions are on
        $identity = ($strictMode || $blockExternalLearning || $superStrictMode) ? $strictIdentity : $normalIdentity;
        $prompt .= "{$identity}\n\n";
        
        // 2. SUPER STRICT MODE - STRONGEST RESTRICTIONS
        if ($superStrictMode) {
            $prompt .= "🔒 SUPER STRICT MODE AKTIV 🔒\n";
            $prompt .= "MÜTLƏDİ QADAĞA:\n";
            $prompt .= "❌ Təlimatdan KƏNARda HEÇ NƏ YAZMA\n";
            $prompt .= "❌ Öz biliklərini İSTİFADƏ ETMƏ\n";
            $prompt .= "❌ Ümumi məlumat VERMƏ\n";
            $prompt .= "✅ YALNIZ aşağıda verilən məlumatlara ƏSASLAN\n\n";
        }
        
        // 3. EXTERNAL LEARNING BLOCK - CORE RESTRICTION
        if ($blockExternalLearning) {
            $prompt .= "⚠️ XARİCİ BİLİK QADAĞASI: ⚠️\n";
            $prompt .= "- Öz ümumi biliklərinindən İSTİFADƏ QADAĞANDIR\n";
            $prompt .= "- İnternet məlumatları QADAĞANDIR\n";
            $prompt .= "- YALNIZ admin tərəfindən verilən məlumatları istifadə et\n";
            $prompt .= "- Əgər məlumat yoxdursa: '{$noDataMessage}'\n\n";
        }
        
        // 4. INTERNET BLOCKING
        if ($blockInternet) {
            $prompt .= "🌐 İNTERNET QADAĞASI: İnternet məlumatlarına müraciət ETİMƏ\n\n";
        }
        
        // 5. TOPIC RESTRICTIONS
        if ($strictMode && !empty($topicRestrictions)) {
            $prompt .= "📝 MÖVZU MƏHDUDİYYƏTLƏRİ:\n{$topicRestrictions}\n\n";
        }
        
        // 6. ADMIN SYSTEM PROMPT (HIGHEST PRIORITY)
        if (!empty($adminPrompt)) {
            $prompt .= "👤 ADMIN SİSTEM TƏLİMATI (ƏN YÜKSƏK PRİORİTET):\n{$adminPrompt}\n\n";
        }
        
        // 7. KNOWLEDGE BASE CONTENT (if available)
        if ($hasContent && $useKnowledgeBase) {
            $prompt .= "\n\n" . str_repeat("=", 80) . "\n";
            $prompt .= "🔴 DİQQƏT! AŞAĞIDAKI MƏLUMATLAR VERİLİB! 🔴\n";
            $prompt .= "Bu məlumatlar DOLU və TƏFSİLATLIDIR. Onları MÜTLƏQ OXUYUN və İSTİFADƏ EDİN!\n";
            $prompt .= "'Məlumat yoxdur' DEMƏYİN, çünki aşağıda məlumatlar VERİLİB!\n";
            $prompt .= str_repeat("=", 80) . "\n\n";
            $prompt .= "📚 VERİLƏN MƏLUMAT MƏNBƏLƏR (YALNIZ BUNLARI İSTİFADƏ ET):\n";
            
            if (!empty($urlContent)) {
                $prompt .= "\n=== PRİORİTET 1: URL MƏLUMATLARI ===\n{$urlContent}\n";
            }
            if (!empty($qaContent)) {
                $prompt .= "\n=== PRİORİTET 2: SUAL-CAVAB ===\n{$qaContent}\n";
            }
            if (!empty($generalContent)) {
                $prompt .= "\n=== PRİORİTET 3: ÜMUMI BİLİK BAZASI ===\n{$generalContent}\n";
            }
            
            // RESPONSE RULES - MAXIMUM RESTRICTIONS
            $prompt .= "\n🎯 CAVAB VERMƏ QAYDALARI:\n";
            
            if ($blockExternalLearning || $superStrictMode) {
                $prompt .= "\n" . str_repeat("-", 80) . "\n";
                $prompt .= "❗❗❗ ƏSAS QAYDA ❗❗❗\n";
                $prompt .= "Yuxarıda VERİLƏN məlumatlar DOLU və MÜFƏSSƏLDIR!\n";
                $prompt .= "Sən bu məlumatları görürsən və oxuya bilərsən!\n";
                $prompt .= "Bu məlumatlardan istifadə edərək istifadəçinin SUALINA CAVAB VER!\n";
                $prompt .= str_repeat("-", 80) . "\n\n";
                
                $prompt .= "✅ NƏ ETMELİSƏN:\n";
                $prompt .= "  1. Yuxarıdakı 'MƏZMUN:' bloklarını OXUYUN\n";
                $prompt .= "  2. Sualun cavabını məlumatlarda AXTAR\n";
                $prompt .= "  3. Tapdiqlarınızı Azərbaycan dilində İZAH EDİN\n";
                $prompt .= "  4. Sonda 'Mənbələr:' yazıb URL-ləri göstərin\n\n";
                
                $prompt .= "❌ NƏ ETMƏMƏLİSƏN:\n";
                $prompt .= "  ✘ 'Məlumat yoxdur' DEMƏ (məlumat yuxarıda VERİLİB!)\n";
                $prompt .= "  ✘ Öz biliyini əlavə etmə\n";
                $prompt .= "  ✘ Uydurma və təxmin etmə\n\n";
                
                $prompt .= "❗ YADİNDA SAXLA: Yuxarıda DOLU məlumatlar var! Onları OXUYUN və İSTİFADƏ EDİN!\n";
            }
            
            // Query focus
            $keywords = $this->extractSmartKeywords($userQuery);
            if (!empty($keywords)) {
                $topKeywords = implode(', ', array_slice($keywords, 0, 3));
                $prompt .= "🔍 SUAL AÇAR SÖZLƏRİ: {$topKeywords}\n";
                $prompt .= "🎯 YALNIZ bu açar sözlər haqqında cavab ver\n";
            }
            
            $prompt .= "📏 QISA və məqsədli cavab ver\n";
            $prompt .= "📄 Mənbə göstər (URL-lər açıq şəkildə)\n";
            
            if ($strictMode) {
                $prompt .= "🕌 Dini məsələlərdə son dərəcə ehtiyatlı ol\n";
            }
            
        } else if (!$hasContent) {
            // NO CONTENT AVAILABLE - FORCE RESTRICTION
            if ($blockExternalLearning || $useKnowledgeBase) {
                $prompt .= "\n\n" . str_repeat("=", 80) . "\n";
                $prompt .= "⛔⛔⛔ HEÇ BİR MƏLUMAT BAZASI MƏVCUD DEYIL ⛔⛔⛔\n";
                $prompt .= "Məlumat bazasında bu mövzu ilə bağlı HEÇ NƏ VERİLMƏYİB.\n";
                $prompt .= "Öz bilklərini istifadə etməyin QADAQANDIR.\n";
                $prompt .= "YALNIZ AŞAĞIDAKI CAVABI VER:\n";
                $prompt .= "'{$noDataMessage}'\n";
                $prompt .= str_repeat("=", 80) . "\n";
            }
        }
        
        // Do not force any language here; Admin controls response language via settings/prompt.
        
        Log::info('STRICT PROMPT BUILT', [
            'strict_mode' => $strictMode,
            'super_strict_mode' => $superStrictMode,
            'block_external_learning' => $blockExternalLearning,
            'block_internet' => $blockInternet,
            'has_content' => $hasContent,
            'use_knowledge_base' => $useKnowledgeBase,
            'prompt_length' => strlen($prompt),
            'includes_priority1' => str_contains($prompt, 'PRİORİTET 1'),
            'includes_no_data_msg' => str_contains($prompt, $noDataMessage)
        ]);
        
        return $prompt;
    }
    
    /**
     * Build knowledge context from search results
     */
    protected function buildKnowledgeContext($knowledgeItems): string
    {
        $context = "";
        
        foreach ($knowledgeItems as $item) {
            $context .= "TITLE: {$item->title}\n";
            $context .= "CONTENT: {$item->content}\n";
            $context .= "SOURCE: {$item->source}\n";
            $context .= "CATEGORY: {$item->category}\n\n";
        }
        
        return $context;
    }

    /**
     * Get formatted chatbot response
     */
    public function getChatbotResponse(string $message, array $conversation = []): string
    {
        try {
            // Build conversation messages
            $messages = [];
            
            // Add conversation history
            foreach ($conversation as $msg) {
                $messages[] = [
                    'role' => $msg['role'] ?? 'user',
                    'content' => $msg['content']
                ];
            }
            
            // Add current user message
            $messages[] = [
                'role' => 'user',
                'content' => $message
            ];
            
            // Get AI response
            $response = $this->chat($messages);
            $rawContent = $response['content'] ?? '';
            
            // Format the response
            $formattedResponse = $this->formatChatbotResponse($rawContent);
            
            Log::info('Chatbot response generated', [
                'user_message' => $message,
                'raw_length' => strlen($rawContent),
                'formatted_length' => strlen($formattedResponse)
            ]);
            
            return $formattedResponse;
            
        } catch (Exception $e) {
            Log::error('Chatbot response error', [
                'message' => $message,
                'error' => $e->getMessage()
            ]);
            
            return 'Üzr istəyirəm, hazırda texniki problem var. Zəhmət olmasa bir az sonra yenidən cəhd edin.';
        }
    }
    
    /**
     * Format chatbot response for better presentation
     */
    protected function formatChatbotResponse(string $rawResponse): string
    {
        if (empty($rawResponse)) {
            return 'Bu mövzu haqqında əzbərlədiyim məlumat yoxdur.';
        }
        
        // Clean excessive whitespace and line breaks
        $response = $this->cleanWhitespace($rawResponse);
        
        // Format source references
        $response = $this->formatSourceReferences($response);
        
        // Add proper formatting for headings and emphasis
        $response = $this->addTextFormatting($response);
        
        return $response;
    }
    
    /**
     * Clean excessive whitespace and line breaks
     */
    protected function cleanWhitespace(string $text): string
    {
        // Remove excessive line breaks (more than 2 consecutive)
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        
        // Remove excessive spaces
        $text = preg_replace('/[ \t]{2,}/', ' ', $text);
        
        // Clean up spaces around line breaks
        $text = preg_replace('/[ \t]*\n[ \t]*/', "\n", $text);
        
        // Ensure proper spacing after periods
        $text = preg_replace('/\.([A-ZÇƏĞIİÖŞÜ])/', '. $1', $text);
        
        return trim($text);
    }
    
    /**
     * Format source references according to requirements
     */
    protected function formatSourceReferences(string $text): string
    {
        $blockExternal = (bool) Settings::get('ai_external_learning_blocked', true);

        // Normalize Q&A markers
        $text = preg_replace(
            '/Mənbə:\s*Q&A Training[^\n]*/',
            '**Mənbə:** S&C Təlimat Bazası',
            $text
        );
        
        // URL sources -> keep, format nicely
        $text = preg_replace(
            '/Mənbə:\s*(https?:\/\/[^\s\n]+)/',
            '**Mənbə:** $1',
            $text
        );

        if ($blockExternal) {
            // If external learning is blocked, prevent generic named sources.
            // Replace any non-URL sources with unified label.
            $text = preg_replace_callback(
                '/Mənbə:\s*([^\n]+?)(?=\n|$)/',
                function($m) {
                    if (preg_match('/https?:\/\//', $m[1])) return $m[0];
                    return '**Mənbə:** S&C Təlimat Bazası';
                },
                $text
            );
            // Remove common bullet lists of book names under a heading "Mənbələr" if present
            $text = preg_replace('/(?mi)^\s*(Mənbələr|Əsas mənbələr|Rəvayət mənbələri):?\s*(\n\s*[-•].*)+/u', '**Mənbə:** S&C Təlimat Bazası', $text);
        } else {
            // For non-blocked mode, ensure generic sources at least are formatted
            $text = preg_replace(
                '/(?<!\*)Mənbə:\s*([^\n]+?)(?=\n|$)/',
                '**Mənbə:** $1',
                $text
            );
        }
        
        return $text;
    }
    
    /**
     * Add proper text formatting (bold, italic)
     */
    protected function addTextFormatting(string $text): string
    {
        // Get format terms from admin settings
        $formatTermsString = AiProcessSetting::get('ai_format_islamic_terms', 'dəstəmaz,namaz,oruc,hac,zəkat,qiblə,imam,ayə,hadis,sünnet,fərz,vacib,məkruh,haram,halal,Allah,Peyğəmbər,İslam,Quran');
        
        // Convert string to array
        $formatTerms = [];
        if (!empty($formatTermsString)) {
            $formatTerms = array_map('trim', explode(',', $formatTermsString));
            $formatTerms = array_filter($formatTerms); // Remove empty values
        }
        
        // Format important terms with bold
        foreach ($formatTerms as $term) {
            if (!empty($term)) {
                // Make terms bold (case insensitive)
                $text = preg_replace(
                    '/\\b(' . preg_quote($term) . ')\\b/iu',
                    '**$1**',
                    $text
                );
            }
        }
        
        // Format numbered lists
        $text = preg_replace('/^(\d+[.)]) /m', '**$1** ', $text);
        
        // Format bullet points
        $text = preg_replace('/^[•\-\*] /m', '• ', $text);
        
        // Ensure proper paragraph spacing
        $text = preg_replace('/\n([A-ZÇƏĞIİÖŞÜ])/', "\n\n$1", $text);
        
        return $text;
    }

    public function testConnection(): bool
    {
        try {
            $this->chat([
                ['role' => 'user', 'content' => 'Salam']
            ], 10);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}

