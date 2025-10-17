<?php

namespace App\Helpers;

/**
 * XIV AI - Advanced AI Chatbot Platform
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 * 
 * Encoding Helper - Fixes common encoding issues for Turkish/Azerbaijani text
 */
class EncodingHelper
{
    /**
     * Comprehensive text encoding fix for Turkish/Azerbaijani characters
     */
    public static function fixText($text)
    {
        if (!$text) return $text;
        
        // Remove null bytes and control characters first
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        
        // Fix common HTML entities that show as corrupted text
        $entityMap = [
            // Azerbaijani specific fixes
            'Ã¤' => 'ə',
            'Æ' => 'Ə',
            'Ã§' => 'ç',
            'Ç' => 'Ç',
            'Ã¼' => 'ü', 
            'Ãœ' => 'Ü',
            'Å¸' => 'ş',
            'Ş' => 'Ş',
            'Ä±' => 'ı',
            'İ' => 'İ',
            'Ä°' => 'İ',
            'Ä' => 'Ğ',
            'Ğ' => 'Ğ',
            'Ã¶' => 'ö',
            'Ã–' => 'Ö',
            
            // Common corrupted patterns
            'â€™' => "'",
            'â€œ' => '"',
            'â€' => '"',
            'â€¦' => '...',
            'â€"' => '–',
            'â€"' => '—',
            'Â' => '',
            'Ã ' => 'à',
            'Ã¡' => 'á',
            'Ã©' => 'é',
            'Ã­' => 'í',
            'Ã³' => 'ó',
            'Ãº' => 'ú',
            
            // Windows-1254 specific
            'ÆQÆM' => 'əqəm',
            'LÆQV' => 'ləğv',
            'ÆLAQÆ' => 'əlaqə',
            'MÆQAM' => 'məqam',
            'HÆQQ' => 'həqq',
            'SÆHV' => 'səhv',
            'TÆSÆVVÜR' => 'təsəvvür',
            'MÆRCÆYÄ°' => 'mərcəyi',
            'ÆSLINDÆ' => 'əslində',
        ];
        
        // Apply entity fixes
        $text = strtr($text, $entityMap);
        
        // Decode HTML entities
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // If still not valid UTF-8, try encoding conversion
        if (!mb_check_encoding($text, 'UTF-8')) {
            $encodings = ['Windows-1254', 'ISO-8859-9', 'Windows-1252', 'ISO-8859-1'];
            foreach ($encodings as $encoding) {
                $converted = @mb_convert_encoding($text, 'UTF-8', $encoding);
                if ($converted && mb_check_encoding($converted, 'UTF-8')) {
                    $text = $converted;
                    break;
                }
            }
        }
        
        // Final cleanup - remove extra whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = preg_replace('/\n\s*\n/', "\n\n", $text);
        
        return trim($text);
    }
    
    /**
     * Clean text for display in admin panel
     */
    public static function cleanForDisplay($text, $maxLength = 200)
    {
        $text = self::fixText($text);
        
        // Truncate if too long
        if (strlen($text) > $maxLength) {
            $text = mb_substr($text, 0, $maxLength, 'UTF-8') . '...';
        }
        
        return $text;
    }
    
    /**
     * Check if text contains corrupted characters
     */
    public static function isCorrupted($text)
    {
        if (!$text) return false;
        
        // Look for common corruption patterns
        $corruptionPatterns = [
            '/Ã[¤§¼¶]/u',  // Common Turkish char corruption
            '/Æ[°ŸŒ]/u',     // Ə corruptions 
            '/â€[œ™¦"]/u',   // Quote corruptions
            '/[^\x00-\x7F\x{00A0}-\x{024F}\x{1E00}-\x{1EFF}]/u' // Non-Latin outside expected ranges
        ];
        
        foreach ($corruptionPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }
        
        return false;
    }
}