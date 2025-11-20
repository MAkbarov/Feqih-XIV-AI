<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Interfaces\ChatProviderInterface;
use App\Interfaces\VectorStoreInterface;
use App\Models\KnowledgeBaseChunk;
use Illuminate\Support\Facades\DB;
use App\Models\AiProcessSetting;
use Illuminate\Support\Facades\Log;

class RAGQueryService
{
    protected EmbeddingProviderInterface $embeddingProvider;
    protected ChatProviderInterface $chatProvider;
    protected VectorStoreInterface $vectorStore;

    public function __construct(
        EmbeddingProviderInterface $embeddingProvider,
        ChatProviderInterface $chatProvider,
        VectorStoreInterface $vectorStore
    ) {
        $this->embeddingProvider = $embeddingProvider;
        $this->chatProvider = $chatProvider;
        $this->vectorStore = $vectorStore;
    }

    /**
     * Detect small-talk to skip RAG search
     */
    private function isSmallTalk(string $text): bool
    {
        $t = mb_strtolower(trim($text), 'UTF-8');
        // Normalize Azerbaijani chars
        $map = ['ə'=>'e','ı'=>'i','ş'=>'s','ç'=>'c','ö'=>'o','ü'=>'u','ğ'=>'g'];
        $t = strtr($t, $map);
        
        $patterns = [
            '/^(?:salam|selam|merhaba|hello|hi|hey)[.!?\s]*$/u',
            '/(?:neces?en|hal-?iniz nece?dir|sabah xeyir|axsam xeyir)/u',
            '/^(?:tesek+?r|sag ol|cok sagol|minnetdar)[.!?\s]*$/u',
        ];
        foreach ($patterns as $re) {
            if (preg_match($re, $t)) return true;
        }
        
        $len = mb_strlen($t, 'UTF-8');
        if ($len <= 8 && !str_contains($t, '?')) {
            $short = ['salam','selam','hello','hi','hey','sag ol','tesekkur'];
            if (in_array($t, $short)) return true;
        }
        return false;
    }

    /**
     * Query RAG system with user question
     * 
     * @param string $question User's question
     * @param array $options Additional options
     * @return array ['answer' => string, 'sources' => array, 'metadata' => array]
     */
    public function query(string $question, array $options = []): array
    {
        $startTime = microtime(true);
        // Optional restrictions passed by caller (UI/controller)
        $restrictKbId = isset($options['restrict_kb_id']) ? (int) $options['restrict_kb_id'] : null;

        Log::info('🔍 RAG QUERY STARTED', [
            'question' => $question,
            'options' => $options
        ]);

        try {
            // Small-talk check: return friendly response without RAG
            if ($this->isSmallTalk($question)) {
                Log::info('🗣️ RAG: Small-talk detected, returning friendly response', [
                    'question' => $question
                ]);
                $responses = [
                    'Salam! Necə kömək edə bilərəm? İslami məsələlərlə bağlı sualınız varsa, məmnüniyyətlə cavab verərəm.',
                    'Salamlar! Sizə necə kömək edə bilərəm? Dini mövzuları soruşa bilərsiniz.',
                    'Salam! Buyurun, sualınız varmı? Şəriət, ibadat və ya digər İslami məsələlər haqqında soruşa bilərsiniz.',
                    'Salam! Xöş gördük. İslami biliklərlə bağlı sualınızı yaza bilərsiniz.',
                    'Salamlar! Necəsən? Şəriət və ibadat mövzularında köməyə ehtiyacınız varsa, buyurun.',
                ];
                return [
                    'answer' => $responses[array_rand($responses)],
                    'sources' => [],
                    'metadata' => [
                        'small_talk' => true,
                        'chunks_used' => 0,
                        'context_length' => 0,
                        'duration_ms' => 0,
                        'top_relevance_score' => 0
                    ]
                ];
            }

            // CONTINUATION MODE: if explicitly requested, continue from given KB and chunk_index without fresh vector search
            if (($options['continue'] ?? false) && isset($options['kb_id']) && isset($options['start_after_index'])) {
                $kbId = (int) $options['kb_id'];
                $startAfter = (int) $options['start_after_index'];
                $maxChars = (int) $this->getSetting('rag_continue_max_chars', 2000);

                $rows = \App\Models\KnowledgeBaseChunk::with('knowledgeBase')
                    ->where('knowledge_base_id', $kbId)
                    ->where('chunk_index', '>', $startAfter)
                    ->orderBy('chunk_index', 'asc')
                    ->orderBy('id', 'asc')
                    ->limit(12)
                    ->get();

                $buffer = '';
                foreach ($rows as $row) {
                    $txt = trim($row->content ?? '');
                    if ($txt === '') continue;
                    if ($buffer !== '') { $buffer .= "\n"; }
                    $buffer .= $txt;
                    if (mb_strlen($buffer, 'UTF-8') >= $maxChars * 1.2) break;
                }
                $buffer = $this->smartTrimToSentence($buffer, $maxChars);

                // CRITICAL FIX: Do NOT use LLM rewrite on continuation - just return raw chunks
                // LLM was adding its own instructions instead of staying within KB content.
                // Now we return the exact content from the database without any AI modification.
                $answer = $buffer;

                $duration = round((microtime(true) - $startTime) * 1000);

                return [
                    'answer' => $answer,
                    'sources' => $rows->count() ? [[
                        'id' => $kbId,
                        'title' => $rows->first()->knowledgeBase->title ?? 'Unknown',
                        'source_url' => $rows->first()->knowledgeBase->source_url ?? null,
                        'category' => $rows->first()->knowledgeBase->category ?? null,
                        'relevance_score' => null,
                    ]] : [],
                    'metadata' => [
                        'continuation' => true,
                        'kb_id' => $kbId,
                        'started_after_index' => $startAfter,
                        'chunks_used' => $rows->count(),
                        'context_length' => mb_strlen($buffer, 'UTF-8'),
                        'duration_ms' => $duration,
                    ],
                ];
            }

            // Step 1: Generate embedding for the question
            $questionVector = $this->embeddingProvider->generateEmbedding($question);

            Log::info('🧠 QUESTION EMBEDDING GENERATED', [
                'dimension' => count($questionVector)
            ]);

            // Step 2: Retrieve top-k similar chunks from vector store
            $topK = (int)$this->getSetting('rag_top_k', 5);
            $minScore = floatval($this->getSetting('rag_min_score', 0));
            $allowedHostsCsv = (string) $this->getSetting('rag_allowed_hosts', '');
            $allowedHosts = array_values(array_filter(array_map(function($h){ return strtolower(trim($h)); }, explode(',', $allowedHostsCsv))));

            $similarChunks = $this->vectorStore->query($questionVector, $topK);
            $rawSimilar = $similarChunks; // keep a copy for fallback and dominance calc

            // If a KB restriction is provided, keep only matches from that KB
            if ($restrictKbId !== null) {
                $filtered = array_values(array_filter($similarChunks, function($c) use ($restrictKbId) {
                    return (int) ($c['metadata']['knowledge_base_id'] ?? -1) === $restrictKbId;
                }));
                if (!empty($filtered)) {
                    $similarChunks = $filtered;
                }
            }

            if (empty($similarChunks)) {
                Log::warning('⚠️ NO SIMILAR CHUNKS FOUND');
                // Fallback: keyword-based LIKE search in chunks (KB-only, still strict)
                $fallbackKeywords = $this->extractKeywordsSimple($question);
                $fallbackKeywords = array_slice($fallbackKeywords, 0, 3);
                if (!empty($fallbackKeywords)) {
                    $likeQuery = KnowledgeBaseChunk::with('knowledgeBase')
                        ->where(function($q) use ($fallbackKeywords) {
                            foreach ($fallbackKeywords as $kw) {
                                if ($kw !== '') {
                                    $q->orWhere('content', 'LIKE', "%{$kw}%");
                                }
                            }
                        })
                        ->limit(max(3, (int)$this->getSetting('rag_top_k', 5)))
                        ->get();
                    if ($likeQuery->count() > 0) {
                        Log::info('🆗 FALLBACK LIKE SEARCH USED', ['keywords' => $fallbackKeywords, 'found' => $likeQuery->count()]);
                        // Build context from fallback chunks
                        $contextParts = [];
                        $sources = [];
                        foreach ($likeQuery as $ch) {
                            // Respect allowed hosts if configured
                            $hostOk = true;
                            if (!empty(
                                array_values(array_filter(array_map(function($h){ return strtolower(trim($h)); }, explode(',', (string) $this->getSetting('rag_allowed_hosts','')))))
                            )) {
                                $allowedHosts = array_values(array_filter(array_map(function($h){ return strtolower(trim($h)); }, explode(',', (string) $this->getSetting('rag_allowed_hosts','')))));
                                $hurl = $ch->knowledgeBase->source_url ?? '';
                                $hhost = $this->parseHost($hurl);
                                $hostOk = empty($allowedHosts) || ($hhost && in_array($hhost, $allowedHosts, true));
                            }
                            if (!$hostOk) { continue; }
                            $contextParts[] = $ch->content;
                            $sourceKey = $ch->knowledge_base_id;
                            if (!isset($sources[$sourceKey])) {
                                $sources[$sourceKey] = [
                                    'id' => $ch->knowledge_base_id,
                                    'title' => $ch->knowledgeBase->title ?? 'Unknown',
                                    'source_url' => $ch->knowledgeBase->source_url ?? null,
                                    'category' => $ch->knowledgeBase->category ?? null,
                                    'relevance_score' => null
                                ];
                            }
                        }
                        $context = implode("\n\n---\n\n", $contextParts);
                        $prompt = $this->buildStrictRAGPrompt($question, $context);
                        $answer = $this->chatProvider->generateResponse($prompt, [
                            'temperature' => 0.05,  // CRITICAL: Very low to stay within KB content
                            'max_tokens' => 2000,
                            'frequency_penalty' => 0.3,
                            'presence_penalty' => 0.0,
                        ]);
                        $duration = round((microtime(true) - $startTime) * 1000);

                        // Determine dominant KB from fallback rows as well
                        $kbCounts = [];
                        $maxIdxByKb = [];
                        foreach ($likeQuery as $ch) {
                            $kid = (int) $ch->knowledge_base_id;
                            $kbCounts[$kid] = ($kbCounts[$kid] ?? 0) + 1;
                            $maxIdxByKb[$kid] = max($maxIdxByKb[$kid] ?? -1, (int) ($ch->chunk_index ?? -1));
                        }
                        arsort($kbCounts);
                        $domKb = !empty($kbCounts) ? array_key_first($kbCounts) : null;

                        return [
                            'answer' => trim($answer),
                            'sources' => array_values($sources),
                            'metadata' => [
                                'chunks_used' => count($contextParts),
                                'context_length' => mb_strlen($context),
                                'duration_ms' => $duration,
                                'top_relevance_score' => 0,
                                'dominant_kb_id' => $domKb,
                                'max_used_chunk_index_for_dominant' => $domKb !== null ? ($maxIdxByKb[$domKb] ?? null) : null,
                            ]
                        ];
                    }
                }
                return $this->noDataResponse($question);
            }

            Log::info('📚 SIMILAR CHUNKS RETRIEVED', [
                'count' => count($similarChunks),
                'top_score' => $similarChunks[0]['score'] ?? 0,
                'avg_score' => array_sum(array_column($similarChunks, 'score')) / count($similarChunks)
            ]);

            // Optional: filter by min relevance score
            $rawSimilar = $similarChunks; // keep a copy for fallback
            if ($minScore > 0) {
                $similarChunks = array_values(array_filter($similarChunks, function($c) use ($minScore) {
                    return ($c['score'] ?? 0) >= $minScore;
                }));
                if (empty($similarChunks)) {
                    Log::warning('⚠️ ALL CHUNKS BELOW MIN SCORE', ['min_score' => $minScore]);
                    // Fallback: relax score threshold to 0 and continue with rawSimilar
                    $similarChunks = $rawSimilar;
                }
            }

            // Step 3: Fetch chunk contents from database
            $chunkIds = array_map(fn($c) => $c['metadata']['chunk_id'], $similarChunks);
            $chunks = KnowledgeBaseChunk::with('knowledgeBase')
                ->whereIn('id', $chunkIds)
                ->get()
                ->keyBy('id');

            // Optional: filter by allowed hosts with normalization (strip leading www.)
            if (!empty($allowedHosts)) {
                $allowedHostsNorm = array_map(function($h) {
                    $h = strtolower(trim($h));
                    if (str_starts_with($h, 'www.')) { $h = substr($h, 4); }
                    return $h;
                }, $allowedHosts);

                $similarChunks = array_values(array_filter($similarChunks, function($c) use ($chunks, $allowedHostsNorm) {
                    $chunk = $chunks->get($c['metadata']['chunk_id'] ?? 0);
                    if (!$chunk) return false;
                    $url = $chunk->knowledgeBase->source_url ?? '';
                    $host = $this->parseHost($url);
                    if (!$host) return false;
                    return in_array($host, $allowedHostsNorm, true);
                }));
                if (empty($similarChunks)) {
                    Log::warning('⚠️ ALL CHUNKS FILTERED BY HOST', ['allowed_hosts' => $allowedHosts]);
                    return $this->noDataResponse($question);
                }
            }

            // Keyword filtering: TEMPORARILY DISABLED - relying on semantic vector search only
            // The vector embeddings should capture semantic meaning better than keyword matching
            $keywords = []; // Disabled
            if (false && !empty($keywords)) {  // Disabled condition
                $beforeKeywordFilter = $similarChunks;
                $similarChunks = array_values(array_filter($similarChunks, function($c) use ($chunks, $keywords) {
                    $chunk = $chunks->get($c['metadata']['chunk_id'] ?? 0);
                    if (!$chunk) return false;
                    $hay = mb_strtolower($chunk->content ?? '', 'UTF-8');
                    $hayN = $this->normalizeAz($hay);
                    foreach ($keywords as $kw) {
                        if ($kw === '') continue;
                        $kwN = $this->normalizeAz($kw);
                        if ($kwN !== '' && (mb_stripos($hayN, $kwN, 0, 'UTF-8') !== false)) {
                            return true;
                        }
                    }
                    return false;
                }));
                if (empty($similarChunks)) {
                    Log::warning('⚠️ ALL CHUNKS FILTERED BY KEYWORDS, USING VECTOR TOP RESULTS AS FALLBACK', ['keywords' => $keywords]);
                    // Fallback: use top-N vector results without keyword filter
                    $similarChunks = array_slice($beforeKeywordFilter, 0, max(1, (int) $this->getSetting('rag_top_k', 5)));
                }
            }

            // Build context from chunks (preserve order by relevance)
            $contextParts = [];
            $sources = [];

            foreach ($similarChunks as $similarChunk) {
                $chunkId = $similarChunk['metadata']['chunk_id'] ?? null;
                $kbId = $similarChunk['metadata']['knowledge_base_id'] ?? null;
                $chunkIndex = $similarChunk['metadata']['chunk_index'] ?? null;

                // 1) Try by exact ID from metadata
                $chunk = $chunkId ? $chunks->get($chunkId) : null;

                // 2) If not found (e.g., re-index recreated IDs), map by (kbId + chunk_index)
                if (!$chunk && $kbId !== null && $chunkIndex !== null) {
                    $chunk = \App\Models\KnowledgeBaseChunk::where('knowledge_base_id', $kbId)
                        ->where('chunk_index', $chunkIndex)
                        ->orderBy('id', 'asc')
                        ->first();
                }

                if ($chunk && !empty($chunk->content)) {
                    $contextParts[] = $chunk->content;

                    // Collect unique sources
                    $sourceKey = $chunk->knowledge_base_id;
                    if (!isset($sources[$sourceKey])) {
                        $sources[$sourceKey] = [
                            'id' => $chunk->knowledge_base_id,
                            'title' => $chunk->knowledgeBase->title ?? 'Unknown',
                            'source_url' => $chunk->knowledgeBase->source_url ?? null,
                            'category' => $chunk->knowledgeBase->category ?? null,
                            'relevance_score' => $similarChunk['score']
                        ];
                    }
                }
            }

            // 3) As a last resort, if still no context built, take first paragraphs from the dominant KBs
            if (empty($contextParts)) {
                $kbScores = [];
                foreach ($similarChunks as $sc) {
                    $kid = $sc['metadata']['knowledge_base_id'] ?? null;
                    if ($kid === null) continue;
                    $kbScores[$kid] = ($kbScores[$kid] ?? 0) + floatval($sc['score'] ?? 0);
                }
                if (!empty($kbScores)) {
                    arsort($kbScores);
                    $topKbIds = array_slice(array_keys($kbScores), 0, max(1, (int) $this->getSetting('rag_fallback_kb_count', 2)));
                    $prefetch = \App\Models\KnowledgeBaseChunk::with('knowledgeBase')
                        ->whereIn('knowledge_base_id', $topKbIds)
                        ->orderBy('knowledge_base_id', 'asc')
                        ->orderBy('chunk_index', 'asc')
                        ->orderBy('id', 'asc')
                        ->limit(6)
                        ->get();
                    foreach ($prefetch as $ch) {
                        if (empty($ch->content)) continue;
                        $contextParts[] = $ch->content;
                        $sourceKey = $ch->knowledge_base_id;
                        if (!isset($sources[$sourceKey])) {
                            $sources[$sourceKey] = [
                                'id' => $ch->knowledge_base_id,
                                'title' => $ch->knowledgeBase->title ?? 'Unknown',
                                'source_url' => $ch->knowledgeBase->source_url ?? null,
                                'category' => $ch->knowledgeBase->category ?? null,
                                'relevance_score' => $kbScores[$sourceKey] ?? null,
                            ];
                        }
                    }
                }
            }

            $context = implode("\n\n---\n\n", $contextParts);

            // Collect used indices per KB for continuation
            $usedIndicesByKb = [];
            foreach ($similarChunks as $sc) {
                $cid = $sc['metadata']['chunk_id'] ?? null;
                $kbIdMeta = $sc['metadata']['knowledge_base_id'] ?? null;
                $idxMeta = $sc['metadata']['chunk_index'] ?? null;
                $chunkObj = $cid ? $chunks->get($cid) : null;
                $kbId = $chunkObj->knowledge_base_id ?? $kbIdMeta;
                $idx = $chunkObj->chunk_index ?? $idxMeta;
                if ($kbId !== null && $idx !== null) {
                    $usedIndicesByKb[$kbId] = $usedIndicesByKb[$kbId] ?? [];
                    $usedIndicesByKb[$kbId][] = (int) $idx;
                }
            }
            foreach ($usedIndicesByKb as $k => $arr) { $usedIndicesByKb[$k] = array_values(array_unique($arr)); }

            Log::info('📖 CONTEXT BUILT', [
                'context_length' => mb_strlen($context),
                'sources_count' => count($sources),
                'keywords' => $keywords,
                'allowed_hosts' => $allowedHosts,
                'used_indices_by_kb' => $usedIndicesByKb,
            ]);

            // Step 4: If super strict mode is enabled, return extractive answer (copy-only from chunks)
            $ragStrictMode = (bool)$this->getSetting('rag_strict_mode', true);
            $ragSuperStrictMode = (bool)$this->getSetting('rag_super_strict_mode', false);
            if ($ragSuperStrictMode) {
                $answer = $this->buildExtractiveAnswer($question, $similarChunks, $chunks, $keywords);
                if (trim($answer) !== '') {
                    $duration = round((microtime(true) - $startTime) * 1000);
                    Log::info('🧾 EXTRACTIVE ANSWER BUILT (super strict mode)', [
                        'length' => mb_strlen($answer),
                        'chunks_used' => count($contextParts)
                    ]);
                    return [
                        'answer' => trim($answer),
                        'sources' => array_values($sources),
                        'metadata' => [
                            'chunks_used' => count($contextParts),
                            'context_length' => mb_strlen($context),
                            'duration_ms' => $duration,
                            'top_relevance_score' => $similarChunks[0]['score'] ?? 0
                        ]
                    ];
                }
            }

            // Choose output mode: extractive | constrained | generative
            $outputMode = (string) $this->getSetting('rag_output_mode', 'generative');

            // Determine if we should anchor to the start of the dominant KB (for how-to queries)
            $extract = null;
            $anchorEnabled = (bool) $this->getSetting('rag_anchor_to_kb_start', true);
            if ($anchorEnabled && $this->looksLikeHowToQuestion($question)) {
                $dominantKbId = $this->findDominantKbId($similarChunks, $chunks);
                if ($dominantKbId) {
                    $overview = (bool) $this->getSetting('rag_summary_overview', true);
                    if ($overview) {
                        $wideMax = (int) $this->getSetting('rag_wide_extract_chars', 5000);
                        $extract = $this->buildKBWideExtract($dominantKbId, $wideMax);
                        Log::info('ANCHOR KB-WIDE SUMMARY', ['kb_id' => $dominantKbId, 'wide_len' => mb_strlen($extract ?? '', 'UTF-8')]);
                    } else {
                        $introMax = (int) $this->getSetting('rag_intro_max_chars', 1400);
                        $extract = $this->buildIntroFromKbStart($dominantKbId, $introMax);
                        Log::info('ANCHOR TO KB START', ['kb_id' => $dominantKbId, 'intro_len' => mb_strlen($extract ?? '', 'UTF-8')]);
                    }
                } else {
                    Log::info('ANCHOR SKIPPED - NO DOMINANT KB');
                }
            }

            if ($outputMode === 'extractive') {
                if ($extract === null || trim($extract) === '') {
                    $extract = $this->buildExtractiveAnswer($question, $similarChunks, $chunks, $keywords);
                }
                $answer = $extract;
            } elseif ($outputMode === 'constrained') {
                if ($extract === null || trim($extract) === '') {
                    $extract = $this->buildExtractiveAnswer($question, $similarChunks, $chunks, $keywords);
                }
                if (trim($extract) === '') {
                    // fallback to generative prompt
                    $prompt = $this->buildStrictRAGPrompt($question, $context);
                    $generationParams = [
                        'temperature' => 0.05,  // CRITICAL: Very low to stay within KB content
                        'max_tokens' => 2000,
                        'frequency_penalty' => 0.3,
                        'presence_penalty' => 0.0,
                    ];
                    $answer = $this->chatProvider->generateResponse($prompt, $generationParams);
                } else {
                    // Rewrite for fluency without adding faktlar; default output is concise numbered summary
                    $prepend = (bool) $this->getSetting('rag_constrained_prepend_extract', false);
                    $appendExcerpt = (bool) $this->getSetting('rag_constrained_append_extract', false);
                    $appendChars = (int) $this->getSetting('rag_append_excerpt_chars', 1200);
                    $rewrite = trim($this->rewriteFromExtract($extract, $question));
                    $answer = $prepend && $rewrite !== '' ? (trim($extract) . "\n\n" . $rewrite) : ($rewrite !== '' ? $rewrite : $extract);
                    if ($appendExcerpt) {
                        // optional snippet append disabled by default
                    }
                }
            } else {
                // Generative (legacy) mode with strict prompt
                $prompt = $this->buildStrictRAGPrompt($question, $context);
                $generationParams = [
                    'temperature' => 0.05,  // CRITICAL: Very low to stay within KB content
                    'max_tokens' => 2000,
                    'frequency_penalty' => 0.3,
                    'presence_penalty' => 0.0,
                ];
                $answer = $this->chatProvider->generateResponse($prompt, $generationParams);
            }

            $duration = round((microtime(true) - $startTime) * 1000);

            Log::info('✅ RAG QUERY COMPLETED', [
                'duration_ms' => $duration,
                'answer_length' => mb_strlen($answer),
                'sources_used' => count($sources)
            ]);

            // Compute dominant KB and max used index for continuation hints
            $dominantKbId = $this->findDominantKbId($similarChunks, $chunks);
            $maxUsedIdx = null;
            if ($dominantKbId !== null && isset($usedIndicesByKb[$dominantKbId])) {
                $maxUsedIdx = max($usedIndicesByKb[$dominantKbId]);
            }
            return [
                'answer' => trim($answer),
                'sources' => array_values($sources),
                'metadata' => [
                    'chunks_used' => count($contextParts),
                    'context_length' => mb_strlen($context),
                    'duration_ms' => $duration,
                    'top_relevance_score' => $similarChunks[0]['score'] ?? 0,
                    'dominant_kb_id' => $dominantKbId,
                    'used_chunk_indices_by_kb' => $usedIndicesByKb,
                    'max_used_chunk_index_for_dominant' => $maxUsedIdx,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('❌ RAG QUERY FAILED', [
                'question' => $question,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Build super strict prompt for retry when hallucination is detected
     */
    private function buildSuperStrictPrompt(string $question, string $context): string
    {
        $noDataMessage = $this->getSetting('ai_no_data_message', 'Bağışlayın, bu mövzu haqqında məlumat bazamda dəqiq məlumat tapılmadı.');
        
        return <<<PROMPT
***XƏBƏRDARLIQ: HƏRF-HƏRF KOPYALAMA REJİMİ***

Əvvəlki cavabında kontekstdə olmayan məlumat əlavə etdin. Bu QADAĞANDIR!

İndi YALNIZ kontekstdə olan məlumatı HƏRF-HƏRF vəya çox kiçik redaktə ilə ver.

🚫 QADAĞALAR:
- ÖZ BİLİYİNDƏN HEÇ NƏ ƏLAVƏ ETMƏ
- Kontekstdə olmayan addımlar, qaydalar, nümunələr ƏLAVƏ ETMƏ
- "Niyyət", "Əvvəlcə əlləri yuyun" kimi kontekstdə AYRI QEYD EDİLMƏYƏN addımlar ƏLAVƏ ETMƏ
- Yalnız kontekstdə AYNEN yazılan məlumatları ver

--- KONTEKST BAŞLANĞICI ---
{$context}
--- KONTEKST SONU ---

İstifadəçinin Sualı: "{$question}"

📝 Kontekstdəki məlumatları AYNEN və ya çox az redaktə ilə ver:
PROMPT;
    }

    /**
     * Build strict RAG prompt that forces LLM to use only provided context
     */
    private function buildStrictRAGPrompt(string $question, string $context): string
    {
        // RAG-specific strict modes
        $ragStrictMode = (bool)$this->getSetting('rag_strict_mode', true);
        $ragSuperStrictMode = (bool)$this->getSetting('rag_super_strict_mode', false);
        $noDataMessage = $this->getSetting('ai_no_data_message', 'Bağışlayın, bu mövzu haqqında məlumat bazamda dəqiq məlumat tapılmadı.');

        // Level 3: Super Strict Mode (Ultra-strict - copy only, literally)
        if ($ragSuperStrictMode && $ragStrictMode) {
            return <<<PROMPT
***XƏBƏRDARLIQ: BU TƏLIMAT QƏTI VƏ DÖNMƏZ QAYDALARI EHTİVA EDİR. POZULMASI QADAĞANDIR!***

Sən ANCAQ VƏ ANCAQ verilən KONTEKST mətnindən HƏRF-HƏRF KOPYALAYARAQ cavab verən bir sistemsən.

🚫 QADAĞALAR (heç bir halda pozula bilməzsən):
1. Öz biliyin və ya internetdən məlumat istifadə etmək QƏTI QADAĞANDIR
2. Cümlələri yenidən yazmaq, ümumiləşdirmək, parafraza etmək QADAĞANDIR
3. Kontekstdə olmayan HEÇ BİR söz və ya cümlə əlavə etmək QADAĞANDIR
4. "Məncə", "Düşünürəm", "Adətən", "Ümumiyyətlə" kimi fikirlər bildirmək QADAĞANDIR
5. Addımlar yaratmaq, siyahılar düzəltmək QADAĞANDIR (əgər kontekstdə hazır siyahı yoxdursa)

✅ YALNIZ BUNLARI EDƏ BİLƏRSƏN:
1. KONTEKSTDƏN birbaşa cümlə və ya paraqraf kopyalamaq
2. Əgər kontekstdə cavab YOXDURSA, YALNIZ bu mətni qaytar: "{$noDataMessage}"

⚠️ KONTEKSTƏ BAX VƏ YOXLA:
Aşağıdakı KONTEKST bölməsində istifadəçinin sualına aid məlumat VARMI?
- VARSA: O məlumatı HƏRF-HƏRF kopyala
- YOXDURSA: "{$noDataMessage}" cavabını ver

--- KONTEKST BAŞLANĞICI ---
{$context}
--- KONTEKST SONU ---

İstifadəçinin Sualı: "{$question}"

📝 CAVAB (yalnız kontekstdən kopyalanmış mətn və ya "məlumat yoxdur" mesajı):
PROMPT;
        }
        
        // Level 2: Strict Mode (Simple and direct)
        if ($ragStrictMode) {
            return <<<PROMPT
Sən aşağıda verilmiş kontekst məlumatlarına ƏSASƏN suallara cavab verən assistansan.

⚠️ MÜTLƏDİ QAYDA:
- YALNIZ aşağıdakı kontekstdə olan məlumatlardan istifadə et
- Kontekstdə olmayan heç bir məlumat əlavə etmə
- Öz ümumi biliklərinə MÜRACİƏT ETMƏ

✅ İCAZƏ VERİLƏNLƏR:
- Kontekstdəki məlumatı öz sözlərinlə aydın izah edə bilərsən
- Məlumatı strukturlaşdırıb təqdim edə bilərsən (nömrələmə, nöqtələmə)

❌ Əgər kontekstdə cavab YOXDURSA:
"{$noDataMessage}"

════════════════════════════════════════
KONTEKST (YALNIZ BUNDAN İSTİFADƏ ET):
{$context}
════════════════════════════════════════

İstifadəçinin sualı: "{$question}"

Kontekstə əsasən cavab:
PROMPT;
        }
        
        // Level 1: Normal Mode (Flexible - can add some general knowledge if needed)
        return <<<PROMPT
Sən yardımçı bir AI köməkçisisən.

Aşağıdakı KONTEKST məlumatlarını istifadəçinin sualına cavab vermək üçün əsas kimi istifadə et.
Kontekst əsas mənbədir, amma lazım gələrsə ümumi biliklərinlə də kömək edə bilərsən.

--- KONTEKST ---
{$context}
--- KONTEKST SONU ---

İstifadəçinin Sualı: "{$question}"

Kontekstdəki məlumatları nəzərə alaraq cavab ver:
PROMPT;
    }

    /**
     * Response when no data found
     */
    private function noDataResponse(string $question): array
    {
        $noDataMessage = AiProcessSetting::get('ai_no_data_message', 'Bağışlayın, bu mövzu haqqında məlumat bazamda dəqiq məlumat tapılmadı.');
        return [
            'answer' => $noDataMessage,
            'sources' => [],
            'metadata' => [
                'chunks_used' => 0,
                'context_length' => 0,
                'duration_ms' => 0,
                'top_relevance_score' => 0
            ]
        ];
    }

    /**
     * Detect obvious hallucinations (softer check than full validation)
     * Only rejects if answer contains many words that are clearly not in context
     */
    private function detectObviousHallucinations(string $answer, string $context): bool
    {
        $a = mb_strtolower($answer, 'UTF-8');
        $c = mb_strtolower($context, 'UTF-8');
        $aN = $this->normalizeAz($a);
        $cN = $this->normalizeAz($c);
        
        // Extract significant words (7+ letters) to reduce false positives from inflections
        preg_match_all('/\p{L}{7,}/u', $aN, $m);
        $words = array_unique($m[0] ?? []);
        
        if (empty($words)) return false;
        
        $missingCount = 0;
        foreach ($words as $w) {
            if (mb_stripos($cN, $w, 0, 'UTF-8') === false) {
                $missingCount++;
            }
        }
        
        // Consider it hallucination if more than 30% of significant words are missing
        $threshold = max(3, ceil(count($words) * 0.3));
        return $missingCount >= $threshold;
    }

    /**
     * Reject answers that contain 5+ letter words not present in the context (ultra-strict)
     */
    private function validateAnswerAgainstContext(string $answer, string $context): bool
    {
        $a = mb_strtolower($answer, 'UTF-8');
        $c = mb_strtolower($context, 'UTF-8');
        // Normalize for Azerbaijani equivalence
        $aN = $this->normalizeAz($a);
        $cN = $this->normalizeAz($c);
        preg_match_all('/\p{L}{5,}/u', $aN, $m);
        $words = $m[0] ?? [];
        $words = array_unique($words);
        foreach ($words as $w) {
            if (mb_stripos($cN, $w, 0, 'UTF-8') === false) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get setting from database
     */
    private function getSetting(string $key, $default = null)
    {
        $setting = DB::table('settings')->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    private function parseHost(?string $url): ?string
    {
        if (!$url) return null;
        $host = parse_url($url, PHP_URL_HOST);
        if (!$host) return null;
        $host = strtolower($host);
        if (str_starts_with($host, 'www.')) { $host = substr($host, 4); }
        return $host;
    }

    private function normalizeAz(string $text): string
    {
        // Fold Azerbaijani/Turkish letters and remove combining marks for robust matching
        $map = [
            'ə'=>'e','Ə'=>'e','ı'=>'i','İ'=>'i','ş'=>'s','Ş'=>'s','ç'=>'c','Ç'=>'c','ö'=>'o','Ö'=>'o','ü'=>'u','Ü'=>'u','ğ'=>'g','Ğ'=>'g'
        ];
        $t = strtr($text, $map);
        if (class_exists('Normalizer')) {
            $t = \Normalizer::normalize($t, \Normalizer::FORM_KD);
        }
        $t = preg_replace('/[\p{Mn}]+/u', '', $t);
        return $t ?? '';
    }

    private function endsWithSentenceTerminator(string $text): bool
    {
        return (bool) preg_match('/[\.!?…]\s*$/u', $text);
    }

    private function smartTrimToSentence(string $text, int $maxChars): string
    {
        if (mb_strlen($text, 'UTF-8') <= $maxChars) {
            // If already ends with terminator, return as-is; otherwise, try to trim to last terminator anyway
            if ($this->endsWithSentenceTerminator($text)) return $text;
            $pos = max(
                mb_strrpos($text, '.', 0, 'UTF-8') ?: -1,
                mb_strrpos($text, '!', 0, 'UTF-8') ?: -1,
                mb_strrpos($text, '?', 0, 'UTF-8') ?: -1,
                mb_strrpos($text, "…", 0, 'UTF-8') ?: -1,
                mb_strrpos($text, "\n", 0, 'UTF-8') ?: -1,
            );
            if ($pos > 0) return rtrim(mb_substr($text, 0, $pos + 1, 'UTF-8'));
            return rtrim($text);
        }
        $snippet = mb_substr($text, 0, $maxChars, 'UTF-8');
        $pos = max(
            mb_strrpos($snippet, '.', 0, 'UTF-8') ?: -1,
            mb_strrpos($snippet, '!', 0, 'UTF-8') ?: -1,
            mb_strrpos($snippet, '?', 0, 'UTF-8') ?: -1,
            mb_strrpos($snippet, "…", 0, 'UTF-8') ?: -1,
            mb_strrpos($snippet, "\n", 0, 'UTF-8') ?: -1,
        );
        if ($pos > 0) {
            return rtrim(mb_substr($snippet, 0, $pos + 1, 'UTF-8'));
        }
        // No terminator found; return the snippet as-is (trimmed)
        return rtrim($snippet);
    }

    private function completeWithNextChunkEnd(\App\Models\KnowledgeBaseChunk $chunk, int $maxAppend = 600): string
    {
        $text = trim($chunk->content ?? '');
        if ($text === '') return $text;
        if ($this->endsWithSentenceTerminator($text)) return $text;
        // Try to append from next chunk of the same KB to complete sentence
$next = \App\Models\KnowledgeBaseChunk::where('knowledge_base_id', $chunk->knowledge_base_id)
            ->where('chunk_index', '>', $chunk->chunk_index ?? 0)
            ->orderBy('chunk_index', 'asc')
            ->orderBy('id', 'asc')
            ->first();
        if ($next && !empty($next->content)) {
            $combined = rtrim($text) . ' ' . mb_substr($next->content, 0, $maxAppend, 'UTF-8');
            // Trim to sentence boundary on combined text
            return $this->smartTrimToSentence($combined, mb_strlen($combined, 'UTF-8'));
        }
        return $text;
    }

    private function completeWithPrevChunkStart(\App\Models\KnowledgeBaseChunk $chunk, int $maxPrepend = 400): string
    {
        $text = trim($chunk->content ?? '');
        if ($text === '') return $text;
        // Heuristic: if text starts mid-word or not with an uppercase/marker, try to prepend tail of previous chunk
        $startsClean = (bool) preg_match('/^(Məsələ\s*\d+|[A-ZƏIŞÇÖÜĞ])/u', $text);
        if ($startsClean) return $text;
$prev = \App\Models\KnowledgeBaseChunk::where('knowledge_base_id', $chunk->knowledge_base_id)
            ->where('chunk_index', '<', $chunk->chunk_index ?? 0)
            ->orderBy('chunk_index', 'desc')
            ->orderBy('id', 'desc')
            ->first();
        if ($prev && !empty($prev->content)) {
            $tail = mb_substr(trim($prev->content), -$maxPrepend, null, 'UTF-8');
            $combined = $tail . ' ' . $text;
            // Find last sentence terminator inside the tail and cut from there
            $prefixLen = mb_strlen($tail, 'UTF-8') + 1; // include the added space
            $prefix = mb_substr($combined, 0, $prefixLen, 'UTF-8');
            $pos = max(
                mb_strrpos($prefix, '.', 0, 'UTF-8') ?: -1,
                mb_strrpos($prefix, '!', 0, 'UTF-8') ?: -1,
                mb_strrpos($prefix, '?', 0, 'UTF-8') ?: -1,
                mb_strrpos($prefix, "…", 0, 'UTF-8') ?: -1,
                mb_strrpos($prefix, "\n", 0, 'UTF-8') ?: -1,
            );
            if ($pos > 0) {
                return ltrim(mb_substr($combined, $pos + 1, null, 'UTF-8'));
            }
            return $combined; // no terminator found, return combined as-is
        }
        return $text;
    }

    private function completeEndWithNextForText(\App\Models\KnowledgeBaseChunk $chunk, string $text, int $maxAppend = 600): string
    {
        if ($this->endsWithSentenceTerminator($text)) return $text;
$next = \App\Models\KnowledgeBaseChunk::where('knowledge_base_id', $chunk->knowledge_base_id)
            ->where('chunk_index', '>', $chunk->chunk_index ?? 0)
            ->orderBy('chunk_index', 'asc')
            ->orderBy('id', 'asc')
            ->first();
        if ($next && !empty($next->content)) {
            $combined = rtrim($text) . ' ' . mb_substr($next->content, 0, $maxAppend, 'UTF-8');
            return $this->smartTrimToSentence($combined, mb_strlen($combined, 'UTF-8'));
        }
        return $text;
    }

    private function looksLikeHowToQuestion(string $q): bool
    {
        $q = mb_strtolower($q, 'UTF-8');
        return (mb_strpos($q, 'necə', 0, 'UTF-8') !== false) ||
               (mb_strpos($q, 'qayda', 0, 'UTF-8') !== false) ||
               (mb_strpos($q, 'addım', 0, 'UTF-8') !== false) ||
               (mb_strpos($q, 'qaydaları', 0, 'UTF-8') !== false);
    }

    private function findDominantKbId(array $similarChunks, $chunks): ?int
    {
        $scores = [];
        foreach ($similarChunks as $sc) {
            $cid = $sc['metadata']['chunk_id'] ?? null;
            if (!$cid) continue;
            $chunk = $chunks->get($cid);
            if (!$chunk) continue;
            $kb = (int) $chunk->knowledge_base_id;
            $scores[$kb] = ($scores[$kb] ?? 0) + floatval($sc['score'] ?? 0);
        }
        if (empty($scores)) return null;
        arsort($scores);
        return array_key_first($scores);
    }

    private function buildIntroFromKbStart(int $kbId, int $maxChars = 1400): string
    {
        // Build a continuous buffer from the beginning of the KB to avoid mid-sentence duplication
        $chunks = \App\Models\KnowledgeBaseChunk::where('knowledge_base_id', $kbId)
            ->orderBy('chunk_index', 'asc')
            ->orderBy('id', 'asc')
            ->limit(20)
            ->get();

        $buffer = '';
        foreach ($chunks as $ch) {
            $txt = trim($ch->content ?? '');
            if ($txt === '') continue;
            if ($buffer !== '') { $buffer .= "\n"; }
            $buffer .= $txt;
            if (mb_strlen($buffer, 'UTF-8') >= $maxChars * 2) { // safety cap
                break;
            }
        }
        if ($buffer === '') return '';
        // Trim the combined buffer to sentence boundary within maxChars
        $combined = $this->smartTrimToSentence($buffer, $maxChars);
        // If still not ending with terminator, try to extend with the tail of the next chunk
        if (!$this->endsWithSentenceTerminator($combined) && $chunks->count() > 0) {
            $last = $chunks->last();
            $completed = $this->completeEndWithNextForText($last, $combined, 400);
            $combined = $this->smartTrimToSentence($completed, $maxChars);
        }
        return trim($combined);
    }

    private function buildKBWideExtract(int $kbId, int $maxChars = 5000): string
    {
        // Prefer chunks that mention global structures: şərt(ler), vacibat, addım, məsh, üz, qollar, ayaqlar
        $all = \App\Models\KnowledgeBaseChunk::where('knowledge_base_id', $kbId)
            ->orderBy('chunk_index', 'asc')
            ->orderBy('id', 'asc')
            ->limit(120)
            ->get();
        if ($all->count() === 0) return '';
        $scores = [];
        foreach ($all as $ch) {
            $t = mb_strtolower($ch->content ?? '', 'UTF-8');
            $w = 0;
            if ($t === '') { $scores[$ch->id] = -1; continue; }
            $w += (mb_strpos($t, 'şərt', 0, 'UTF-8') !== false) ? 8 : 0;
            $w += (mb_strpos($t, 'vacib', 0, 'UTF-8') !== false) ? 3 : 0;
            $w += (mb_strpos($t, 'məsələ', 0, 'UTF-8') !== false) ? 2 : 0;
            $w += (mb_strpos($t, 'üz', 0, 'UTF-8') !== false) ? 2 : 0;
            $w += (mb_strpos($t, 'qol', 0, 'UTF-8') !== false) ? 2 : 0;
            $w += (mb_strpos($t, 'baş', 0, 'UTF-8') !== false) ? 2 : 0;
            $w += (mb_strpos($t, 'ayaq', 0, 'UTF-8') !== false) ? 2 : 0;
            $w += (mb_strpos($t, 'məsh', 0, 'UTF-8') !== false) ? 2 : 0;
            $w += (mb_strpos($t, 'yuy', 0, 'UTF-8') !== false) ? 2 : 0; // yumaq/yuyulma
            $scores[$ch->id] = $w;
        }
        // Take top N by score, but keep their original order
        $topIds = collect($scores)
            ->sortByDesc(function($v,$k){ return $v; })
            ->keys()
            ->take(40)
            ->toArray();
        $selected = $all->filter(function($ch) use ($topIds){ return in_array($ch->id, $topIds); })
                        ->sortBy([['chunk_index','asc'],['id','asc']]);
        // Build buffer
        $buf = '';
        foreach ($selected as $ch) {
            $txt = trim($ch->content ?? '');
            if ($txt === '') continue;
            if ($buf !== '') $buf .= "\n";
            $buf .= $txt;
            if (mb_strlen($buf, 'UTF-8') >= $maxChars * 1.2) break;
        }
        if ($buf === '') return '';
        $buf = $this->smartTrimToSentence($buf, $maxChars);
        return $buf;
    }

    /**
     * Build an extractive answer by copying only from retrieved chunks.
     * Selects sentences containing question keywords; if none, falls back to top chunk snippets.
     */
    private function buildExtractiveAnswer(string $question, array $similarChunks, $chunks, array $keywords = []): string
    {
        // Prepare keywords (normalized)
        if (empty($keywords)) {
            $keywords = $this->extractKeywordsSimple($question);
        }
        $keywordsN = array_map(fn($k) => $this->normalizeAz(mb_strtolower($k, 'UTF-8')), $keywords);

        $collected = [];
        $used = [];
        $maxChars = (int) $this->getSetting('rag_extractive_max_chars', 3200);

        foreach ($similarChunks as $sc) {
            $cid = $sc['metadata']['chunk_id'] ?? null;
            if (!$cid) continue;
            $chunk = $chunks->get($cid);
            if (!$chunk || empty($chunk->content)) continue;

            // Complete both start and end across adjacent chunks
            $fullStart = $this->completeWithPrevChunkStart($chunk, 500);
            $full = $this->completeEndWithNextForText($chunk, $fullStart, 800);

            // Split into sentences (basic)
            $sentences = preg_split('/(?<=[\.!?\n])\s+/u', $full) ?: [$full];

            foreach ($sentences as $s) {
                $s = trim($s);
                if ($s === '' || isset($used[$s])) continue;
                // Prefer only lines that end cleanly with a sentence terminator
                if (!$this->endsWithSentenceTerminator($s)) {
                    // Attempt to trim this individual sentence to its own terminator if it's too long or incomplete
                    $s = $this->smartTrimToSentence($s, 1000);
                }
                if ($s === '') continue;

                // Skip obviously broken sentence starts (e.g., mid-word, lowercase start not beginning a proper sentence)
                $goodStart = (bool) preg_match('/^(Məsələ\s*\d+|[A-ZƏIŞÇÖÜĞ])/u', $s);
                if (!$goodStart) {
                    continue;
                }

                $sN = $this->normalizeAz(mb_strtolower($s, 'UTF-8'));
                $match = false;
                foreach ($keywordsN as $kw) {
                    if ($kw !== '' && mb_stripos($sN, $kw, 0, 'UTF-8') !== false) { $match = true; break; }
                }
                if ($match) {
                    // Check length limit, keep boundary intact
                    $currentLen = mb_strlen(implode("\n", $collected), 'UTF-8');
                    if ($currentLen + mb_strlen($s, 'UTF-8') > $maxChars) {
                        // Try to include a trimmed version to sentence boundary if possible
                        $remain = max(0, $maxChars - $currentLen - 1);
                        if ($remain > 200) { // avoid tiny fragments
                            $sTrim = $this->smartTrimToSentence($s, $remain);
                            if ($sTrim !== '') {
                                $collected[] = $sTrim;
                            }
                        }
                        break 2; // stop collecting
                    }
                    $collected[] = $s;
                    $used[$s] = true;
                }
            }
        }

        // Fallback: if nothing matched, include first 1-2 chunks trimmed to sentence boundary
        if (empty($collected)) {
            foreach ($similarChunks as $i => $sc) {
                $cid = $sc['metadata']['chunk_id'] ?? null;
                if (!$cid) continue;
                $chunk = $chunks->get($cid);
                if (!$chunk || empty($chunk->content)) continue;
                $full = $this->completeWithNextChunkEnd($chunk, 800);
                $snippet = $this->smartTrimToSentence($full, min(1200, $maxChars));
                if ($snippet !== '') $collected[] = $snippet;
                if (mb_strlen(implode("\n\n", $collected), 'UTF-8') >= $maxChars || count($collected) >= 2) break;
            }
        }

        return trim(implode("\n\n", $collected));
    }

    private function rewriteFromExtract(string $extract, string $question): string
    {
        $noDataMessage = (string) $this->getSetting('ai_no_data_message', 'Bağışlayın, bu mövzu haqqında məlumat bazamda dəqiq məlumat tapılmadı.');
        if (trim($extract) === '') return '';
        $prompt = <<<PROMPT
***XƏBƏRDARLIQ: BU QAYDALAR MÜTLƏQDİR - POZULMASI QADAĞANDIR!***

Sən YALNIZ aşağıda verilmiş MƏNBƏ MƏTN-dən köçürmə edərək cavab verən sistemsən.

🚫 KƏSKİN QADAĞALAR:
1. ÖZ BİLİYİNDƏN, TƏLİMATINDAN, İNTERNETDƏN HEÇ NƏ ƏLAVƏ ETMƏ!
2. Mənbə mətnində OLMAYAN addımlar, qaydalar, nümunələr ƏLAVƏ ETMƏ!
3. "Niyyət etmək", "Bismillah demək", "Əlləri əvvəlcədən yumaq" kimi MƏNBƏDƏ AÇIQCA YAZILMAYAN addımlar ƏLAVƏ ETMƏ!
4. YALNIZ mənbə mətnində aynen yazılan məlumatları istifadə et.
5. Əgər mənbədə olmayan bir şey lazımdırsa, onu ƏLAVƏ ETMƏ - yalnız olanı yaz!

✅ YEGANƏİCAZƏ VERİLƏN ŞEY:
- Mənbə mətnindəki məlumatı oxunuşlu nömrələnmiş siyahı şəklində təşkil et
- Hər nömrə YALNIZ mənbədəki faktları ehtiva etməlidir
- Heç bir əlavə məlumat, heç bir yeni addım ƏLAVƏ ETMƏ

════════════════════════════════════════
MƏNBƏ MƏTN (YALNIZ BUNDAN İSTİFADƏ ET):
{$extract}
════════════════════════════════════════

İstifadəçi sualı: "{$question}"

📝 CAVAB (yalnız mənbədən, nömrələnmiş, heç bir əlavə YOX):
1.
PROMPT;
        $params = [
            'temperature' => 0.05,  // CRITICAL: Very low temperature to prevent adding own knowledge
            'max_tokens' => 1200,
            'frequency_penalty' => 0.3,  // Higher to prevent repetition
            'presence_penalty' => 0.0,   // Zero to allow staying within source text
        ];
        return $this->chatProvider->generateResponse($prompt, $params);
    }

    private function extractKeywordsSimple(string $q): array
    {
        $q = mb_strtolower(trim($q), 'UTF-8');
        // simple tokens length >= 3
        preg_match_all('/\p{L}{3,}/u', $q, $m);
        $tokens = $m[0] ?? [];
        // minimal stopwords
        $stop = ['və','ve','ile','ilə','üçün','the','and','or','for','with'];
        $tokens = array_values(array_filter($tokens, function($t) use ($stop){ return !in_array($t, $stop, true); }));

        // normalize tokens to base forms (strip common Azerbaijani suffixes)
        $suffixes = ['ın','in','un','ün','nın','nin','nun','nün','ı','i','u','ü','a','ə','da','də','dan','dən'];
        $normalized = [];
        foreach ($tokens as $t) {
            $normalized[] = $t;
            foreach ($suffixes as $suf) {
                if (mb_strlen($t, 'UTF-8') > mb_strlen($suf, 'UTF-8') + 2 && mb_substr($t, -mb_strlen($suf, 'UTF-8'), null, 'UTF-8') === $suf) {
                    $base = mb_substr($t, 0, -mb_strlen($suf, 'UTF-8'), 'UTF-8');
                    if (mb_strlen($base, 'UTF-8') >= 3) { $normalized[] = $base; }
                }
            }
        }

        // include common transliterations and domain synonyms
        $map = [
            'vitr' => ['vitr','witir','witr'],
            'rükət' => ['rükət','rukət','ruket','rakat','raket'],
            'namaz' => ['namaz','salat','salah'],
            'qunut' => ['qunut','qunut duası','dua','namazda qunut'],
            'dəstəmaz' => ['dəstəmaz','destemaz','destamaz','abdest','wudu','wudhu','vuzu','təharət','teharet'],
            'abdest' => ['abdest','dəstəmaz','destemaz','wudu','vuzu','təharət'],
        ];
        $out = [];
        foreach ($normalized as $t) {
            $out[] = $t;
            foreach ($map as $k => $vars) {
                if ($t === $k && is_array($vars)) { $out = array_merge($out, $vars); }
            }
        }
        // unique, keep first N
        $seen = [];
        $uniq = [];
        foreach ($out as $t) { if ($t !== '' && !isset($seen[$t])) { $seen[$t] = true; $uniq[] = $t; } }
        return array_slice($uniq, 0, 12);
    }

    /**
     * Streaming query support
     */
    public function queryStreaming(string $question, callable $callback, array $options = []): array
    {
        try {
            // Generate embedding and retrieve context (same as non-streaming)
            $questionVector = $this->embeddingProvider->generateEmbedding($question);
            $topK = (int)$this->getSetting('rag_top_k', 5);
            $similarChunks = $this->vectorStore->query($questionVector, $topK);

            if (empty($similarChunks)) {
                $callback('Bağışlayın, bu mövzu haqqında məlumat bazamda dəqiq məlumat tapılmadı.');
                return $this->noDataResponse($question);
            }

            // Build context
            $chunkIds = array_map(fn($c) => $c['metadata']['chunk_id'], $similarChunks);
            $chunks = KnowledgeBaseChunk::with('knowledgeBase')
                ->whereIn('id', $chunkIds)
                ->get()
                ->keyBy('id');

            $contextParts = [];
            $sources = [];

            foreach ($similarChunks as $similarChunk) {
                $chunkId = $similarChunk['metadata']['chunk_id'];
                $chunk = $chunks->get($chunkId);

                if ($chunk) {
                    $contextParts[] = $chunk->content;
                    $sourceKey = $chunk->knowledge_base_id;
                    if (!isset($sources[$sourceKey])) {
                        $sources[$sourceKey] = [
                            'id' => $chunk->knowledge_base_id,
                            'title' => $chunk->knowledgeBase->title ?? 'Unknown',
                            'source_url' => $chunk->knowledgeBase->source_url ?? null,
                            'category' => $chunk->knowledgeBase->category ?? null,
                            'relevance_score' => $similarChunk['score']
                        ];
                    }
                }
            }

            $context = implode("\n\n---\n\n", $contextParts);
            $prompt = $this->buildStrictRAGPrompt($question, $context);

            // Stream the response
            $this->chatProvider->generateStreamingResponse($prompt, $callback, [
                'temperature' => 0.3,
                'max_tokens' => 2000
            ]);

            return [
                'sources' => array_values($sources),
                'metadata' => [
                    'chunks_used' => count($contextParts),
                    'context_length' => mb_strlen($context),
                ]
            ];

        } catch (\Exception $e) {
            Log::error('❌ RAG STREAMING QUERY FAILED', [
                'question' => $question,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}

