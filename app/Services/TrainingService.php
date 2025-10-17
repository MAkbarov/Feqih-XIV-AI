<?php

namespace App\Services;

use App\Models\KnowledgeBase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;
use DOMDocument;
use DOMXPath;

/**
 * Advanced Training Service - Train nümunələrinə əsasən
 * Bu xidmət URL-lərdən məzmunu mükəmməl şəkildə əldə edir və əzbərləyir
 */

class TrainingService
{
    protected EmbeddingService $embedding;
    protected ?AiService $aiService = null;

    public function __construct(EmbeddingService $embedding, ?AiService $aiService = null)
    {
        $this->embedding = $embedding;
        $this->aiService = $aiService;
    }
    /**
     * URL-dən məzmunu train et və bilik bazasına əlavə et
     */
    public function trainFromUrl(string $url, array $options = [], ?callable $progress = null): array
    {
        try {
    
            // URL-ə single page ya çoxlu səhifə training
            $single = $options['single'] ?? true;
            $maxDepth = $single ? 1 : ($options['max_depth'] ?? 3);
            
            $results = [];
            
            if ($single) {
                // Tək səhifə training
                $result = $this->trainSinglePage($url, $options);
                if ($result) {
                    $results[] = $result;
                    if ($progress) { $progress(100); }
                }
            } else {
                // Çoxlu səhifə training (saytı tamamilə əzbərlə)
                $results = $this->trainMultiplePages($url, $maxDepth, $options, $progress);
            }
            
            Log::info('✅ Advanced Training tamamlandı', [
                'url' => $url,
                'trained_pages' => count($results)
            ]);
            
            $count = count($results);
            return [
                'success' => $count > 0,
                'trained_pages' => $count,
                'results' => $results
            ];
            
        } catch (Exception $e) {
            Log::error('❌ Training xətası', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Tək səhifə training
     */
    protected function trainSinglePage(string $url, array $options = []): ?KnowledgeBase
    {
        try {
            // 1. URL-dən məzmunu əldə et
            $rawContent = $this->fetchContent($url);
            if (!$rawContent) {
                throw new Exception('URL-dən məzmun əldə edilə bilmədi');
            }
            
            // 2. Məzmunu analiz et və təmizlə
            $processedData = $this->processContent($rawContent, $url);

            // 2.5. Səviyyəyə əsasən xülasə - TƏK URL ÜÇÜN HƏMIŞƏ FULL PAGE
            $level = (int)($options['level'] ?? 5);
            $isSingleMode = $options['single'] ?? true;
            $originalLength = strlen($processedData['content']);
            
            // Tək URL üçün həmişə full page (level 5), multi-page üçün seçilən level
            if (!$isSingleMode && $level < 5) {
                $processedData['content'] = $this->summarizeByLevel($processedData['content'], $level);
                Log::info('Səviyyəyə görə xülasələşdirildi (multi-page)', [
                    'url' => $url,
                    'level' => $level,
                    'original_length' => $originalLength,
                    'summarized_length' => strlen($processedData['content']),
                    'reduction_percent' => round((1 - strlen($processedData['content']) / $originalLength) * 100)
                ]);
            } else {
                Log::info('Tam məzmun saxlanıldı', [
                    'url' => $url,
                    'mode' => $isSingleMode ? 'single_page' : 'multi_page_level_5',
                    'content_length' => $originalLength
                ]);
            }
            
            // 3. Minimum məzmun yoxla - ARTİRILDI
            if (strlen($processedData['content']) < 150) {
                Log::warning('⚠️ Məzmun çox qısadır', [
                    'url' => $url,
                    'content_length' => strlen($processedData['content']),
                    'content_preview' => mb_substr($processedData['content'], 0, 200)
                ]);
                throw new Exception('Məzmun çox qısadır ('.strlen($processedData['content']).' hərf), əzbərləmək üçün minimum 150 hərf lazımdır');
            }

            // 3.1. Maksimum məzmun uzunluğu - memory təhlükəsizliyi
            $maxLen = 500000; // 500k
            if (mb_strlen($processedData['content']) > $maxLen) {
                $processedData['content'] = mb_substr($processedData['content'], 0, $maxLen);
                Log::info('Content truncated (legacy service)', ['len' => $maxLen]);
            }
            
            // 4. Mövcud məzmunu yoxla (dublikat qarşısını al)
            $existing = KnowledgeBase::where('source_url', $url)->first();
            
            // Dublikat məntiqi:
            // - Tək səhifə → Tək səhifə: Qadagan (artiq var)
            // - Tək səhifə → Bütün sayt: Icazə (yeniləsin)
            // - Bütün sayt → Tək səhifə: Icazə (yeniləsin)
            // - Bütün sayt → Bütün sayt: Icazə (yeniləsin)
            
            $isSinglePageMode = $options['single'] ?? true;
            
            if ($existing) {
                // Check if previous was also single page mode
                $wasSinglePage = !isset($existing->metadata['training_mode']) || $existing->metadata['training_mode'] === 'single';
                
                // Block only if: was single AND current is also single
                if ($wasSinglePage && $isSinglePageMode) {
                    Log::warning('⚠️ Tək səhifə artıq əzbərlənib - dublikat qadagandır', ['url' => $url]);
                    throw new Exception('Bu URL artıq tək səhifə olaraq əzbərlənib. Bütün sayt rejimini seçmək istəyirsinizsə, "Bütün sayt" seçimi ilə yeniləyin.');
                }
                
                // Update in all other cases
                Log::info('📝 Mövcud məzmun yenilənir', [
                    'url' => $url,
                    'was_single' => $wasSinglePage,
                    'is_single' => $isSinglePageMode
                ]);
                return $this->updateKnowledge($existing, $processedData, $options);
            } else {
                Log::info('🆕 Yeni məzmun əlavə edilir', ['url' => $url]);
                return $this->createKnowledge($processedData, $url, $options);
            }
            
        } catch (Exception $e) {
            Log::error('Single page training xətası', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    /**
     * Çoxlu səhifə training (dərin crawling)
     */
    protected function trainMultiplePages(string $baseUrl, int $maxDepth, array $options = [], ?callable $progress = null): array
    {
        $results = [];
        $processed = [];
        $queue = [['url' => $baseUrl, 'depth' => 0]];
        $maxPages = $options['max_pages'] ?? 2000; // Artırıldı
        $discovered = 1;
        
        // Scope restriction: only crawl within the provided scope URL path
        $scopeUrl = $options['scope_url'] ?? $baseUrl;
        $scopeParts = parse_url($scopeUrl);
        $scopeScheme = $scopeParts['scheme'] ?? '';
        $scopeHost = $scopeParts['host'] ?? '';
        $scopePath = rtrim($scopeParts['path'] ?? '/', '/');
        
        $shouldStop = $options['shouldStop'] ?? null;
        
        Log::info('🌐 Çoxlu səhifə training başlanır', [
            'base_url' => $baseUrl,
            'max_depth' => $maxDepth,
            'max_pages' => $maxPages,
            'scope_host' => $scopeHost,
            'scope_path' => $scopePath
        ]);
        
        while (!empty($queue) && count($results) < $maxPages) {
            $current = array_shift($queue);
            $url = $current['url'];
            $depth = $current['depth'];
            
            // Artıq işlənmişləri keç
            if (in_array($url, $processed)) {
                continue;
            }
            
            $processed[] = $url;
            
            try {
                // Stop requested? - Hər addimda yoxla
                if (is_callable($shouldStop) && $shouldStop()) {
                    Log::info('⏹️ Training user tərəfindən dayandırıldı', ['processed_count' => count($processed)]);
                    // Progress 100% et ki frontend anlasın
                    if ($progress) { $progress(100); }
                    break;
                }
                
                Log::info('📖 Səhifə training edilir', [
                    'url' => $url,
                    'depth' => $depth,
                    'processed_count' => count($processed),
                    'results_count' => count($results)
                ]);
                
                // Bu səhifəni train et - MÖHKƏMməli FULL SITE modunda
                $pageOptions = array_merge($options, [
                    'single' => false,  // ƏSAS DÜZƏLİŞ: Bu full site training-dir!
                    'is_multi_page_context' => true, // Əlavə flag
                    'parent_training_mode' => 'full_site',
                    'shouldStop' => $shouldStop // Stop callback-ni ötür
                ]);
                
                // Progress - Başlamağdan əvvəl
                if ($progress) {
                    $processedCount = count($processed);
                    $totalDiscovered = max($discovered, $processedCount + count($queue));
                    $beforePercent = (int) floor(($processedCount / max($totalDiscovered, 1)) * 100);
                    $progress(min(95, max(1, $beforePercent))); // Max 95% təyin et
                }
                
                $result = $this->trainSinglePageForMultiSite($url, $pageOptions);
                if ($result) {
                    $results[] = $result;
                    Log::info('✅ Səhifə uğurla əlavə edildi', [
                        'url' => $url, 
                        'title' => $result->title,
                        'content_length' => strlen($result->content),
                        'total_results_so_far' => count($results)
                    ]);
                } else {
                    Log::warning('⚠️ Səhifə əlavə edilə bilmədi', [
                        'url' => $url,
                        'processed_count' => count($processed),
                        'results_count' => count($results),
                        'queue_size' => count($queue)
                    ]);
                }
                
                // Progress - Tamamlandıqdan sonra
                if ($progress) {
                    $processedCount = count($processed);
                    $successCount = count($results);
                    $totalDiscovered = max($discovered, $processedCount + count($queue));
                    $percent = (int) floor(($processedCount / max($totalDiscovered, 1)) * 100);
                    $percent = min(95, max(2, $percent));
                    $progress($percent);
                    
                    Log::info('📈 Progress update', [
                        'processed' => $processedCount,
                        'results' => $successCount,
                        'queue_size' => count($queue),
                        'total_discovered' => $totalDiscovered,
                        'percent' => $percent
                    ]);
                }
                
                // 🎆 DƏRİNLİK MƏHDUDİYYƏTİ ARADAN GÖTÜRÜLDÜ - URL daxilində bütün linkləri tap
                // Depth yox, yalnız scope əsasinda qarşısını al
                $links = $this->extractLinks($url, $baseUrl);
                Log::info('🔗 Linklər tapıldı', [
                    'url' => $url, 
                    'links_count' => count($links),
                    'current_depth' => $depth,
                    'max_depth_allowed' => $maxDepth,
                    'sample_links' => array_slice($links, 0, 5)
                ]);
                
                // 🔥 YENİ: Dərinlik məhdudiyyəti - maxDepth çatdıqda linkləri queue-ya əlavə etmə
                // Məsələn maxDepth=2 olsə:
                //   depth=0 (base URL) → linklərini tap, queue-ya əlavə et
                //   depth=1 (1-ci səviyyə) → linklərini tap, queue-ya əlavə et
                //   depth=2 (2-ci səviyyə) → linklərini TAPMA (məzmunu oxu, amma daha dərinyə getmə)
                
                $shouldCrawlDeeper = ($depth < $maxDepth);
                
                if (!$shouldCrawlDeeper) {
                    Log::info('⛔ Dərinlik limitinə çatıldı - bu səhifədəki linklər queue-ya əlavə edilməyəcək', [
                        'url' => $url,
                        'current_depth' => $depth,
                        'max_depth' => $maxDepth,
                        'action' => 'Məzmun oxundu, amma dərinyə getmədi'
                    ]);
                    continue; // Linkləri queue-ya əlavə etmə, növbəti URL-ə keç
                }
                
                // Filter links to stay within scope - TəKCƏ URL SCOPE
                $filtered = [];
                $rejected = [];
                
                // Sibling mode options-dan al
                $scopeOptions = [
                    'crawl_sibling' => $options['crawl_sibling'] ?? false
                ];
                
                foreach ($links as $link) {
                    if ($this->isLinkInScopeForFullSite($link, $scopeScheme, $scopeHost, $scopePath, $scopeOptions) && !in_array($link, $processed)) {
                        $filtered[] = $link;
                    } else {
                        $rejected[] = $link;
                    }
                }
                
                Log::info('🔄 Link filtering nəticələri', [
                    'total_links' => count($links),
                    'filtered_count' => count($filtered),
                    'rejected_count' => count($rejected),
                    'current_depth' => $depth,
                    'will_add_to_queue' => $shouldCrawlDeeper,
                    'scope_explanation' => "Yalnız '{$scopePath}' daxilində olan linklər qəbul edilir",
                    'sample_filtered' => array_slice($filtered, 0, 3),
                    'sample_rejected' => array_slice($rejected, 0, 3)
                ]);
                
                // Queue-ya əlavə et (dərinlik limitindən aşağıdaysa)
                foreach ($filtered as $link) {
                    $queue[] = ['url' => $link, 'depth' => $depth + 1];
                    $discovered++;
                    Log::debug('➕ Queue-ya əlavə edildi', [
                        'link' => $link,
                        'new_depth' => $depth + 1,
                        'max_depth' => $maxDepth
                    ]);
                }
                
                // Server-ə hörmət et
                usleep(500000); // 0.5 saniyə gözlə
                
            } catch (Exception $e) {
                Log::warning('Səhifə training xətası', [
                    'url' => $url,
                    'error' => $e->getMessage(),
                    'depth' => $depth
                ]);
                continue;
            }
        }
        
        if ($progress) { $progress(100); }
        
        Log::info('🎯 Çoxlu səhifə training tamamlandı', [
            'total_results' => count($results),
            'processed_urls' => count($processed)
        ]);
        
        return $results;
    }
    
    /**
     * Check if link is within the allowed scope
     */
    protected function isLinkInScope(string $link, string $scopeScheme, string $scopeHost, string $scopePath): bool
    {
        $parts = parse_url($link);
        if (!$parts) return false;
        
        $scheme = $parts['scheme'] ?? '';
        $host = $parts['host'] ?? '';
        $path = $parts['path'] ?? '/';
        $path = rtrim($path, '/');
        
        // Same host only
        if (strcasecmp($host, $scopeHost) !== 0) return false;
        
        // Same scheme if provided
        if ($scopeScheme && strcasecmp($scheme, $scopeScheme) !== 0) return false;
        
        // Only allow paths within the base scope path
        if ($scopePath === '' || $scopePath === '/') return true; // base root
        if (strpos($path . '/', $scopePath . '/') !== 0) return false; // must start with scopePath
        
        return true;
    }
    
    /**
     * Full site üçün SCOPE-A UYĞUN link scope - yalnız verilən URL path daxilində
     * 🔥 YENİLƏNMİŞ: Dil path-ini mühafizə edir, strikt scope və dərinlik kontrol
     * 🎯 UPDATED: Sibling mode dəstəyi - eyni səviyyədəki URL-ləri tapa bilir
     * 
     * @param array $options - 'crawl_sibling' => true olsa sibling URL-lər də qebul edilir
     */
    protected function isLinkInScopeForFullSite(string $link, string $scopeScheme, string $scopeHost, string $scopePath, array $options = []): bool
    {
        // 🔍 DEBUG LOG - Hostingdə problemi tapmaq üçün
        Log::info('🔍 DEBUG: isLinkInScopeForFullSite çağırıldı', [
            'link' => $link,
            'scopeHost' => $scopeHost,
            'scopePath' => $scopePath,
            'options' => $options,
            'php_version' => PHP_VERSION,
            'server' => $_SERVER['SERVER_NAME'] ?? 'unknown'
        ]);
        
        $parts = parse_url($link);
        if (!$parts) return false;
        
        $scheme = $parts['scheme'] ?? '';
        $host = $parts['host'] ?? '';
        $path = $parts['path'] ?? '/';
        $path = rtrim($path, '/');
        
        // Same host only (əsas məhdudiyyət)
        if (strcasecmp($host, $scopeHost) !== 0) {
            Log::debug('❌ Rədd: Farklı host', ['link_host' => $host, 'scope_host' => $scopeHost]);
            return false;
        }
        
        // Same scheme if provided
        if ($scopeScheme && strcasecmp($scheme, $scopeScheme) !== 0) {
            Log::debug('❌ Rədd: Farklı scheme', ['link_scheme' => $scheme, 'scope_scheme' => $scopeScheme]);
            return false;
        }
        
        // 🎯 STRİKT SCOPE MƏHDUDİYYƏTİ - DİL PATH-İNİ MÜHAFİZƏ EDİR
        // Məsələn: /azari/book/123 verilibsə:
        //   ✓ Qebul: /azari/book/123, /azari/book/123/ch1, /azari/book/456
        //   ✗ Rədd: /arabic/..., /english/..., /azari (yəni parent)
        
        if ($scopePath && $scopePath !== '' && $scopePath !== '/') {
            $normalizedScopePath = rtrim($scopePath, '/');
            $normalizedLinkPath = rtrim($path, '/');
            
            // Path segment analizi - dil path-ini tap
            $scopeSegments = array_filter(explode('/', $normalizedScopePath));
            $linkSegments = array_filter(explode('/', $normalizedLinkPath));
            
            // 🔥 YENİ: İlk path segment-i yoxla (dil kökü)
            // Əgər scope /azari/... isə, link də /azari/ ilə başlamalıdır
            if (count($scopeSegments) > 0 && count($linkSegments) > 0) {
                // array_values() ilə index sıfırdan başladığını təmin edirik
                $scopeSegmentsIndexed = array_values($scopeSegments);
                $linkSegmentsIndexed = array_values($linkSegments);
                
                $scopeRoot = $scopeSegmentsIndexed[0]; // Məs: 'azari', 'english', 'arabic'
                $linkRoot = $linkSegmentsIndexed[0] ?? '';
                
                // Dil kökü yoxlaması
                if ($scopeRoot !== $linkRoot) {
                    Log::info('🚫 Rədd: Dil path uyğun gelmez', [
                        'link' => $link,
                        'link_root' => $linkRoot,
                        'scope_root' => $scopeRoot,
                        'reason' => 'Dil path fərqlidir'
                    ]);
                    return false;
                }
            }
            
            // 🎯 SCOPE MƏNTİQİ: 3 rejim
            // 1. Strikt (child only): Yalnız alt path-lar (/book/123/chapter)
            // 2. Sibling: Eyni səviyyədəki URL-lər də (/book/123, /book/124, /book/125)
            // 3. Wide: Bütövlüklə eyni parent daxilində (/book/*)
            
            $isExactMatch = ($normalizedLinkPath === $normalizedScopePath);
            $isDirectChild = strpos($normalizedLinkPath . '/', $normalizedScopePath . '/') === 0;
            
            // 🔥 YENİ: SİBLİNG MODE - eyni səviyyədəki URL-ləri qəbul et
            // Məs: /book/25262/ scope-u üçün /book/25263/, /book/25264/ də qebul
            $crawlSibling = $options['crawl_sibling'] ?? false;
            $isSibling = false;
            
            if ($crawlSibling && count($scopeSegments) >= 2 && count($linkSegments) >= 2) {
                // array_values() ilə index sıfırdan başladığını təmin edirik
                $scopeSegmentsIndexed = array_values($scopeSegments);
                $linkSegmentsIndexed = array_values($linkSegments);
                
                // Eyni parent yoxla (/azari/book/)
                $scopeParentSegments = array_slice($scopeSegmentsIndexed, 0, -1); // Son elementi çıxart
                $linkParentSegments = array_slice($linkSegmentsIndexed, 0, -1);
                
                $scopeLastSegment = end($scopeSegmentsIndexed);
                $linkLastSegment = end($linkSegmentsIndexed);
                
                // Parent eynidir və son segment fərqlidir
                if ($scopeParentSegments === $linkParentSegments && $scopeLastSegment !== $linkLastSegment) {
                    $isSibling = true;
                    Log::info('✅ Sibling URL qəbul edildi', [
                        'link' => $link,
                        'scope_path' => $normalizedScopePath,
                        'link_path' => $normalizedLinkPath,
                        'parent_segments' => implode('/', $scopeParentSegments),
                        'scope_last' => $scopeLastSegment,
                        'link_last' => $linkLastSegment,
                        'reason' => 'Eyni parent, fərqli səviyyə (sibling mode aktiv)'
                    ]);
                }
            }
            
            // Final qebul qerarı
            $isAccepted = $isExactMatch || $isDirectChild || $isSibling;
            
            if (!$isAccepted) {
                Log::info('🚫 Rədd: Scope daxilində deyil', [
                    'link' => $link,
                    'link_path' => $normalizedLinkPath,
                    'scope_path' => $normalizedScopePath,
                    'is_exact' => $isExactMatch,
                    'is_child' => $isDirectChild,
                    'reason' => 'Link scope path-inin altında deyil'
                ]);
                return false;
            }
        }
        
        // İstənilməyən fayl tipləri
        $unwantedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.exe', '.mp3', '.mp4', '.avi', '.jpg', '.jpeg', '.png', '.gif', '.css', '.js', '.json', '.xml', '.svg', '.ico', '.woff', '.ttf'];
        foreach ($unwantedExtensions as $ext) {
            if (substr(strtolower($path), -strlen($ext)) === $ext) {
                Log::debug('❌ Rədd: İstənilməyən fayl tipi', ['path' => $path, 'ext' => $ext]);
                return false;
            }
        }
        
        // İstənilməyən path-lar
        $unwantedPaths = ['/admin', '/wp-admin', '/wp-content', '/assets', '/static', '/images', '/img', '/js', '/css', '/fonts', '/media', '/uploads', '/download', '/api', '/ajax'];
        foreach ($unwantedPaths as $unwanted) {
            if (strpos(strtolower($path), strtolower($unwanted)) !== false) {
                Log::debug('❌ Rədd: İstənilməyən path', ['path' => $path, 'unwanted' => $unwanted]);
                return false;
            }
        }
        
        Log::info('✅ Qebul: Link scope daxilindədir', [
            'link' => $link,
            'link_path' => $path,
            'scope_path' => $scopePath
        ]);
        
        return true;
    }
    
    /**
     * Çoxlu səhifə training üçün xüsusi single page handler
     */
    protected function trainSinglePageForMultiSite(string $url, array $options = []): ?KnowledgeBase
    {
        try {
            // Stop check - ilk öncə yoxla
            $shouldStop = $options['shouldStop'] ?? null;
            if (is_callable($shouldStop) && $shouldStop()) {
                Log::info('⏹️ Stop request - səhifə training atlanıldı', ['url' => $url]);
                return null;
            }
            
            Log::info('🔄 Multi-site context-də səhifə training', [
                'url' => $url,
                'is_multi_page_context' => $options['is_multi_page_context'] ?? false
            ]);
            
            // 1. URL-dən məzmunu əldə et
            $rawContent = $this->fetchContent($url);
            if (!$rawContent) {
                Log::error('❌ URL-dən məzmun əldə edilə bilmədi - səhifə atlanır', [
                    'url' => $url,
                    'curl_available' => function_exists('curl_init'),
                    'file_get_contents_available' => ini_get('allow_url_fopen'),
                    'guzzle_available' => class_exists('GuzzleHttp\\Client')
                ]);
                return null;
            }
            
            Log::info('✅ URL-dən məzmun əldə edildi', [
                'url' => $url,
                'content_size' => strlen($rawContent),
                'content_preview' => mb_substr(strip_tags($rawContent), 0, 150)
            ]);
            
            // 2. Məzmunu analiz et və təmizlə
            $processedData = $this->processContent($rawContent, $url);

            // 2.5. Multi-page training üçün səviyyəyə əsasən xülasə
            $level = (int)($options['level'] ?? 5);
            $originalLength = strlen($processedData['content']);
            
            // Multi-page training-də seçilən level-ə görə xülasələşdir
            if ($level < 5) {
                $processedData['content'] = $this->summarizeByLevel($processedData['content'], $level);
                Log::info('Multi-site: Səviyyəyə görə xülasələşdirildi', [
                    'url' => $url,
                    'level' => $level,
                    'original_length' => $originalLength,
                    'summarized_length' => strlen($processedData['content']),
                    'reduction_percent' => round((1 - strlen($processedData['content']) / $originalLength) * 100)
                ]);
            } else {
                Log::info('Multi-site: Tam məzmun saxlanıldı', [
                    'url' => $url,
                    'level' => $level,
                    'content_length' => $originalLength
                ]);
            }
            
            // 3. Minimum məzmun yoxla - ARTİRILDI
            if (strlen($processedData['content']) < 200) { // Multi-site üçün daha yüksək minimum
                Log::warning('⚠️ Məzmun çox qısadır - səhifə atlanır', [
                    'url' => $url, 
                    'content_length' => strlen($processedData['content']),
                    'content_preview' => mb_substr($processedData['content'], 0, 200),
                    'title' => $processedData['title'] ?? 'N/A',
                    'minimum_required' => 200
                ]);
                return null;
            }
            
            // 4. Full site training üçün FƏRQLI dublikat məntiq
            $existing = KnowledgeBase::where('source_url', $url)->first();
            
            if ($existing) {
                // Full site training zamanı mövcud səhifələri yenilə
                Log::info('🔄 Full site: mövcud məzmun yenilənir', ['url' => $url]);
                return $this->updateKnowledgeForFullSite($existing, $processedData, $options);
            } else {
                // Yeni məzmun əlavə et
                Log::info('🆕 Full site: yeni məzmun əlavə edilir', ['url' => $url]);
                return $this->createKnowledgeForFullSite($processedData, $url, $options);
            }
            
        } catch (Exception $e) {
            Log::error('❌ Multi-site single page training xətası', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * URL-dən məzmunu güclü metodlarla əldə et
     */
    protected function fetchContent(string $url): ?string
    {
        // 1. cURL ilə cəhd et (ən güclü)
        if (function_exists('curl_init')) {
            $content = $this->fetchWithCurl($url);
            if ($content) return $content;
        }
        
        // 2. file_get_contents ilə cəhd et
        $content = $this->fetchWithFileGetContents($url);
        if ($content) return $content;
        
        // 3. Guzzle ilə cəhd et (əgər mövcuddursa)
        if (class_exists('GuzzleHttp\Client')) {
            $content = $this->fetchWithGuzzle($url);
            if ($content) return $content;
        }
        
        return null;
    }
    
    /**
     * cURL ilə məzmun əldə et
     */
    protected function fetchWithCurl(string $url): ?string
    {
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_TIMEOUT => 120, // Çox artırıldı hosting üçün
                CURLOPT_CONNECTTIMEOUT => 60, // Çox artırıldı
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_ENCODING => '', // Avtomatik gzip/deflate dekoding
                CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; XIV-AI-Bot/1.0; +https://example.com/bot)',
                CURLOPT_HTTPHEADER => [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language: az,tr,en-US,en;q=0.5',
                    'Accept-Encoding: gzip, deflate, br',
                    'DNT: 1',
                    'Connection: keep-alive',
                    'Upgrade-Insecure-Requests: 1',
                    'Cache-Control: no-cache'
                ],
                // Hosting üçün əlavə seçimlər
                CURLOPT_FRESH_CONNECT => true,
                CURLOPT_FORBID_REUSE => false,
                CURLOPT_VERBOSE => false
            ]);
            
            $content = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);
            
            if ($content && $httpCode >= 200 && $httpCode < 400 && empty($error)) {
                // Header charset varsa, test-konvert et və AZ skoruna görə ən yaxşısını seç
                if (!empty($contentType) && preg_match('/charset=([\w\-]+)/i', (string)$contentType, $m)) {
                    $respCharset = strtoupper(trim($m[1]));
                    if ($respCharset && $respCharset !== 'UTF-8') {
                        $converted = @mb_convert_encoding($content, 'UTF-8', $respCharset);
                        if ($converted) {
                            $content = $this->chooseBestByAzerbaijaniScore($content, $converted);
                        }
                    }
                }
                Log::info('✅ cURL ilə məzmun əldə edildi', [
                    'url' => $url,
                    'http_code' => $httpCode,
                    'content_type' => $contentType,
                    'content_length' => strlen($content),
                    'content_preview' => substr(strip_tags($content), 0, 200)
                ]);
                return $content;
            }
            
            Log::warning('⚠️ cURL xətası', [
                'url' => $url,
                'http_code' => $httpCode,
                'error' => $error,
                'curl_info' => [
                    'total_time' => curl_getinfo($ch, CURLINFO_TOTAL_TIME),
                    'connect_time' => curl_getinfo($ch, CURLINFO_CONNECT_TIME),
                    'effective_url' => curl_getinfo($ch, CURLINFO_EFFECTIVE_URL)
                ]
            ]);
            
        } catch (Exception $e) {
            Log::warning('cURL exception', ['url' => $url, 'error' => $e->getMessage()]);
        }
        
        return null;
    }
    
    /**
     * file_get_contents ilə məzmun əldə et
     */
    protected function fetchWithFileGetContents(string $url): ?string
    {
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => implode("\r\n", [
                        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language: az,en-US,en;q=0.5',
                        'Connection: close'
                    ]),
                'timeout' => 120, // Hosting üçün artırıldı
                'ignore_errors' => true
                ]
            ]);
            
            $content = file_get_contents($url, false, $context);
            
            if ($content) {
                // Header-lardan Content-Type/charset tap və konvertasiya et (AZ skoruna görə ən yaxşı variantı seç)
                $ct = '';
                if (isset($http_response_header) && is_array($http_response_header)) {
                    foreach ($http_response_header as $hdr) {
                        if (stripos($hdr, 'Content-Type:') === 0) { $ct = $hdr; break; }
                    }
                }
                if (!empty($ct) && preg_match('/charset=([\w\-]+)/i', $ct, $m)) {
                    $respCharset = strtoupper(trim($m[1]));
                    if ($respCharset && $respCharset !== 'UTF-8') {
                        $converted = @mb_convert_encoding($content, 'UTF-8', $respCharset);
                        if ($converted) { $content = $this->chooseBestByAzerbaijaniScore($content, $converted); }
                    }
                }
                
                Log::info('✅ file_get_contents ilə məzmun əldə edildi', [
                    'url' => $url,
                    'content_length' => strlen($content)
                ]);
                return $content;
            }
            
        } catch (Exception $e) {
            Log::warning('file_get_contents exception', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
        }
        
        return null;
    }
    
    /**
     * Guzzle ilə məzmun əldə et
     */
    protected function fetchWithGuzzle(string $url): ?string
    {
        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => 30,
                'connect_timeout' => 10,
                'verify' => false
            ]);
            
            $response = $client->get($url, [
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ]
            ]);
            
            if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 400) {
                $content = $response->getBody()->getContents();
                $ct = $response->getHeaderLine('Content-Type');
                if (!empty($ct) && preg_match('/charset=([\w\-]+)/i', $ct, $m)) {
                    $respCharset = strtoupper(trim($m[1]));
                    if ($respCharset && $respCharset !== 'UTF-8') {
                        $converted = @mb_convert_encoding($content, 'UTF-8', $respCharset);
                        if ($converted) {
                            $content = $this->chooseBestByAzerbaijaniScore($content, $converted);
                        }
                    }
                }
                Log::info('✅ Guzzle ilə məzmun əldə edildi', [
                    'url' => $url,
                    'status' => $response->getStatusCode(),
                    'content_length' => strlen($content)
                ]);
                return $content;
            }
            
        } catch (Exception $e) {
            Log::warning('Guzzle exception', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
        }
        
        return null;
    }
    
    /**
     * Məzmunu analiz et və təmizlə
     */
    protected function processContent(string $rawContent, string $url): array
    {
        Log::info('🛠️ processContent başlanır', [
            'url' => $url,
            'raw_size' => strlen($rawContent),
            'raw_preview' => mb_substr(strip_tags($rawContent), 0, 200)
        ]);
        
        // 1. Encoding problemi həll et
        $content = $this->fixEncoding($rawContent);
        
        Log::info('✅ fixEncoding tamamlandı', [
            'url' => $url,
            'fixed_size' => strlen($content),
            'fixed_preview' => mb_substr(strip_tags($content), 0, 200),
            'has_azerbaijani_chars' => preg_match('/[əçğıöşüÇĞIÖŞÜƏ]/u', strip_tags($content)) ? 'YES' : 'NO'
        ]);
        
        // 2. HTML-i təmizlə və mətn çıxar
        $cleanContent = $this->extractCleanText($content);
        
        // 2.1. Mojibake düzəlişi (extract-dan sonra da tətbiq et)
        if (method_exists($this, 'fixAzerbaijaniMojibake')) {
            $cleanContent = $this->fixAzerbaijaniMojibake($cleanContent);
        }
        
        Log::info('✅ extractCleanText tamamlandı', [
            'url' => $url,
            'clean_size' => strlen($cleanContent),
            'clean_preview' => mb_substr($cleanContent, 0, 200),
            'has_azerbaijani_chars' => preg_match('/[əçğıöşüÇĞIÖŞÜƏ]/u', $cleanContent) ? 'YES' : 'NO'
        ]);
        
        // 2.5. Təmizlənmə prosesindən sonra yenidən UTF-8 təmizliyi
        $cleanContent = $this->ensureValidUTF8($cleanContent);
        
        Log::info('✅ ensureValidUTF8 tamamlandı', [
            'url' => $url,
            'final_size' => strlen($cleanContent),
            'final_preview' => mb_substr($cleanContent, 0, 200),
            'has_azerbaijani_chars' => preg_match('/[əçğıöşüÇĞIÖŞÜƏ]/u', $cleanContent) ? 'YES' : 'NO'
        ]);
        
        // 3. Başlıq tap
        $title = $this->extractTitle($content, $url);
        $title = $this->ensureValidUTF8($title);
        // Apply mojibake fixes for title as well
        if (method_exists($this, 'fixAzerbaijaniMojibake')) {
            $title = $this->fixAzerbaijaniMojibake($title);
            $title = $this->ensureValidUTF8($title);
        }
        
        // 4. Meta məlumatları çıxar
        $metadata = $this->extractMetadata($content, $url);
        // Metadata stringlərini UTF-8 et
        array_walk_recursive($metadata, function (&$v) {
            if (is_string($v)) {
                $v = $this->ensureValidUTF8($v);
            }
        });
        
        return [
            'title' => $title,
            'content' => $cleanContent,
            'metadata' => $metadata,
            'url' => $url
        ];
    }
    
    /**
     * Encoding problemlərini həll et - Azərbaycan hərfləri üçün təkmilləşdirilmiş
     */
    protected function fixEncoding(string $content): string
    {
        // 🔥 CRITICAL FIX: Double-encoding mojibake problemini həll et
        // Problem: UTF-8 mətn Windows-1252 kimi yanlış oxunub və sonra UTF-8-ə çevrilir
        
        // İlk öncə HTML-dən charset-i çıxar
        $htmlCharset = 'UTF-8'; // default
        if (preg_match('/<meta[^>]+charset=["\']?([^"\'>\s]+)["\']?/i', $content, $matches)) {
            $htmlCharset = strtoupper($matches[1]);
            Log::info('HTML charset tapıldı', ['charset' => $htmlCharset]);
        }
        
        // 🔍 1. DOUBLE-ENCODING DETECTION (Mojibake Pattern Detection)
        // Yalnız real mojibake bayt sekanslarını aşkarlayın (Ã, Å, Ä, Â, É™ və s.)
        $hasMojibake = preg_match('/(Ã|Å|Ä|Â|É™|Ã¶|Ã§|Ã¼)/u', $content);
        
        if ($hasMojibake) {
            Log::info('🚨 DOUBLE-ENCODING MOJIBAKE TAPILDI! Düzəldiş başlanır...');
            
            // METHOD 1: utf8_decode() + iconv (professional mojibake fix)
            // UTF-8 bytes-ları ISO-8859-1 kimi görüb, sonra düzgün Windows-1254-ə çevir
            if (function_exists('utf8_decode') && function_exists('iconv')) {
                $decoded = utf8_decode($content); // UTF-8 -> ISO-8859-1
                $fixed = @iconv('Windows-1254', 'UTF-8//IGNORE', $decoded);
                
                if ($fixed && mb_check_encoding($fixed, 'UTF-8')) {
                    $azScore = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $fixed);
                    Log::info('✅ Method 1 (utf8_decode+iconv): Az hərfləri = ' . $azScore);
                    
                    if ($azScore > 5) {
                        Log::info('✅✅✅ DOUBLE-ENCODING DÜZƏLDİLDİ (Method 1)!');
                        return $fixed; // Immediately return if successful
                    }
                }
            }
            
            // METHOD 2: Direct Windows-1252 conversion
            $attemptFix = @mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
            
            if ($attemptFix && mb_check_encoding($attemptFix, 'UTF-8')) {
                $azScore = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $attemptFix);
                $mojibakeScore = preg_match_all('/(MƏ|É\\?|Å\\?|Ã)/u', $attemptFix);
                
                Log::info('✅ Method 2 (mb_convert): Az hərfləri = ' . $azScore . ', Mojibake = ' . $mojibakeScore);
                
                if ($azScore > 10 && $mojibakeScore < 5) {
                    Log::info('✅✅✅ DOUBLE-ENCODING DÜZƏLDİLDİ (Method 2)!');
                    $content = $attemptFix;
                }
            }
            
            // METHOD 3: ISO-8859-9 (Turkish) conversion  
            if (strpos($content, 'Ã') !== false || strpos($content, 'Å') !== false) {
                $isoFix = @mb_convert_encoding($content, 'UTF-8', 'ISO-8859-9');
                if ($isoFix && mb_check_encoding($isoFix, 'UTF-8')) {
                    $azScore = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $isoFix);
                    Log::info('✅ Method 3 (ISO-8859-9): Az hərfləri = ' . $azScore);
                    
                    if ($azScore > 10) {
                        Log::info('✅✅✅ DOUBLE-ENCODING DÜZƏLDİLDİ (Method 3)!');
                        $content = $isoFix;
                    }
                }
            }
        }
        
        // 2. Geniş encoding siyahısı - Azərbaycan dili üçün uyğunlaşdırılmış
        $encodings = [
            'UTF-8', 'Windows-1254', 'ISO-8859-9', 'CP1254', 'Windows-1252', 'ISO-8859-1', 'ASCII'
        ];
        
        $detectedEncoding = mb_detect_encoding($content, $encodings, true);
        $isUTF8Valid = mb_check_encoding($content, 'UTF-8');
        
        // 2.5. Azərbaycan hərflərinin mövcudluğunu yoxla
        $hasAzerbaijaniChars = preg_match('/[əçğıöşüÇĞIÖŞÜƏ]/u', $content);
        $hasCorruptedChars = preg_match('/[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/', $content);
        
        Log::info('🔤 Encoding analizi', [
            'detected_encoding' => $detectedEncoding,
            'content_length' => strlen($content),
            'is_utf8_valid' => $isUTF8Valid,
            'html_charset' => isset($htmlCharset) ? $htmlCharset : 'none',
            'has_azerbaijani_chars' => $hasAzerbaijaniChars,
            'has_corrupted_chars' => $hasCorruptedChars
        ]);
        
        // 3. Azərbaycan hərfləri üçün xüsusi mojibake düzəldişi 
        if ($hasCorruptedChars || preg_match('/(Ãı|Ã¶|Ã§|Ã¼|Äə|Äğ|Äı|Şə|Ã|Ã)/u', $content)) {
            Log::info('🇦🇿 Azərbaycan hərflərində mojibake anar edildi');
            
            // Azərbaycan hərfləri üçün düzəltmə cədvəli
            $azerbaijaniFixMap = [
                // Çox rəst gələn mojibake nümunələri
                'Ã¶' => 'ö',     // ö
                'Ã§' => 'ç',     // ç
                'Ã¼' => 'ü',     // ü
                'Ã±' => 'ı',     // ı
                'Ãı' => 'ı',     // ı alternative
                'Äə' => 'ə',     // ə
                'Äğ' => 'ğ',     // ğ
                'Äı' => 'ı',     // ı
                'ÅŸ' => 'ş',     // ş
                'Å\x9F' => 'ş',  // ş alternative
                'Ã\x87' => 'Ç',  // Ç
                'Ã\x96' => 'Ö',  // Ö
                'Ã\x9C' => 'Ü',  // Ü
                'Ä\x9E' => 'Ğ',  // Ğ
                'Ä\x9F' => 'ğ',  // ğ
                'Ä±' => 'ı',     // ı
                'yazÄ±lmÄ±' => 'yazılmı',  // common pattern fix
                'ÅŸdÄ±r' => 'şdır',        // common pattern fix  
                'lÄ±' => 'lı',            // common pattern fix
                'Ä±x' => 'ıx',            // common pattern fix
                'ÄžÄ±' => 'ğı',           // common pattern fix
                'hÃ¤rfl' => 'hərfl',      // common pattern fix
                'Ã¤ri' => 'əri',          // common pattern fix
                'lÃ¤z' => 'ləz',          // common pattern fix
                'Ã¤' => 'ə',             // ə alternative
                'Ãœ' => 'Ü',             // Ü
                'mÃ¶tin' => 'mətin',     // specific word fix
                'gÃ¼zÃ¼l' => 'gözəl',     // specific word fix
                'dÃ¼zgÃ¼n' => 'düzgün',   // specific word fix
                // Kvadrat qutu simvolları
                '�' => '',  // replacement character-i sil
                '□' => '',  // white square-i sil
                '■' => '',  // black square-i sil
                '\xEF\xBF\xBD' => '',  // UTF-8 replacement sequence
            ];
            
            $fixed = str_replace(array_keys($azerbaijaniFixMap), array_values($azerbaijaniFixMap), $content);
            
            // Nəticəni yoxla
            $scoreBefore = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $content, $m1);
            $scoreAfter  = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $fixed, $m2);
            
            if ($scoreAfter > $scoreBefore || $hasCorruptedChars) {
                Log::info('✅ Azərbaycan mojibake düzəldildi', [
                    'azerbaijani_chars_before' => $scoreBefore,
                    'azerbaijani_chars_after' => $scoreAfter
                ]);
                $content = $fixed;
            }
        }
        
        // 3a. UTF-8 görünsə də "mojibake" varsa düzəlt - GÜÇLƏNDİRİLMİŞ
        if ($isUTF8Valid && ($detectedEncoding === 'UTF-8' || !$detectedEncoding)) {
            // Azərbaycan və türkçə üçün mojibake nümunələri
            if (preg_match('/(Ã|Å|Ä|Â|É|Åş|Äı|Ã¶|Ã§|Ãü|Ä|É™|HÃ¦|ŞÉ|É™lə|ÅÄı|mÉ™sÉ™lÉ™lÉ™ri)/u', $content)) {
                Log::info('🔄 Azərbaycan/Türk encoding problemi tapıldı, düzəltmə başlanır');
                
                // İlk öncə Windows-1254 (Türk) ilə cəhd et
                $turkishFixed = @mb_convert_encoding($content, 'UTF-8', 'Windows-1254');
                if ($turkishFixed && mb_check_encoding($turkishFixed, 'UTF-8')) {
                    $scoreAfter = preg_match_all('/[əçğıöşüƏÇĞİÖŞÜ]/u', $turkishFixed, $m);
                    if ($scoreAfter > 5) {
                        Log::info('✅ Windows-1254 ilə uğurla düzəldildi', ['az_chars' => $scoreAfter]);
                        return $turkishFixed;
                    }
                }
                
                // Sonra ISO-8859-9 ilə cəhd et
                $isoFixed = @mb_convert_encoding($content, 'UTF-8', 'ISO-8859-9');
                if ($isoFixed && mb_check_encoding($isoFixed, 'UTF-8')) {
                    $scoreAfter = preg_match_all('/[əçğıöşüƏÇĞİÖŞÜ]/u', $isoFixed, $m);
                    if ($scoreAfter > 3) {
                        Log::info('✅ ISO-8859-9 ilə uğurla düzəldildi', ['az_chars' => $scoreAfter]);
                        return $isoFixed;
                    }
                }
                
                // Son cəhd - əvvəlki metod
                $fixed = @iconv('Windows-1252', 'UTF-8//IGNORE', utf8_decode($content));
                if ($fixed !== false && mb_check_encoding($fixed, 'UTF-8')) {
                    $scoreBefore = preg_match_all('/[şğıöçüİıƏə]/u', $content, $m1);
                    $scoreAfter  = preg_match_all('/[şğıöçüİıƏə]/u', $fixed, $m2);
                    if ($scoreAfter >= $scoreBefore) {
                        Log::info('✅ Fallback mojibake düzəldildi (utf8_decode+iconv)');
                        return $fixed;
                    }
                }
            }
            // Mojibake yoxdursa, mövcud mətni saxla
            return $content;
        }
        
        // 4. Müəyyən encoding-dən çevir
        if ($detectedEncoding && $detectedEncoding !== 'UTF-8') {
            $converted = mb_convert_encoding($content, 'UTF-8', $detectedEncoding);
            if (mb_check_encoding($converted, 'UTF-8')) {
                Log::info('✅ Encoding çevrildi', ['from' => $detectedEncoding, 'to' => 'UTF-8']);
                return $converted;
            }
        }
        
        // 5. Türk dili üçün xüsusi çevrimi (əsas problem burada ola bilər)
        $turkishEncodings = ['Windows-1254', 'ISO-8859-9', 'CP1254'];
        foreach ($turkishEncodings as $encoding) {
            try {
                $testContent = mb_convert_encoding($content, 'UTF-8', $encoding);
                
                // Azərbaycan və türk hərflərinə bax
                if (preg_match('/[çğıöşüÇĞIÖŞÜ]/u', $testContent) || 
                    preg_match('/[əÇĞIÖŞÜöşüğç]/u', $testContent)) {
                    Log::info('✅ Türk dili encoding tapıldı', ['encoding' => $encoding]);
                    return $testContent;
                }
            } catch (Exception $e) {
                continue;
            }
        }
        
        // 6. İconv ilə son cəhd
        if (function_exists('iconv')) {
            foreach (['Windows-1254', 'ISO-8859-9', 'Windows-1252'] as $fromEncoding) {
                $converted = @iconv($fromEncoding, 'UTF-8//IGNORE', $content);
                if ($converted !== false && mb_check_encoding($converted, 'UTF-8')) {
                    Log::info('✅ iconv ilə çevrildi', ['from' => $fromEncoding]);
                    return $converted;
                }
            }
        }
        
        // 7. Son ehtiyat - bütün səhv byte-ları təmizlə
        $cleaned = mb_convert_encoding($content, 'UTF-8', 'UTF-8');
        Log::warning('⚠️ Encoding temizləndi ama mükəmməl olmaya bilər');
        return $cleaned;
    }
    
    /**
     * AZ skoru müqayisəsi ilə ən yaxşı variantı seç
     */
    protected function chooseBestByAzerbaijaniScore(string $original, string $converted): string
    {
        $scoreOrig = $this->azerbaijaniScore($original);
        $scoreConv = $this->azerbaijaniScore($converted);
        // 1) Prefer variant with more AZ letters
        if ($scoreConv['az'] > $scoreOrig['az']) { return $converted; }
        if ($scoreConv['az'] < $scoreOrig['az']) { return $original; }
        // 2) If equal, prefer fewer mojibake markers
        if ($scoreConv['moji'] < $scoreOrig['moji']) { return $converted; }
        if ($scoreConv['moji'] > $scoreOrig['moji']) { return $original; }
        // 3) If still equal, prefer fewer ASCII question marks ("?")
        if ($scoreConv['q'] < $scoreOrig['q']) { return $converted; }
        if ($scoreConv['q'] > $scoreOrig['q']) { return $original; }
        // 4) Prefer fewer replacement chars (�)
        if ($scoreConv['rep'] < $scoreOrig['rep']) { return $converted; }
        if ($scoreConv['rep'] > $scoreOrig['rep']) { return $original; }
        return $original;
    }

    protected function azerbaijaniScore(string $text): array
    {
        $az = preg_match_all('/[əƏçÇğĞıİöÖşŞüÜ]/u', $text, $m1);
        $moji = preg_match_all('/(Ã|Å|Ä|Â|É™)/u', $text, $m2);
        $q = substr_count($text, '?');
        $rep = substr_count($text, '�');
        return ['az' => (int)$az, 'moji' => (int)$moji, 'q' => (int)$q, 'rep' => (int)$rep];
    }

    /**
     * Fix common Azerbaijani mojibake patterns (shared with Enhanced)
     */
    protected function fixAzerbaijaniMojibake(string $content): string
    {
        $replacements = [
            // Common mojibake patterns for Azerbaijani
            'Ã¶' => 'ö', 'Ã§' => 'ç', 'Ã¼' => 'ü', 'Ä±' => 'ı', 'ÅŸ' => 'ş', 'ÄŸ' => 'ğ', 'Ä°' => 'İ',
            'Ã‡' => 'Ç', 'Ã–' => 'Ö', 'Ãœ' => 'Ü', 'Åž' => 'Ş', 'Äž' => 'Ğ', 'É™' => 'ə', 'Æ' => 'Ə',
            // Double encoded patterns
            'Ã¤' => 'ə', 'Ã„Ÿ' => 'ğ', 'Ã„±' => 'ı',
            // Remove replacement characters
            '�' => '', '□' => '', '■' => '', "\xEF\xBF\xBD" => ''
        ];
        $fixed = str_replace(array_keys($replacements), array_values($replacements), $content);
        // Remove ASCII control chars only
        $fixed = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $fixed);
        return $fixed;
    }

    /**
     * HTML-dən təmiz mətn çıxar
     */
    protected function extractCleanText(string $html): string
    {
        try {
            // 🔥 YENİ YANAŞMA: DOMDocument əvəzinə regex və strip_tags istifadə et
            // DOMDocument encoding-i pozur, ona görə sadə metodla gedək
            
            Log::info('🧹 HTML təmizlənir (yeni metod - encoding-safe)', [
                'html_size' => strlen($html),
                'has_azerbaijani_before' => preg_match('/[əçğıöşüÇĞIÖŞÜƏ]/u', $html) ? 'YES' : 'NO'
            ]);
            
            // 1. İstənilməyən tagləri regex ilə sil
            $html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
            $html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);
            $html = preg_replace('/<nav[^>]*>.*?<\/nav>/is', '', $html);
            $html = preg_replace('/<header[^>]*>.*?<\/header>/is', '', $html);
            $html = preg_replace('/<footer[^>]*>.*?<\/footer>/is', '', $html);
            $html = preg_replace('/<aside[^>]*>.*?<\/aside>/is', '', $html);
            $html = preg_replace('/<iframe[^>]*>.*?<\/iframe>/is', '', $html);
            $html = preg_replace('/<noscript[^>]*>.*?<\/noscript>/is', '', $html);
            
            // 2. Menü və naviqasiya elementlərini sil
            $html = preg_replace('/<[^>]*class=["\']?[^"\'>]*menu[^"\'>]*["\']?[^>]*>.*?<\/[^>]+>/is', '', $html);
            $html = preg_replace('/<[^>]*class=["\']?[^"\'>]*navigation[^"\'>]*["\']?[^>]*>.*?<\/[^>]+>/is', '', $html);
            $html = preg_replace('/<[^>]*class=["\']?[^"\'>]*sidebar[^"\'>]*["\']?[^>]*>.*?<\/[^>]+>/is', '', $html);
            
            // 3. HTML tag-lərini sil - UTF-8 SAFE
            // strip_tags() UTF-8-i poza bilər, ona görə əvvəlcə entity decode edək
            
            // 3a. UTF-8 təminatı - mb_convert_encoding ilə force UTF-8
            $html = mb_convert_encoding($html, 'UTF-8', 'UTF-8');
            
            // 3b. HTML entity-ləri decode et
            $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            
            // 3c. strip_tags - PHP-nin internal encoding-ini UTF-8 et
            $oldEncoding = mb_internal_encoding();
            mb_internal_encoding('UTF-8');
            $text = strip_tags($html);
            mb_internal_encoding($oldEncoding);
            
            // 3d. Yenidən UTF-8 force et
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
            
            // 3e. Təkrar entity decode
            $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

            // 4. Dil seçim zolaqlarını və yalnız Ərəbcə olan sətrləri sil
            $text = preg_replace('/\bEnglish\b\s+\b(Azərbaycan|Azerbaycan)\b\s+\bTürkçe\b\s+\bFrançais\b.*$/imu', '', $text);
            $text = preg_replace('/^\s*[\p{Arabic}\s]+$/mu', '', $text);
            
            // 5. Artıq boşluqları təmizlə
            $text = preg_replace('/\s+/u', ' ', $text);
            $text = preg_replace('/\n\s*\n/u', "\n\n", $text);
            $text = trim($text);
            
            Log::info('✅ HTML təmizləndi', [
                'text_size' => strlen($text),
                'has_azerbaijani_after' => preg_match('/[əçğıöşüÇĞIÖŞÜƏ]/u', $text) ? 'YES' : 'NO'
            ]);
            
            return $text;
            
        } catch (Exception $e) {
            Log::warning('DOM processing xətası, regex fallback istifadə edilir', [
                'error' => $e->getMessage()
            ]);
            
            // Fallback: regex istifadə et
            $content = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
            $content = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $content);
            $content = strip_tags($content);
            $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $content = preg_replace('/\s+/', ' ', $content);
            
            return trim($content);
        }
    }
    
    /**
     * Başlıq çıxar
     */
    protected function extractTitle(string $html, string $url): string
    {
        // 1. <title> tag-dən cəhd et
        if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $matches)) {
            $title = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if (strlen($title) > 5 && strlen($title) <= 200) {
                return $this->cleanTitle($title);
            }
        }
        
        // 2. H1-dən cəhd et
        if (preg_match('/<h1[^>]*>([^<]+)<\/h1>/i', $html, $matches)) {
            $title = trim(strip_tags($matches[1]));
            $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if (strlen($title) > 5 && strlen($title) <= 200) {
                return $this->cleanTitle($title);
            }
        }
        
        // 3. Meta title-dan cəhd et
        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $matches) ||
            preg_match('/<meta[^>]+name=["\']title["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            $title = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if (strlen($title) > 5 && strlen($title) <= 200) {
                return $this->cleanTitle($title);
            }
        }
        
        // 4. URL-dən yaradılmış başlıq
        $host = parse_url($url, PHP_URL_HOST);
        return "İmport edilmiş məzmun - " . ($host ?: 'bilinməyən mənbə');
    }
    
    /**
     * Başlığı təmizlə
     */
    protected function cleanTitle(string $title): string
    {
        // Artıq boşluqları sil
        $title = preg_replace('/\s+/', ' ', $title);
        
        // Sayt adını və artıq məlumatları sil
        $commonSuffixes = [' - ', ' | ', ' :: ', ' / ', ' — '];
        foreach ($commonSuffixes as $suffix) {
            $pos = strrpos($title, $suffix);
            if ($pos !== false) {
                $beforeSuffix = substr($title, 0, $pos);
                $afterSuffix = substr($title, $pos + strlen($suffix));
                
                // Əgər sonrakı hissə sayt adı kimidir
                if (strlen($beforeSuffix) > strlen($afterSuffix) && strlen($beforeSuffix) > 10) {
                    $title = $beforeSuffix;
                }
            }
        }
        
        return trim($title);
    }
    
    /**
     * Meta məlumatları çıxar
     */
    protected function extractMetadata(string $html, string $url): array
    {
        $metadata = [
            'url' => $url,
            'extracted_at' => now()->toISOString(),
            'host' => parse_url($url, PHP_URL_HOST)
        ];
        
        // Description
        if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            $metadata['description'] = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // Keywords
        if (preg_match('/<meta[^>]+name=["\']keywords["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            $metadata['keywords'] = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // Author
        if (preg_match('/<meta[^>]+name=["\']author["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            $metadata['author'] = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // Language
        if (preg_match('/<html[^>]+lang=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            $metadata['language'] = trim($matches[1]);
        }
        
        return $metadata;
    }
    
    /**
     * Səviyyəyə görə xülasələşdir - SÜRƏTLİ VE EFFEKTIV
     */
    protected function summarizeByLevel(string $content, int $level): string
    {
        $length = strlen($content);
        // 🔥 YENİLƏNMİŞ FARİZLəR Və MİNİMUM UZUNLUQLAR
        $map = [
            4 => max(3000, (int) round($length * 0.75)), // 75% saxla, minimum 3000 hərf
            3 => max(2000, (int) round($length * 0.50)), // 50% saxla, minimum 2000 hərf
            2 => max(1200, (int) round($length * 0.30)), // 30% saxla, minimum 1200 hərf
            1 => max(800, (int) round($length * 0.15)),  // 15% saxla, minimum 800 hərf
        ];
        
        // Əgər məzmun artıq qısadırsa, xülasələşdirməyə ehtiyac yoxdur
        if ($level >= 5 || $length <= 800) { // Minimum uzunluğu 800-ə artırdıq
            Log::info('ℹ️ Xülasələşdirmə atlanıldı', [
                'level' => $level, 
                'content_length' => $length,
                'reason' => $level >= 5 ? 'level_5_full_content' : 'content_too_short_for_summary'
            ]);
            return $content;
        }
        
        $target = $map[$level] ?? 1000;
        
        // FAST MODE: Səviyyə 1-2 üçün daha ağıllı kəsmə
        if ($level <= 2) {
            Log::info('🚀 Sürətli xülasələşdirmə (çoxlu paraf kəsmə)', ['level' => $level, 'target' => $target]);
            // Çox paraflarlı məzmunları daha yoğun hala gətir amma hələ oxunabilir saxla
            $smartReduced = $this->smartContentReduction($content, $target);
            return $smartReduced;
        }
        
        // SMART MODE: Səviyyə 3-4 üçün AI istifadə et - daha sürətli
        try {
            if ($this->aiService && $level >= 3 && $level <= 4) {
                Log::info('🤖 AI xülasələşdirmə başlanır', ['level' => $level, 'target_length' => $target]);
                
                // Daha qısa mətn və daha sürətli prompt
                $shortContent = mb_substr($content, 0, min(1500, $target * 2)); // Daha qısa input
                $messages = [
                    ['role' => 'system', 'content' => "Azərbaycan dilində qısa xülasə et. Maksimum $target hərf. Əsas məlumatları saxla."],
                    ['role' => 'user', 'content' => $shortContent]
                ];
                
                $startTime = microtime(true);
                // Timeout daha qısa - 3 saniyə
                $resp = $this->aiService->chat($messages, $target, ['timeout' => 3]);
                $endTime = microtime(true);
                $duration = round(($endTime - $startTime) * 1000);
                
                $summary = $resp['content'] ?? '';
                if (is_string($summary) && strlen($summary) > 30 && $duration < 3500) {
                    Log::info('✅ AI xülasə hazır', ['duration_ms' => $duration, 'length' => strlen($summary)]);
                    return $summary;
                }
                
                Log::warning('⚠️ AI timeout və ya qeyri-keyfiyyətli, fallback istifadə edilir', [
                    'duration_ms' => $duration, 
                    'summary_length' => strlen($summary)
                ]);
            }
        } catch (\Throwable $e) { 
            Log::warning('❌ AI xətası, fallback istifadə edilir', ['error' => $e->getMessage()]);
        }
        
        // Fallback: ağıllı kəsmə
        return $this->smartTruncate($content, $target);
    }
    
    /**
     * Daha ağıllı məzmun azalması - çox paraflı mətnlər üçün
     */
    protected function smartContentReduction(string $content, int $target): string
    {
        if (strlen($content) <= $target) {
            return $content;
        }
        
        // 1. Çox qısa parafları sil (50 hərfdən az)
        $paragraphs = explode("\n\n", $content);
        $filteredParagraphs = array_filter($paragraphs, function($p) {
            return strlen(trim($p)) >= 50;
        });
        
        $reducedContent = implode("\n\n", $filteredParagraphs);
        
        // 2. Hələ çox uzundursa, ən uzun parafları saxla
        if (strlen($reducedContent) > $target) {
            usort($filteredParagraphs, function($a, $b) {
                return strlen($b) - strlen($a); // Uzundan qısaya doğru sırala
            });
            
            $finalContent = '';
            $currentLength = 0;
            
            foreach ($filteredParagraphs as $paragraph) {
                $paragraphLength = strlen($paragraph);
                if ($currentLength + $paragraphLength <= $target * 0.9) {
                    $finalContent .= ($finalContent ? "\n\n" : '') . $paragraph;
                    $currentLength += $paragraphLength + 2; // + 2 for \n\n
                } else {
                    break;
                }
            }
            
            return $finalContent ?: $this->smartTruncate($content, $target);
        }
        
        return $reducedContent;
    }
    
    /**
     * Ağıllı kəsmə - cümlələri yarımda kəsməz
     */
    protected function smartTruncate(string $content, int $target): string
    {
        if (strlen($content) <= $target) {
            return $content;
        }
        
        // Target length-in 90%-nə kəs ki yer qalsın
        $cutPoint = (int) ($target * 0.9);
        $truncated = mb_substr($content, 0, $cutPoint);
        
        // Son cümlənin sonunu tap
        $lastSentence = mb_strrpos($truncated, '.');
        if ($lastSentence !== false && $lastSentence > ($cutPoint * 0.7)) {
            $truncated = mb_substr($truncated, 0, $lastSentence + 1);
        } else {
            // Cümlə yoxdursa, sətir sonu axtara
            $lastNewline = mb_strrpos($truncated, "\n");
            if ($lastNewline !== false && $lastNewline > ($cutPoint * 0.8)) {
                $truncated = mb_substr($truncated, 0, $lastNewline);
            } else {
                // Son boşluğu tap
                $lastSpace = mb_strrpos($truncated, ' ');
                if ($lastSpace !== false && $lastSpace > ($cutPoint * 0.85)) {
                    $truncated = mb_substr($truncated, 0, $lastSpace);
                }
            }
            $truncated .= '...';
        }
        
        Log::info('✂️ Ağıllı kəsmə tamamlandı', [
            'original_length' => strlen($content),
            'target' => $target,
            'final_length' => strlen($truncated)
        ]);
        
        return trim($truncated);
    }

    /**
     * Link-ləri çıxar (dərin crawling üçün)
     */
    protected function extractLinks(string $url, string $baseUrl): array
    {
        $content = $this->fetchContent($url);
        if (!$content) return [];
        
        $links = [];
        $baseHost = parse_url($baseUrl, PHP_URL_HOST);
        $baseScheme = parse_url($baseUrl, PHP_URL_SCHEME);
        
        if (preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/i', $content, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $link = trim($match[1]);
                $linkText = trim(strip_tags($match[2]));
                
                // İstənilməyən linkləri keç
                if (empty($link) || 
                    strpos($link, '#') === 0 ||
                    strpos($link, 'javascript:') === 0 ||
                    strpos($link, 'mailto:') === 0 ||
                    strpos($link, 'tel:') === 0) {
                    continue;
                }
                
                // Relative URL-ləri absolute-a çevir
                if (strpos($link, 'http') !== 0) {
                    if (strpos($link, '/') === 0) {
                        $link = $baseScheme . '://' . $baseHost . $link;
                    } else {
                        $link = rtrim(dirname($url), '/') . '/' . $link;
                    }
                }
                
                // Yalnız eyni domain-dən linkləri götür
                $linkHost = parse_url($link, PHP_URL_HOST);
                if ($linkHost === $baseHost) {
                    $links[] = $link;
                }
            }
        }
        
        return array_unique($links);
    }
    
    /**
     * Full site training üçün yeni bilik yaradır
     */
    protected function createKnowledgeForFullSite(array $data, string $url, array $options = []): KnowledgeBase
    {
        // UTF-8 encoding təmizliyi
        $cleanTitle = $this->ensureValidUTF8($data['title']);
        $cleanContent = $this->ensureValidUTF8($data['content']);
        
        $kb = KnowledgeBase::create([
            'title' => $cleanTitle,
            'content' => $cleanContent,
            'source_url' => $url,
            'source' => $options['source'] ?? 'Sayt İmport (Avtomatik)',
            'category' => $options['category'] ?? 'full_site',
            'author' => $data['metadata']['author'] ?? null,
            'language' => $data['metadata']['language'] ?? 'az',
            'metadata' => array_merge($data['metadata'], [
                'training_method' => 'full_site_training',
                'training_mode' => 'full_site',
                'encoding_fixed' => true,
                'content_quality' => $this->assessContentQuality($cleanContent),
                'imported_via' => 'TrainingService::FullSite',
                'is_part_of_full_site' => true
            ]),
            'is_active' => true
        ]);
        // Embed and store
        try { 
            $kb->embedding = json_encode($this->embedding->embed($cleanContent)); 
            $kb->save(); 
            Log::info('✅ Full site: Embedding yaradıldı', ['url' => $url]);
        } catch (\Throwable $e) { 
            Log::warning('⚠️ Full site: Embedding xətası', ['url' => $url, 'error' => $e->getMessage()]);
        }
        return $kb;
    }
    
    /**
     * Full site training üçün mövcud bilik yenilənir
     */
    protected function updateKnowledgeForFullSite(KnowledgeBase $existing, array $data, array $options = []): KnowledgeBase
    {
        // UTF-8 encoding təmizliyi
        $cleanTitle = $this->ensureValidUTF8($data['title']);
        $cleanContent = $this->ensureValidUTF8($data['content']);
        
        $existing->update([
            'title' => $cleanTitle,
            'content' => $cleanContent,
            'metadata' => array_merge($existing->metadata ?? [], $data['metadata'], [
                'last_updated_via' => 'TrainingService::FullSite',
                'training_mode' => 'full_site',
                'update_count' => ($existing->metadata['update_count'] ?? 0) + 1,
                'content_quality' => $this->assessContentQuality($cleanContent),
                'is_part_of_full_site' => true,
                'last_full_site_update' => now()->toISOString()
            ])
        ]);
        try { 
            $existing->embedding = json_encode($this->embedding->embed($cleanContent)); 
            $existing->save();
            Log::info('✅ Full site: Embedding yeniləndi', ['url' => $existing->source_url]);
        } catch (\Throwable $e) { 
            Log::warning('⚠️ Full site: Embedding yeniləmə xətası', ['url' => $existing->source_url, 'error' => $e->getMessage()]);
        }
        return $existing->fresh();
    }
    
    /**
     * Yeni bilik yaradır
     */
    protected function createKnowledge(array $data, string $url, array $options = []): KnowledgeBase
    {
        // UTF-8 encoding təmizliyi
        $cleanTitle = $this->ensureValidUTF8($data['title']);
        $cleanContent = $this->ensureValidUTF8($data['content']);
        
        $isSinglePage = $options['single'] ?? true;
        
        $kb = KnowledgeBase::create([
            'title' => $cleanTitle,
            'content' => $cleanContent,
            'source_url' => $url,
            'source' => $options['source'] ?? 'URL Import',
            'category' => $options['category'] ?? 'imported',
            'author' => $data['metadata']['author'] ?? null,
            'language' => $data['metadata']['language'] ?? 'az',
            'metadata' => array_merge($data['metadata'], [
                'training_method' => 'advanced_training_service',
                'training_mode' => $isSinglePage ? 'single' : 'full',
                'encoding_fixed' => true,
                'content_quality' => $this->assessContentQuality($cleanContent),
                'imported_via' => 'TrainingService'
            ]),
            'is_active' => true
        ]);
        // Embed and store
        try { $kb->embedding = json_encode($this->embedding->embed($cleanContent)); $kb->save(); } catch (\Throwable $e) { }
        return $kb;
    }
    
    /**
     * Mövcud bilik yenilənir
     */
    protected function updateKnowledge(KnowledgeBase $existing, array $data, array $options = []): KnowledgeBase
    {
        // UTF-8 encoding təmizliyi
        $cleanTitle = $this->ensureValidUTF8($data['title']);
        $cleanContent = $this->ensureValidUTF8($data['content']);
        
        $isSinglePage = $options['single'] ?? true;
        
        $existing->update([
            'title' => $cleanTitle,
            'content' => $cleanContent,
            'metadata' => array_merge($existing->metadata ?? [], $data['metadata'], [
                'last_updated_via' => 'TrainingService',
                'training_mode' => $isSinglePage ? 'single' : 'full',
                'update_count' => ($existing->metadata['update_count'] ?? 0) + 1,
                'content_quality' => $this->assessContentQuality($cleanContent)
            ])
        ]);
        try { $existing->embedding = json_encode($this->embedding->embed($cleanContent)); $existing->save(); } catch (\Throwable $e) { }
        return $existing->fresh();
    }
    
    /**
     * Məzmunun keyfiyyətini qiymətləndir
     */
    protected function assessContentQuality(string $content): string
    {
        $length = strlen($content);
        
        if ($length < 500) return 'low';
        if ($length < 2000) return 'medium';
        if ($length < 5000) return 'high';
        return 'excellent';
    }
    
    /**
     * Mətn training - text məzmunu train et
     */
    public function trainFromText(string $title, string $content, array $options = []): KnowledgeBase
    {
        try {
            Log::info('📝 Text training başlanır', [
                'title' => $title,
                'content_length' => strlen($content)
            ]);
            
            // Minimum məzmun yoxla
            if (strlen($content) < 20) {
                throw new Exception('Məzmun çox qısadır');
            }
            
            // Müzakərəli başlıq yoxla
            $existing = KnowledgeBase::where('title', $title)
                                   ->whereNull('source_url')
                                   ->first();
                                   
            if ($existing) {
                Log::info('📝 Mövcud mətn yenilənir', ['title' => $title]);
                $existing->update([
                    'content' => $content,
                    'metadata' => array_merge($existing->metadata ?? [], [
                        'last_updated_via' => 'TrainingService::trainFromText',
                        'update_count' => ($existing->metadata['update_count'] ?? 0) + 1,
                        'content_quality' => $this->assessContentQuality($content)
                    ] + $options)
                ]);
                return $existing->fresh();
            } else {
                Log::info('🆕 Yeni mətn əlavə edilir', ['title' => $title]);
            $kb = KnowledgeBase::create([
                'title' => $title,
                'content' => $content,
                'source' => $options['source'] ?? 'Manual Text Entry',
                'category' => $options['category'] ?? 'manual',
                'author' => $options['author'] ?? null,
                'language' => $options['language'] ?? 'az',
                'metadata' => array_merge([
                    'training_method' => 'text_training',
                    'created_via' => 'TrainingService::trainFromText',
                    'content_quality' => $this->assessContentQuality($content)
                ], $options),
                'is_active' => true
            ]);
            try { $kb->embedding = json_encode($this->embedding->embed($content)); $kb->save(); } catch (\Throwable $e) { }
            return $kb;
            }
            
        } catch (Exception $e) {
            Log::error('❌ Text training xətası', [
                'title' => $title,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    /**
     * UTF-8 encoding təmizliyi təmin et - Azərbaycan hərfləri üçün təkmilləşdirilmiş
     */
    protected function ensureValidUTF8(string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // İlk təmizlik - null və control karakterləri sil
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        
        // Kvadrat qutu simvollarını sil (replacement characters)
        $text = str_replace(['�', '□', '■', '\xEF\xBF\xBD'], '', $text);

        // Sürətli keyfiyyət ölçüsü
        $azScoreOrig = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $text);
        $mojiScoreOrig = preg_match_all('/(Ã|Å|Ä|Â|É™)/u', $text);

        // 1) Mümkünsə yalnız UTF-8 daxilində təmizlə və qayıt
        if (mb_check_encoding($text, 'UTF-8')) {
            // Problemli baytları at, görünüş artefaktlarını təmizlə
            $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $text);
            if ($cleaned === false) { $cleaned = $text; }
            $cleaned = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $cleaned); // zero-width
            $cleaned = str_replace(['Â«','Â»'], ['«','»'], $cleaned);
            $cleaned = str_replace('Â', '', $cleaned);
            // Remove Unicode C1 control code points (not raw bytes)
            $cleaned = preg_replace('/[\x{0080}-\x{009F}]/u', '', $cleaned);
            return $cleaned;
        }

        // 2) Variantlar hazırlansın: UTF-8 ignore və tək-bayt konversiyalar
        $candidates = [];
        $utf8Ignored = @iconv('UTF-8', 'UTF-8//IGNORE', $text);
        if ($utf8Ignored !== false && mb_check_encoding($utf8Ignored, 'UTF-8')) {
            $candidates['UTF8_IGNORE'] = $utf8Ignored;
        }

        $encodings = ['Windows-1254', 'CP1254', 'ISO-8859-9', 'Windows-1252', 'ISO-8859-1'];
        foreach ($encodings as $fromEncoding) {
            $converted = @mb_convert_encoding($text, 'UTF-8', $fromEncoding);
            if ($converted && mb_check_encoding($converted, 'UTF-8')) {
                $candidates[$fromEncoding] = $converted;
            }
        }

        // 3) Ən yaxşı variantı seç (AZ hərfləri çox, mojibake az, uzunluq itkisi az)
        $bestKey = null; $bestScore = -PHP_INT_MAX; $best = null;
        $origLen = strlen($text);
        foreach ($candidates as $key => $variant) {
            $variant = @iconv('UTF-8', 'UTF-8//IGNORE', $variant) ?: $variant;
            $az = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $variant);
            $moji = preg_match_all('/(Ã|Å|Ä|Â|É™)/u', $variant);
            $len = strlen($variant);
            $lossPenalty = max(0, $origLen - $len) / 50.0; // böyük itkiləri cəzalandır
            $score = ($az * 10) - ($moji * 5) - $lossPenalty;
            if ($score > $bestScore) { $bestScore = $score; $best = $variant; $bestKey = $key; }
        }

        if ($best !== null) {
            // Artefaktları təmizlə
            $best = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $best);
            $best = str_replace(['Â«','Â»'], ['«','»'], $best);
            $best = str_replace('Â', '', $best);
            $best = preg_replace('/[\x{0080}-\x{009F}]/u', '', $best);
Log::info('✅ Encoding seçildi', ['by' => $bestKey, 'az_chars' => preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $best)]);
            return $best;
        }

        // 4) Ən son ehtiyat - yalnız UTF-8 daxilində saxla
        $cleaned = @mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        if ($cleaned && mb_check_encoding($cleaned, 'UTF-8')) {
            $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $cleaned) ?: $cleaned;
            $cleaned = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $cleaned);
            $cleaned = str_replace(['Â«','Â»'], ['«','»'], $cleaned);
            $cleaned = str_replace('Â', '', $cleaned);
            $cleaned = preg_replace('/[\x{0080}-\x{009F}]/u', '', $cleaned);
Log::warning('⚠️ UTF-8 self-clean fallback istifadə edildi');
            return $cleaned;
        }

        // 5) Byte-level fallback
        $cleaned = '';
        $len = strlen($text);
        for ($i = 0; $i < $len; $i++) {
            $char = $text[$i];
            $ord = ord($char);
            if (($ord >= 32 && $ord <= 126) || ($ord == 10 || $ord == 13 || $ord == 9)) {
                $cleaned .= $char;
            } elseif ($ord >= 160 && $ord <= 255) {
                $cleaned .= $char; // keep extended ASCII as-is
            }
        }
        $cleaned = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $cleaned);
        $cleaned = preg_replace('/\p{Mn}+/u', '', $cleaned);
        $cleaned = str_replace(['Â«','Â»'], ['«','»'], $cleaned);
        $cleaned = str_replace('Â', '', $cleaned);
        $cleaned = preg_replace('/[\x{0080}-\x{009F}]/u', '', $cleaned);
Log::warning('⚠️ Byte-level təmizlik tətbiq edildi');
        return $cleaned;
    }
    
    /**
     * Q&A training - sual-cavab formatında train et
     */
    public function trainQA(string $question, string $answer, array $options = []): KnowledgeBase
    {
        try {
            
            $content = "**SUAL:** {$question}\n\n**CAVAB:** {$answer}";
            $title = "S&C: " . Str::limit($question, 80);
            
            $kb = KnowledgeBase::create([
                'title' => $title,
                'content' => $content,
                'source' => $options['source'] ?? 'S&C - Baza',
                'category' => $options['category'] ?? 'qa',
                'author' => $options['author'] ?? null,
                'language' => $options['language'] ?? 'az',
                'metadata' => array_merge([
                    'training_method' => 'qa_training',
                    'question' => $question,
                    'answer' => $answer,
                    'content_type' => 'qa_pair',
                    'content_quality' => $this->assessContentQuality($content)
                ], $options),
                'is_active' => true
            ]);
            try { $kb->embedding = json_encode($this->embedding->embed($question . "\n" . $answer)); $kb->save(); } catch (\Throwable $e) { }
            return $kb;
            
        } catch (Exception $e) {
            Log::error('❌ Q&A telimat xətası', [
                'question' => $question,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
