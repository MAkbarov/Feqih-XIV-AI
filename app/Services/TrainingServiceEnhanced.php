<?php

namespace App\Services;

use App\Models\KnowledgeBase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;
use DOMDocument;
use DOMXPath;

/**
 * Enhanced Training Service - Professional URL import with robust encoding and deep content extraction
 * Fixed issues:
 * - Proper UTF-8/Azerbaijani character encoding
 * - Deep content extraction without page limits
 * - Improved error handling and recovery
 * - Better duplicate management
 * - Enhanced content quality assessment
 */
class TrainingServiceEnhanced
{
    protected EmbeddingService $embedding;
    protected ?AiService $aiService = null;
    
    // Content extraction configuration
    protected array $config = [
        'min_content_length' => 100,     // Minimum content length to accept
        'max_content_length' => 500000,  // Maximum content length (500KB text)
        'crawl_delay' => 200000,         // Microseconds delay between requests (0.2s)
        'timeout' => 180,                // Request timeout in seconds
        'max_redirects' => 10,           // Maximum redirects to follow
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KHTML, like Gecko Chrome/120.0.0.0 Safari/537.36',
        'accept_languages' => 'az,tr,en-US,en;q=0.9',
        'max_depth' => 10,               // Maximum crawl depth for full site
        'max_pages' => 5000,             // Maximum pages to crawl
    ];

    public function __construct(EmbeddingService $embedding, ?AiService $aiService = null)
    {
        $this->embedding = $embedding;
        $this->aiService = $aiService;
    }

    /**
     * Train from URL with enhanced extraction and encoding
     */
    public function trainFromUrl(string $url, array $options = [], ?callable $progress = null): array
    {
        try {
            Log::info('🚀 Enhanced URL Training Started', [
                'url' => $url,
                'options' => $options
            ]);

            $single = $options['single'] ?? true;
            $results = [];

            if ($single) {
                // Single page training
                $result = $this->trainSinglePageEnhanced($url, $options);
                if ($result) {
                    $results[] = $result;
                    if ($progress) $progress(100);
                }
            } else {
                // Full site training with enhanced crawling
                $results = $this->trainFullSiteEnhanced($url, $options, $progress);
            }

            Log::info('✅ Enhanced Training Complete', [
                'url' => $url,
                'pages_trained' => count($results)
            ]);

            return [
                'success' => true,
                'trained_pages' => count($results),
                'results' => $results
            ];

        } catch (Exception $e) {
            Log::error('❌ Enhanced Training Error', [
                'url' => $url,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Enhanced single page training with better content extraction
     */
    protected function trainSinglePageEnhanced(string $url, array $options = []): ?KnowledgeBase
    {
        try {
            Log::info('📄 Processing single page', ['url' => $url]);

            // Fetch content with enhanced encoding support
            $rawContent = $this->fetchContentEnhanced($url);
            if (!$rawContent) {
                throw new Exception('Failed to fetch content from URL');
            }

            // Process content with enhanced extraction
            $processedData = $this->processContentEnhanced($rawContent, $url);

            // Validate content quality
            if (strlen($processedData['content']) < $this->config['min_content_length']) {
                Log::warning('⚠️ Content too short, skipping', [
                    'url' => $url,
                    'length' => strlen($processedData['content'])
                ]);
                throw new Exception('Content too short (min: ' . $this->config['min_content_length'] . ' chars)');
            }

            // Check for duplicates with improved logic
            $existing = $this->findExistingContent($url, $processedData);
            
            if ($existing) {
                Log::info('📝 Updating existing content', ['url' => $url]);
                return $this->updateKnowledgeEnhanced($existing, $processedData, $options);
            } else {
                Log::info('🆕 Creating new content', ['url' => $url]);
                return $this->createKnowledgeEnhanced($processedData, $url, $options);
            }

        } catch (Exception $e) {
            Log::error('Single page training error', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Enhanced full site training with unlimited depth and better crawling
     */
    protected function trainFullSiteEnhanced(string $url, array $options = [], ?callable $progress = null): array
    {
        $results = [];
        $processed = [];
        $queue = [['url' => $url, 'depth' => 0]];
        
        $maxDepth = $options['max_depth'] ?? $this->config['max_depth'];
        $maxPages = $options['max_pages'] ?? $this->config['max_pages'];
        
        $scopeParts = parse_url($url);
        $scopeHost = $scopeParts['host'] ?? '';
        $scopePath = rtrim($scopeParts['path'] ?? '/', '/');
        
        $shouldStop = $options['shouldStop'] ?? null;

        Log::info('🌐 Full site crawling started', [
            'base_url' => $url,
            'max_depth' => $maxDepth,
            'max_pages' => $maxPages,
            'scope' => $scopeHost . $scopePath
        ]);

        while (!empty($queue) && count($results) < $maxPages) {
            // Check if stop requested
            if (is_callable($shouldStop) && $shouldStop()) {
                Log::info('⏹️ Training stopped by user');
                if ($progress) $progress(100);
                break;
            }

            $current = array_shift($queue);
            $currentUrl = $current['url'];
            $depth = $current['depth'];

            // Skip if already processed
            if (in_array($currentUrl, $processed)) {
                continue;
            }
            $processed[] = $currentUrl;

            try {
                // Process this page
                Log::info('🔍 Crawling page', [
                    'url' => $currentUrl,
                    'depth' => $depth,
                    'processed' => count($processed),
                    'results' => count($results)
                ]);

                // Update progress
                if ($progress) {
                    $percent = min(95, floor((count($processed) / max(count($processed) + count($queue), 1)) * 100));
                    $progress($percent);
                }

                // Train this page
                $pageResult = $this->trainSinglePageForCrawl($currentUrl, $options);
                if ($pageResult) {
                    $results[] = $pageResult;
                    Log::info('✅ Page added to knowledge base', [
                        'url' => $currentUrl,
                        'title' => $pageResult->title
                    ]);
                }

                // Extract links if not at max depth
                if ($depth < $maxDepth) {
                    $links = $this->extractLinksEnhanced($currentUrl);
                    
                    // Filter links to stay within scope
                    $filtered = $this->filterLinksInScope($links, $scopeHost, $scopePath, $processed);
                    
                    Log::info('🔗 Links found', [
                        'url' => $currentUrl,
                        'total_links' => count($links),
                        'filtered' => count($filtered),
                        'depth' => $depth
                    ]);

                    // Add to queue
                    foreach ($filtered as $link) {
                        $queue[] = ['url' => $link, 'depth' => $depth + 1];
                    }
                }

                // Rate limiting
                usleep($this->config['crawl_delay']);

            } catch (Exception $e) {
                Log::warning('Page crawl error', [
                    'url' => $currentUrl,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        if ($progress) $progress(100);

        Log::info('🎯 Full site crawling complete', [
            'total_results' => count($results),
            'processed_urls' => count($processed)
        ]);

        return $results;
    }

    /**
     * Enhanced content fetching with multiple methods and better encoding
     */
    protected function fetchContentEnhanced(string $url): ?string
    {
        // Try cURL first (most reliable)
        $content = $this->fetchWithCurlEnhanced($url);
        if ($content) return $content;

        // Try file_get_contents
        $content = $this->fetchWithFileGetContentsEnhanced($url);
        if ($content) return $content;

        // Try Guzzle if available
        if (class_exists('GuzzleHttp\\Client')) {
            $content = $this->fetchWithGuzzle($url);
            if ($content) return $content;
        }

        return null;
    }

    /**
     * Enhanced cURL fetching with better headers and encoding support
     */
    protected function fetchWithCurlEnhanced(string $url): ?string
    {
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_TIMEOUT => $this->config['timeout'],
                CURLOPT_CONNECTTIMEOUT => 60,
                CURLOPT_MAXREDIRS => $this->config['max_redirects'],
                CURLOPT_ENCODING => '', // Auto decode gzip/deflate
                CURLOPT_USERAGENT => $this->config['user_agent'],
                CURLOPT_HTTPHEADER => [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language: ' . $this->config['accept_languages'],
                    'Accept-Encoding: gzip, deflate, br',
                    // Do NOT send Accept-Charset to avoid server-side lossy conversions
                    'DNT: 1',
                    'Connection: keep-alive',
                    'Upgrade-Insecure-Requests: 1',
                    'Sec-Fetch-Dest: document',
                    'Sec-Fetch-Mode: navigate',
                    'Sec-Fetch-Site: none',
                    'Cache-Control: max-age=0'
                ],
                CURLOPT_FRESH_CONNECT => false,
                CURLOPT_FORBID_REUSE => false,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1
            ]);

            $content = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            curl_close($ch);

            if ($content && $httpCode >= 200 && $httpCode < 400 && empty($error)) {
                // If response declares non-UTF-8 charset, test-convert but choose the better variant by AZ score
                if (!empty($contentType) && preg_match('/charset=([\w\-]+)/i', (string)$contentType, $m)) {
                    $respCharset = strtoupper(trim($m[1]));
                    if ($respCharset && $respCharset !== 'UTF-8') {
                        $converted = @mb_convert_encoding($content, 'UTF-8', $respCharset);
                        if ($converted) {
                            $content = $this->chooseBestByAzerbaijaniScore($content, $converted);
                        }
                    }
                }
                // Check if content is HTML/Text
                if (stripos((string)$contentType, 'text/html') !== false || 
                    stripos((string)$contentType, 'text/plain') !== false ||
                    stripos((string)$contentType, 'application/xhtml') !== false) {
                    
                    Log::info('✅ Content fetched with cURL', [
                        'url' => $url,
                        'effective_url' => $effectiveUrl,
                        'http_code' => $httpCode,
                        'content_type' => $contentType,
                        'size' => strlen($content)
                    ]);
                    return $content;
                } else {
                    Log::warning('⚠️ Non-HTML content type', [
                        'url' => $url,
                        'content_type' => $contentType
                    ]);
                }
            } else {
                Log::warning('⚠️ cURL fetch failed', [
                    'url' => $url,
                    'http_code' => $httpCode,
                    'error' => $error
                ]);
            }
        } catch (Exception $e) {
            Log::error('cURL exception', ['url' => $url, 'error' => $e->getMessage()]);
        }
        
        return null;
    }

    /**
     * Enhanced file_get_contents with better error handling
     */
    protected function fetchWithFileGetContentsEnhanced(string $url): ?string
    {
        try {
            if (!ini_get('allow_url_fopen')) {
                return null;
            }

            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => implode("\r\n", [
                        'User-Agent: ' . $this->config['user_agent'],
                        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language: ' . $this->config['accept_languages'],
                        'Connection: close'
                    ]),
                    'timeout' => $this->config['timeout'],
                    'follow_location' => 1,
                    'max_redirects' => $this->config['max_redirects'],
                    'ignore_errors' => true
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);

            $content = @file_get_contents($url, false, $context);
            
            if ($content) {
                Log::info('✅ Content fetched with file_get_contents', [
                    'url' => $url,
                    'size' => strlen($content)
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
     * Guzzle fetching method
     */
    protected function fetchWithGuzzle(string $url): ?string
    {
        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => $this->config['timeout'],
                'connect_timeout' => 30,
                'verify' => false,
                'allow_redirects' => [
                    'max' => $this->config['max_redirects'],
                    'strict' => false,
                    'referer' => true,
                    'protocols' => ['http', 'https']
                ]
            ]);

            $response = $client->get($url, [
                'headers' => [
                    'User-Agent' => $this->config['user_agent'],
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => $this->config['accept_languages'],
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
                Log::info('✅ Content fetched with Guzzle', [
                    'url' => $url,
                    'status' => $response->getStatusCode(),
                    'size' => strlen($content)
                ]);
                return $content;
            }
        } catch (Exception $e) {
            Log::warning('Guzzle exception', ['url' => $url, 'error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Enhanced content processing with better extraction and encoding
     */
    protected function processContentEnhanced(string $rawContent, string $url): array
    {
        // Fix encoding issues first
        $content = $this->fixEncodingEnhanced($rawContent);
        
        // Extract clean text with enhanced method
        $cleanContent = $this->extractCleanTextEnhanced($content);
        
        // Ensure valid UTF-8 after extraction
        $cleanContent = $this->ensureValidUTF8Enhanced($cleanContent);
        // Run mojibake fix once more on extracted text (some pages still leak sequences)
        $cleanContent = $this->fixAzerbaijaniMojibake($cleanContent);
        $cleanContent = $this->ensureValidUTF8Enhanced($cleanContent);

        // Enforce max content length to prevent memory issues downstream
        $maxLen = (int)($this->config['max_content_length'] ?? 500000);
        if ($maxLen > 0 && mb_strlen($cleanContent) > $maxLen) {
            $cleanContent = mb_substr($cleanContent, 0, $maxLen);
            \Log::info('Content truncated to max_content_length', ['len' => $maxLen]);
        }
        
        // Extract title
        $title = $this->extractTitleEnhanced($content, $url);
        $title = $this->ensureValidUTF8Enhanced($title);
        // Apply mojibake fixes to titles as well
        $title = $this->fixAzerbaijaniMojibake($title);
        $title = $this->ensureValidUTF8Enhanced($title);
        
        // Extract metadata
        $metadata = $this->extractMetadataEnhanced($content, $url);
        // Ensure metadata values are valid UTF-8
        array_walk_recursive($metadata, function (&$v) {
            if (is_string($v)) {
                $v = $this->ensureValidUTF8Enhanced($v);
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
     * Enhanced encoding fixing specifically for Azerbaijani content
     */
    protected function fixEncodingEnhanced(string $content): string
    {
        // Quick UTF-8 validity check
        $isUtf8 = mb_check_encoding($content, 'UTF-8');
        
        // Detect declared charset in HTML
        $declaredCharset = null;
        if (preg_match('/<meta[^>]+charset=["\'\\s]*([^"\'\\s>]+)/i', $content, $matches)) {
            $declaredCharset = strtoupper(trim($matches[1]));
            Log::info('HTML charset detected', ['charset' => $declaredCharset]);
        }

        // Common Azerbaijani/Turkish encodings
        $encodings = ['UTF-8', 'Windows-1254', 'ISO-8859-9', 'CP1254', 'Windows-1252', 'ISO-8859-1', 'UTF-16', 'UTF-16LE', 'UTF-16BE'];
        
        // Add declared charset to priority if exists
        if ($declaredCharset && !in_array($declaredCharset, $encodings)) {
            array_unshift($encodings, $declaredCharset);
        }

        // Detect current encoding
        $detected = mb_detect_encoding($content, $encodings, true);
        
        // Check for Azerbaijani characters
        $hasAzChars = preg_match('/[əƏçÇğĞıIiİöÖşŞüÜ]/u', $content);
        $hasMojibake = preg_match('/(Ã|ÅŸ|ÅŽ|Åž|Ä±|É™|Ã¶|Ã§|Ã¼|Ãœ|Ã–|Ã‡|ÄŸ|Ä°)/u', $content);
        
        Log::info('🔤 Encoding analysis', [
            'detected' => $detected,
            'declared' => $declaredCharset,
            'has_az_chars' => $hasAzChars,
            'has_mojibake' => $hasMojibake
        ]);

        // Fix mojibake patterns
        if ($hasMojibake) {
            // Try professional double-encoding fix first (utf8_decode + iconv Windows-1254)
            if (function_exists('utf8_decode') && function_exists('iconv')) {
                $decoded = @utf8_decode($content); // UTF-8 -> ISO-8859-1 bytes
                $fixed = @iconv('Windows-1254', 'UTF-8//IGNORE', $decoded);
                if ($fixed && mb_check_encoding($fixed, 'UTF-8')) {
                    $content = $fixed;
                }
            }
            // Apply direct pattern fixes as well
            $content = $this->fixAzerbaijaniMojibake($content);
        }

        // Convert to UTF-8 if needed (only when current content is NOT valid UTF-8)
        if (!$isUtf8 && $detected && $detected !== 'UTF-8') {
            $converted = @mb_convert_encoding($content, 'UTF-8', $detected);
            if ($converted && mb_check_encoding($converted, 'UTF-8')) {
                Log::info('✅ Encoding converted', ['from' => $detected, 'to' => 'UTF-8']);
                return $converted;
            }
        }

        // Try Turkish/Azerbaijani specific encodings
        if (!$hasAzChars || $hasMojibake) {
            foreach (['Windows-1254', 'ISO-8859-9', 'CP1254'] as $encoding) {
                $test = @mb_convert_encoding($content, 'UTF-8', $encoding);
                if ($test && mb_check_encoding($test, 'UTF-8')) {
                    $azScore = preg_match_all('/[əƏçÇğĞıIiİöÖşŞüÜ]/u', $test);
                    if ($azScore > 5) {
                        Log::info('✅ Fixed with Turkish encoding', [
                            'encoding' => $encoding,
                            'az_chars' => $azScore
                        ]);
                        return $test;
                    }
                }
            }
        }

        // Final cleanup
        return $this->ensureValidUTF8Enhanced($content);
    }

    /**
     * Fix common Azerbaijani mojibake patterns
     */
    protected function fixAzerbaijaniMojibake(string $content): string
    {
        $replacements = [
            // Common mojibake patterns for Azerbaijani
            'Ã¶' => 'ö',
            'Ã§' => 'ç', 
            'Ã¼' => 'ü',
            'Ä±' => 'ı',
'ÅŸ' => 'ş',
            'ÄŸ' => 'ğ',
            'Ä°' => 'İ',
            'Ã‡' => 'Ç',
            'Ã–' => 'Ö',
            'Ãœ' => 'Ü',
            'Åž' => 'Ş',
            'Äž' => 'Ğ',
            'É™' => 'ə',
            'Æ' => 'Ə',
            
            // Double encoded patterns
            'Ã¤' => 'ə',
            'Ã„Ÿ' => 'ğ',
            'Ã„±' => 'ı',
            
            // Remove replacement characters
            '�' => '',
            '□' => '',
            '■' => '',
            "\xEF\xBF\xBD" => ''
        ];

        $fixed = str_replace(array_keys($replacements), array_values($replacements), $content);
        
        // Additional cleanup only: remove control chars
        $fixed = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $fixed); // Remove control chars
        
        return $fixed;
    }

    /**
     * Enhanced text extraction with better content detection
     */
    protected function extractCleanTextEnhanced(string $html): string
    {
        try {
            // Create DOM document
            $dom = new DOMDocument();
            $oldErrorReporting = libxml_use_internal_errors(true);

            // Convert UTF-8 to HTML entities to help DOMDocument preserve non-ASCII (ə, ı, ş)
            $htmlEntities = @mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
            if (!$htmlEntities) { $htmlEntities = $html; }
            @$dom->loadHTML($htmlEntities, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            
            $xpath = new DOMXPath($dom);
            
            // Remove unwanted elements
            $unwantedTags = ['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'video', 'audio'];
            foreach ($unwantedTags as $tag) {
                $elements = $dom->getElementsByTagName($tag);
                $toRemove = [];
                foreach ($elements as $element) {
                    $toRemove[] = $element;
                }
                foreach ($toRemove as $element) {
                    if ($element->parentNode) {
                        $element->parentNode->removeChild($element);
                    }
                }
            }

            // Remove navigation, headers, footers, ads
            $unwantedSelectors = [
                '//*[@id="header" or @class="header" or contains(@class, "header-")]',
                '//*[@id="footer" or @class="footer" or contains(@class, "footer-")]',
                '//*[@id="nav" or @class="nav" or contains(@class, "nav-")]',
                '//*[@id="menu" or @class="menu" or contains(@class, "menu-")]',
                '//*[@id="sidebar" or @class="sidebar" or contains(@class, "sidebar-")]',
                '//*[contains(@class, "advertisement") or contains(@class, "ads")]',
                '//*[contains(@class, "cookie") or contains(@class, "consent")]',
                '//*[contains(@class, "popup") or contains(@class, "modal")]',
                '//*[@role="navigation" or @role="banner" or @role="contentinfo"]',
            ];

            foreach ($unwantedSelectors as $selector) {
                $elements = @$xpath->query($selector);
                if ($elements) {
                    foreach ($elements as $element) {
                        if ($element && $element->parentNode) {
                            $element->parentNode->removeChild($element);
                        }
                    }
                }
            }

            // Find main content area
            $contentSelectors = [
                '//main',
                '//article',
                '//*[@class="content" or @id="content"]',
                '//*[@class="main-content" or @id="main-content"]',
                '//*[@class="entry-content" or @id="entry-content"]',
                '//*[@class="post-content" or @id="post-content"]',
                '//*[@class="article-content" or @id="article-content"]',
                '//*[@class="page-content" or @id="page-content"]',
                '//*[@class="container" and not(@id="header") and not(@id="footer")]',
                '//*[@role="main"]',
                '//body'
            ];

            $mainContent = '';
            foreach ($contentSelectors as $selector) {
                $elements = @$xpath->query($selector);
                if ($elements && $elements->length > 0) {
                    // Get text content from all matching elements
                    foreach ($elements as $element) {
                        $text = $this->extractTextFromNode($element);
                        if (strlen($text) > strlen($mainContent)) {
                            $mainContent = $text;
                        }
                    }
                    if (strlen($mainContent) > 100) {
                        break; // Found good content
                    }
                }
            }

            // Fallback to body if no content found
            if (empty($mainContent)) {
                $body = $dom->getElementsByTagName('body');
                if ($body->length > 0) {
                    $mainContent = $this->extractTextFromNode($body->item(0));
                }
            }

            libxml_use_internal_errors($oldErrorReporting);
            
            // Clean and format text
            $mainContent = html_entity_decode($mainContent, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Remove language selector lines (common on this site)
            $mainContent = preg_replace('/\bEnglish\b\s+\b(Azərbaycan|Azerbaycan)\b\s+\bTürkçe\b\s+\bFrançais\b.*$/imu', '', $mainContent);
            // Remove lines that are purely Arabic-script (menu languages like فارسی اردو)
            $mainContent = preg_replace('/^\s*[\p{Arabic}\s]+$/mu', '', $mainContent);
            $mainContent = preg_replace('/\s+/', ' ', $mainContent);
            $mainContent = preg_replace('/\n\s*\n\s*\n/', "\n\n", $mainContent);
            $mainContent = trim($mainContent);

            return $mainContent;

        } catch (Exception $e) {
            Log::warning('DOM processing failed, using fallback', [
                'error' => $e->getMessage()
            ]);
            
            // Fallback: simple regex cleaning
            $text = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
            $text = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $text);
            $text = strip_tags($text);
            $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $text = preg_replace('/\s+/', ' ', $text);
            return trim($text);
        }
    }

    /**
     * Recursively extract text from DOM node
     */
    protected function extractTextFromNode(\DOMNode $node): string
    {
        $text = '';
        
        if ($node->nodeType === XML_TEXT_NODE) {
            $text .= $node->nodeValue . ' ';
        } elseif ($node->nodeType === XML_ELEMENT_NODE) {
            // Add spacing for block elements
            $blockElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'br'];
            if (in_array(strtolower($node->nodeName), $blockElements)) {
                $text .= "\n";
            }
            
            // Recursively get text from children
            foreach ($node->childNodes as $child) {
                $text .= $this->extractTextFromNode($child);
            }
            
            if (in_array(strtolower($node->nodeName), $blockElements)) {
                $text .= "\n";
            }
        }
        
        return $text;
    }

    /**
     * Enhanced title extraction
     */
    protected function extractTitleEnhanced(string $html, string $url): string
    {
        // Try multiple sources for title
        $title = '';
        
        // 1. <title> tag
        if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $matches)) {
            $title = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // 2. og:title meta tag
        if (empty($title) && preg_match('/<meta[^>]+property=["\']\s*og:title["\']\s*content=["\'](.*?)["\']/i', $html, $matches)) {
            $title = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // 3. First H1
        if (empty($title) && preg_match('/<h1[^>]*>(.*?)<\/h1>/i', $html, $matches)) {
            $title = trim(strip_tags($matches[1]));
            $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        
        // Clean title
        if (!empty($title)) {
            // Remove site name suffixes
            $title = preg_replace('/\s*[\|\-–—:]\s*[^|\-–—:]+$/', '', $title);
            $title = preg_replace('/\s+/', ' ', $title);
            $title = trim($title);
            
            if (strlen($title) > 5 && strlen($title) <= 300) {
                return $title;
            }
        }
        
        // Fallback to URL-based title
        $host = parse_url($url, PHP_URL_HOST);
        $path = parse_url($url, PHP_URL_PATH);
        
        if ($path && $path !== '/') {
            $pathParts = explode('/', trim($path, '/'));
            $lastPart = end($pathParts);
            $lastPart = str_replace(['-', '_', '.html', '.htm', '.php'], ' ', $lastPart);
            return ucwords(trim($lastPart)) . ' - ' . $host;
        }
        
        return 'Page from ' . $host;
    }

    /**
     * Enhanced metadata extraction
     */
    protected function extractMetadataEnhanced(string $html, string $url): array
    {
        $metadata = [
            'url' => $url,
            'extracted_at' => now()->toISOString(),
            'host' => parse_url($url, PHP_URL_HOST),
            'encoding_method' => 'enhanced'
        ];
        
        // Description
        if (preg_match('/<meta[^>]+name=["\']\s*description["\']\s*content=["\'](.*?)["\']/i', $html, $matches)) {
            $metadata['description'] = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // Keywords
        if (preg_match('/<meta[^>]+name=["\']\s*keywords["\']\s*content=["\'](.*?)["\']/i', $html, $matches)) {
            $keywords = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $metadata['keywords'] = preg_replace('/\s+/', ' ', $keywords);
        }
        
        // Author
        if (preg_match('/<meta[^>]+name=["\']\s*author["\']\s*content=["\'](.*?)["\']/i', $html, $matches)) {
            $metadata['author'] = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        
        // Language
        if (preg_match('/<html[^>]+lang=["\']([\w\-]+)["\']/i', $html, $matches)) {
            $metadata['language'] = strtolower(trim($matches[1]));
        } elseif (preg_match('/<meta[^>]+name=["\']\s*language["\']\s*content=["\']([\w\-]+)["\']/i', $html, $matches)) {
            $metadata['language'] = strtolower(trim($matches[1]));
        }
        
        // Published date
        if (preg_match('/<meta[^>]+property=["\']\s*article:published_time["\']\s*content=["\'](.*?)["\']/i', $html, $matches)) {
            $metadata['published_at'] = trim($matches[1]);
        }
        
        return $metadata;
    }

    /**
     * Enhanced UTF-8 validation and cleaning
     */
    protected function ensureValidUTF8Enhanced(string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // Remove ASCII control characters; keep C1 for now to avoid dropping mis-encoded letters prematurely
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        
        // Remove replacement/box characters
        $text = str_replace(['�', '□', '■', "\xEF\xBF\xBD"], '', $text);

        // If already valid UTF-8, do light cleanup only
        if (mb_check_encoding($text, 'UTF-8')) {
            $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $text) ?: $text;
            $cleaned = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $cleaned); // zero-width
            // Do NOT strip combining marks to avoid losing accents
            $cleaned = str_replace(['Â«','Â»'], ['«','»'], $cleaned);
            $cleaned = str_replace('Â', '', $cleaned);
            $cleaned = preg_replace('/[\x{0080}-\x{009F}]/u', '', $cleaned);
            return $cleaned;
        }

        // Build candidates: UTF-8 ignore and single-byte conversions
        $candidates = [];
        $utf8Ignored = @iconv('UTF-8', 'UTF-8//IGNORE', $text);
        if ($utf8Ignored !== false && mb_check_encoding($utf8Ignored, 'UTF-8')) {
            $candidates['UTF8_IGNORE'] = $utf8Ignored;
        }
        $encodings = ['Windows-1254', 'CP1254', 'ISO-8859-9', 'Windows-1252', 'ISO-8859-1'];
        foreach ($encodings as $from) {
            $conv = @mb_convert_encoding($text, 'UTF-8', $from);
            if ($conv && mb_check_encoding($conv, 'UTF-8')) {
                $candidates[$from] = $conv;
            }
        }

        $best = null; $bestKey = null; $bestScore = -PHP_INT_MAX; $origLen = strlen($text);
        foreach ($candidates as $key => $variant) {
            $variant = @iconv('UTF-8', 'UTF-8//IGNORE', $variant) ?: $variant;
            $az = preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $variant);
            $moji = preg_match_all('/(Ã|Å|Ä|Â|É™)/u', $variant);
            $len = strlen($variant);
            $lossPenalty = max(0, $origLen - $len) / 50.0;
            $score = ($az * 10) - ($moji * 5) - $lossPenalty;
            if ($score > $bestScore) { $bestScore = $score; $best = $variant; $bestKey = $key; }
        }

        if ($best !== null) {
            $best = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $best);
            $best = str_replace(['Â«','Â»'], ['«','»'], $best);
            $best = str_replace('Â', '', $best);
            $best = preg_replace('/[\x{0080}-\x{009F}]/u', '', $best);
Log::info('✅ ensureValidUTF8Enhanced: variant selected', ['by' => $bestKey, 'az_chars' => preg_match_all('/[əçğıöşüÇĞIÖŞÜƏ]/u', $best)]);
            return $best;
        }

        // Fallback: minimal cleanup
        $fallback = @mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        $fallback = @iconv('UTF-8', 'UTF-8//IGNORE', $fallback) ?: $fallback;
        $fallback = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $fallback);
        $fallback = str_replace(['Â«','Â»'], ['«','»'], $fallback);
        $fallback = str_replace('Â', '', $fallback);
        $fallback = preg_replace('/[\x{0080}-\x{009F}]/u', '', $fallback);
Log::warning('⚠️ ensureValidUTF8Enhanced: fallback used');
        return $fallback ?: '';
    }

    /**
     * Choose the variant which better preserves Azerbaijani characters
     */
    protected function chooseBestByAzerbaijaniScore(string $original, string $converted): string
    {
        $scoreOrig = $this->azerbaijaniScore($original);
        $scoreConv = $this->azerbaijaniScore($converted);
        // Prefer higher Azerbaijani char count; on tie, prefer fewer mojibake markers
        if ($scoreConv['az'] > $scoreOrig['az']) {
            return $converted;
        }
        if ($scoreConv['az'] === $scoreOrig['az'] && $scoreConv['moji'] < $scoreOrig['moji']) {
            return $converted;
        }
        return $original;
    }

    protected function azerbaijaniScore(string $text): array
    {
        $az = preg_match_all('/[əƏçÇğĞıİöÖşŞüÜ]/u', $text, $m1);
        $moji = preg_match_all('/(Ã|Å|Ä|Â|É™)/u', $text, $m2);
        return ['az' => (int)$az, 'moji' => (int)$moji];
    }

    /**
     * Enhanced link extraction
     */
    protected function extractLinksEnhanced(string $url): array
    {
        $links = [];
        
        try {
            // Fetch the page content
            $content = $this->fetchContentEnhanced($url);
            if (!$content) {
                return $links;
            }

            // Parse base URL
            $urlParts = parse_url($url);
            $scheme = $urlParts['scheme'] ?? 'http';
            $host = $urlParts['host'] ?? '';
            $basePath = dirname($urlParts['path'] ?? '/');
            if ($basePath === '.') $basePath = '/';
            
            // Extract all href attributes
            preg_match_all('/<a[^>]+href=["\'](.*?)["\']/i', $content, $matches);
            
            foreach ($matches[1] as $link) {
                // Clean the link
                $link = trim($link);
                if (empty($link) || $link === '#' || strpos($link, 'javascript:') === 0 || strpos($link, 'mailto:') === 0) {
                    continue;
                }
                
                // Convert relative URLs to absolute
                if (strpos($link, 'http://') !== 0 && strpos($link, 'https://') !== 0) {
                    if (strpos($link, '//') === 0) {
                        // Protocol-relative URL
                        $link = $scheme . ':' . $link;
                    } elseif (strpos($link, '/') === 0) {
                        // Root-relative URL
                        $link = $scheme . '://' . $host . $link;
                    } else {
                        // Path-relative URL
                        $link = $scheme . '://' . $host . $basePath . '/' . $link;
                    }
                }
                
                // Clean up the URL
                $link = str_replace('//', '/', str_replace('://', '://TEMP', $link));
                $link = str_replace('://TEMP', '://', $link);
                
                // Remove fragments
                if (strpos($link, '#') !== false) {
                    $link = substr($link, 0, strpos($link, '#'));
                }
                
                // Remove query strings (optional, depends on requirements)
                // if (strpos($link, '?') !== false) {
                //     $link = substr($link, 0, strpos($link, '?'));
                // }
                
                // Add to links array if valid
                if (filter_var($link, FILTER_VALIDATE_URL)) {
                    $links[] = $link;
                }
            }
            
            // Remove duplicates
            $links = array_unique($links);
            
        } catch (Exception $e) {
            Log::warning('Link extraction error', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
        }
        
        return $links;
    }

    /**
     * Filter links to stay within scope
     */
    protected function filterLinksInScope(array $links, string $scopeHost, string $scopePath, array $processed): array
    {
        $filtered = [];
        
        foreach ($links as $link) {
            // Skip if already processed
            if (in_array($link, $processed)) {
                continue;
            }
            
            $linkParts = parse_url($link);
            $linkHost = $linkParts['host'] ?? '';
            $linkPath = $linkParts['path'] ?? '/';
            
            // Check if same host
            if (strcasecmp($linkHost, $scopeHost) !== 0) {
                continue;
            }
            
            // Check if within scope path
            if (!empty($scopePath) && $scopePath !== '/') {
                if (strpos($linkPath, $scopePath) !== 0) {
                    continue;
                }
            }
            
            $filtered[] = $link;
        }
        
        return $filtered;
    }

    /**
     * Find existing content with better duplicate detection
     */
    protected function findExistingContent(string $url, array $processedData): ?KnowledgeBase
    {
        // Check by URL first
        $existing = KnowledgeBase::where('source_url', $url)->first();
        if ($existing) {
            return $existing;
        }
        
        // Check by title similarity (avoid near-duplicates)
        $similar = KnowledgeBase::where('title', 'LIKE', '%' . substr($processedData['title'], 0, 50) . '%')
            ->first();
        if ($similar) {
            // Calculate similarity
            similar_text($similar->content, $processedData['content'], $percent);
            if ($percent > 80) {
                Log::info('Found similar content', [
                    'url' => $url,
                    'existing_id' => $similar->id,
                    'similarity' => $percent
                ]);
                return $similar;
            }
        }
        
        return null;
    }

    /**
     * Train single page for crawling (simplified version for multi-page context)
     */
    protected function trainSinglePageForCrawl(string $url, array $options): ?KnowledgeBase
    {
        try {
            // Use the enhanced single page training but with crawl-specific options
            $options['skip_duplicate_check'] = false; // Allow updating during crawl
            $options['min_content_length'] = 50; // Lower threshold for crawled pages
            
            return $this->trainSinglePageEnhanced($url, $options);
        } catch (Exception $e) {
            Log::warning('Crawl page training failed', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Create knowledge base entry with enhanced data
     */
    protected function createKnowledgeEnhanced(array $data, string $url, array $options): KnowledgeBase
    {
        $kb = KnowledgeBase::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'source_url' => $url,
            'source' => $options['source'] ?? 'Enhanced URL Import',
            'category' => $options['category'] ?? 'imported',
            'author' => $data['metadata']['author'] ?? null,
            'language' => $data['metadata']['language'] ?? 'az',
            'metadata' => array_merge($data['metadata'], [
                'training_method' => 'enhanced_training_service',
                'training_mode' => $options['single'] ?? true ? 'single' : 'full_site',
                'encoding_fixed' => true,
                'content_quality' => $this->assessContentQuality($data['content']),
                'imported_at' => now()->toISOString(),
                'version' => '2.0'
            ]),
            'is_active' => true
        ]);
        
        // Generate and store embeddings
        try {
            if ($this->embedding) {
                $kb->embedding = json_encode($this->embedding->embed($data['content']));
                $kb->save();
                Log::info('✅ Embeddings generated', ['id' => $kb->id]);
            }
        } catch (\Throwable $e) {
            Log::warning('⚠️ Embedding generation failed', [
                'id' => $kb->id,
                'error' => $e->getMessage()
            ]);
        }
        
        return $kb;
    }

    /**
     * Update existing knowledge base entry
     */
    protected function updateKnowledgeEnhanced(KnowledgeBase $existing, array $data, array $options): KnowledgeBase
    {
        $existing->update([
            'title' => $data['title'],
            'content' => $data['content'],
            'metadata' => array_merge($existing->metadata ?? [], $data['metadata'], [
                'last_updated_at' => now()->toISOString(),
                'update_count' => ($existing->metadata['update_count'] ?? 0) + 1,
                'training_method' => 'enhanced_training_service',
                'version' => '2.0'
            ])
        ]);
        
        // Regenerate embeddings
        try {
            if ($this->embedding) {
                $existing->embedding = json_encode($this->embedding->embed($data['content']));
                $existing->save();
                Log::info('✅ Embeddings updated', ['id' => $existing->id]);
            }
        } catch (\Throwable $e) {
            Log::warning('⚠️ Embedding update failed', [
                'id' => $existing->id,
                'error' => $e->getMessage()
            ]);
        }
        
        return $existing->fresh();
    }

    /**
     * Assess content quality
     */
    protected function assessContentQuality(string $content): string
    {
        $length = strlen($content);
        $wordCount = str_word_count($content);
        
        // Check for Azerbaijani content
        $azScore = preg_match_all('/[əƏçÇğĞıIiİöÖşŞüÜ]/u', $content);
        
        // Quality scoring
        if ($length < 200 || $wordCount < 30) {
            return 'poor';
        } elseif ($length < 500 || $wordCount < 75) {
            return 'low';
        } elseif ($length < 2000 || $wordCount < 300) {
            return 'medium';
        } elseif ($length < 5000 || $wordCount < 750) {
            return 'high';
        } else {
            return 'excellent';
        }
    }
}