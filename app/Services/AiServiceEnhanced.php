<?php

namespace App\Services;

use App\Models\KnowledgeBase;
use App\Models\Settings;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

/**
 * Enhanced AI Service with intelligent query understanding
 * Fixes the issue where "Salam dəstəmaz necə alınır?" doesn't work
 */
class AiServiceEnhanced extends AiService
{
    /**
     * Enhanced keyword extraction with AI-powered understanding
     * Removes greeting words and focuses on the actual question
     */
    protected function extractSmartKeywords(string $query): array
    {
        $originalQuery = $query;
        
        // Normalize and clean the query
        $query = trim(preg_replace('/\s+/u', ' ', mb_strtolower($query, 'UTF-8')));
        
        // Remove common greeting/filler words first
        $greetings = [
            'salam', 'aleykum', 'əleykum', 'salam aleykum', 'əssəlamun əleykum',
            'hörmətli', 'əziz', 'dostum', 'qardaş', 'bacı', 'xanım', 'cənab',
            'zəhmət olmasa', 'xahiş edirəm', 'xaiş', 'lütfən', 'buyurun',
            'mənə', 'bizə', 'ona', 'sənə', 'sizə', 'bunun', 'onun',
            'deyin', 'deyə bilərsiniz', 'bilərsiniz', 'olar',
            'bir', 'bu', 'o', 'nə', 'kim', 'harada', 'niyə', 'nə üçün',
            'sual', 'soruşuram', 'öyrənmək istəyirəm', 'bilmək istəyirəm',
            'cavab verin', 'izah edin', 'göstərin', 'kömək edin',
            'var', 'yox', 'bəli', 'xeyr', 'hə', 'yox',
        ];
        
        // Remove greetings from query
        $cleanQuery = $query;
        foreach ($greetings as $greeting) {
            $cleanQuery = preg_replace('/\b' . preg_quote($greeting, '/') . '\b/u', '', $cleanQuery);
        }
        $cleanQuery = trim(preg_replace('/\s+/u', ' ', $cleanQuery));
        
        // If query became too short after cleaning, use original
        if (strlen($cleanQuery) < 3) {
            $cleanQuery = $query;
        }
        
        // Extract meaningful words
        $matches = [];
        preg_match_all('/\p{L}{2,}/u', $cleanQuery, $matches);
        $tokens = $matches[0] ?? [];
        
        // Enhanced stopwords list for Azerbaijani
        $stopwords = [
            // Azerbaijani specific
            'və', 'və ya', 'ki', 'da', 'də', 'ilə', 'üçün', 'bu', 'o', 
            'bir', 'iki', 'üç', 'dörd', 'beş',
            'necə', 'nə', 'niyə', 'harada', 'kim', 'nə vaxt', 'hansı',
            'etmək', 'olmaq', 'var', 'yox', 'edir', 'edirəm', 'edirsən',
            'istəyirəm', 'istəyirsən', 'bilirəm', 'bilirsən',
            'ola', 'olur', 'olub', 'olacaq', 'idi', 'imiş',
            // Question words that are too generic
            'necədir', 'nədir', 'kimidir', 'hardadır',
            // Turkish/English common
            've', 'veya', 'için', 'ile', 'the', 'and', 'or', 'for', 'with',
            // Arabic/Persian particles
            'و', 'في', 'من', 'على', 'که', 'در', 'با', 'از'
        ];
        
        // Filter out stopwords and short words
        $keywords = array_filter($tokens, function($token) use ($stopwords) {
            return !in_array($token, $stopwords, true) && mb_strlen($token, 'UTF-8') >= 3;
        });
        
        // Priority keywords for Islamic terms
        $priorityTerms = [
            'dəstəmaz', 'qüsl', 'təyəmmüm', 'namaz', 'oruc', 'zəkat', 'həcc',
            'quran', 'surə', 'ayə', 'hədis', 'fiqh', 'şəriət', 'hökmü', 'hökm',
            'vacib', 'sünnət', 'müstəhəb', 'haram', 'halal', 'məkruh',
            'təharət', 'nəcasət', 'pak', 'murdar', 'su', 'qiblə'
        ];
        
        // Check for priority terms and put them first
        $finalKeywords = [];
        foreach ($keywords as $keyword) {
            foreach ($priorityTerms as $term) {
                if (mb_stripos($keyword, $term) !== false || mb_stripos($term, $keyword) !== false) {
                    $finalKeywords[] = $keyword;
                    break;
                }
            }
        }
        
        // Add remaining keywords
        foreach ($keywords as $keyword) {
            if (!in_array($keyword, $finalKeywords)) {
                $finalKeywords[] = $keyword;
            }
        }
        
        // If no keywords found, try to extract from original query
        if (empty($finalKeywords)) {
            // Last resort: get the longest words
            $allWords = explode(' ', $originalQuery);
            usort($allWords, function($a, $b) {
                return mb_strlen($b, 'UTF-8') <=> mb_strlen($a, 'UTF-8');
            });
            $finalKeywords = array_slice(array_filter($allWords, function($w) {
                return mb_strlen($w, 'UTF-8') >= 3;
            }), 0, 3);
        }
        
        // Expand keywords with common variations
        $expandedKeywords = [];
        foreach ($finalKeywords as $keyword) {
            $expandedKeywords[] = $keyword;
            
            // Add variations for common Islamic terms
            $variations = $this->getTermVariations($keyword);
            foreach ($variations as $variation) {
                if (!in_array($variation, $expandedKeywords)) {
                    $expandedKeywords[] = $variation;
                }
            }
        }
        
        Log::info('🧠 ENHANCED KEYWORD EXTRACTION', [
            'original_query' => $originalQuery,
            'cleaned_query' => $cleanQuery,
            'greetings_removed' => $query !== $cleanQuery,
            'keywords_found' => count($expandedKeywords),
            'keywords' => array_slice($expandedKeywords, 0, 10),
            'priority_matches' => array_intersect($expandedKeywords, $priorityTerms)
        ]);
        
        return array_unique($expandedKeywords);
    }
    
    /**
     * Get term variations for better matching
     */
    protected function getTermVariations(string $term): array
    {
        $variations = [];
        $term = mb_strtolower($term, 'UTF-8');
        
        $variationMap = [
            // Dəstəmaz variations
            'dəstəmaz' => ['destemaz', 'dəstəmaz', 'abdest', 'təharət'],
            'destemaz' => ['dəstəmaz', 'destemaz', 'abdest', 'təharət'],
            'abdest' => ['dəstəmaz', 'destemaz', 'abdest', 'təharət'],
            
            // Namaz variations  
            'namaz' => ['salat', 'salah', 'namaz', 'ibadət'],
            'salat' => ['namaz', 'salat', 'salah', 'ibadət'],
            
            // Oruc variations
            'oruc' => ['siyam', 'ruzə', 'oruc', 'oruclama'],
            'siyam' => ['oruc', 'siyam', 'ruzə'],
            
            // Qüsl variations
            'qüsl' => ['qusl', 'qüsl', 'böyük təharət', 'tam yuyunma'],
            'qusl' => ['qüsl', 'qusl', 'böyük təharət'],
            
            // Təyəmmüm variations
            'təyəmmüm' => ['teyemmum', 'təyəmmüm', 'torpaqla təharət'],
            'teyemmum' => ['təyəmmüm', 'teyemmum', 'torpaqla təharət'],
            
            // General variations
            'necə' => ['necə', 'nece', 'nasıl', 'kimi'],
            'almaq' => ['almaq', 'etmək', 'yerinə yetirmək'],
            'alınır' => ['alınır', 'edilir', 'yerinə yetirilir'],
        ];
        
        if (isset($variationMap[$term])) {
            $variations = $variationMap[$term];
        }
        
        // Add the original term
        $variations[] = $term;
        
        // Add common suffixes
        $suffixes = ['', 'ın', 'in', 'un', 'ün', 'nın', 'nin', 'nun', 'nün', 'ı', 'i', 'u', 'ü'];
        $baseTerm = $term;
        
        // Try to find base form
        foreach ($suffixes as $suffix) {
            if ($suffix && mb_substr($term, -mb_strlen($suffix)) === $suffix) {
                $baseTerm = mb_substr($term, 0, -mb_strlen($suffix));
                $variations[] = $baseTerm;
            }
        }
        
        return array_unique($variations);
    }
    
    /**
     * Override the main search method with enhanced understanding
     */
    protected function getUrlTrainedContent(string $query): string
    {
        try {
            // Use enhanced keyword extraction
            $keywords = $this->extractSmartKeywords($query);
            $exactPhrase = trim($query);
            
            // Also extract key concept (e.g., "dəstəmaz" from "salam dəstəmaz necə alınır?")
            $keyConcept = $this->extractKeyConcept($query);
            
            Log::info('🔍 ENHANCED URL SEARCH', [
                'original_query' => $query,
                'key_concept' => $keyConcept,
                'smart_keywords' => array_slice($keywords, 0, 5),
                'exact_phrase' => $exactPhrase
            ]);
            
            // Search strategy with key concept priority
            $urlKnowledge = KnowledgeBase::where('is_active', true)
                ->whereNotNull('source_url')
                ->where('source_url', '!=', '')
                ->where(function ($q) use ($keyConcept, $keywords, $exactPhrase) {
                    // TIER 1: Key concept match (highest priority)
                    if ($keyConcept) {
                        $q->where(function($concept) use ($keyConcept) {
                            $concept->where('title', 'LIKE', "%{$keyConcept}%")
                                   ->orWhere('content', 'LIKE', "%{$keyConcept}%");
                        });
                    }
                    
                    // TIER 2: Important keywords
                    foreach (array_slice($keywords, 0, 3) as $keyword) {
                        $q->orWhere(function($kw) use ($keyword) {
                            $kw->where('title', 'LIKE', "%{$keyword}%")
                               ->orWhere('content', 'LIKE', "%{$keyword}%");
                        });
                    }
                    
                    // TIER 3: Any keyword match
                    foreach ($keywords as $keyword) {
                        $q->orWhere('title', 'LIKE', "%{$keyword}%")
                          ->orWhere('content', 'LIKE', "%{$keyword}%");
                    }
                })
                ->orderByRaw('CASE 
                    WHEN title LIKE ? THEN 1 
                    WHEN content LIKE ? THEN 2
                    ELSE 3 END', 
                    ["%{$keyConcept}%", "%{$keyConcept}%"])
                ->limit(3)
                ->get();
            
            Log::info('URL SEARCH RESULTS', [
                'found_items' => $urlKnowledge->count(),
                'titles' => $urlKnowledge->pluck('title')->toArray()
            ]);
            
            if ($urlKnowledge->isEmpty()) {
                return '';
            }
            
            $context = "URL TRAİNİNG MƏLUMATLARI (PRIORITET 1):\n\n";
            foreach ($urlKnowledge as $item) {
                $context .= "BAŞLIQ: {$item->title}\n";
                $context .= "MƏZMUN: {$item->content}\n";
                $sourceUrl = '';
                try {
                    $sourceUrl = $item->source_url ?? $item->source ?? 'N/A';
                } catch (\Exception $e) {
                    $sourceUrl = $item->source ?? 'N/A';
                }
                $context .= "MƏNBƏ LINK: {$sourceUrl}\n";
                $context .= "KATEQORİYA: {$item->category}\n\n";
            }
            
            return $context;
            
        } catch (Exception $e) {
            Log::error('Enhanced URL search error', ['error' => $e->getMessage()]);
            return parent::getUrlTrainedContent($query);
        }
    }
    
    /**
     * Extract the key concept from a query
     */
    protected function extractKeyConcept(string $query): ?string
    {
        $query = mb_strtolower($query, 'UTF-8');
        
        // Priority Islamic concepts
        $concepts = [
            'dəstəmaz', 'destemaz', 'abdest',
            'qüsl', 'qusl', 'qusul',
            'təyəmmüm', 'teyemmum',
            'namaz', 'salat', 'salah',
            'oruc', 'siyam', 'ruzə',
            'zəkat', 'zekat',
            'həcc', 'hecc', 'hac',
            'quran', 'kuran', 'koran',
            'təharət', 'teharet', 'paklıq',
            'nəcasət', 'necaset', 'murdarlıq',
            'qiblə', 'qible', 'kible',
            'camaat', 'cəmaət', 'cemaat',
            'cümə', 'cume', 'cuma',
            'fitrə', 'fitre', 'fitir',
            'qəza', 'qeza', 'kaza',
            'niyyət', 'niyyet', 'niyet'
        ];
        
        foreach ($concepts as $concept) {
            if (mb_stripos($query, $concept) !== false) {
                return $concept;
            }
        }
        
        return null;
    }
}