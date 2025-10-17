<?php

namespace App\Services;

class TextChunker
{
    // Hard safety limit to protect memory (approx ~0.5 MB of text)
    private const MAX_CHARS = 500000; // 500k characters cap

    /**
     * Split text into chunks with overlap
     *
     * @param string $text
     * @param int $chunkSize Characters per chunk
     * @param int $overlap Overlapping characters between chunks
     * @return array Array of chunks
     */
    public static function chunk(string $text, int $chunkSize = 1024, int $overlap = 200): array
    {
        // Safety cap BEFORE normalization to avoid huge regex allocations
        if (mb_strlen($text) > self::MAX_CHARS) {
            $text = mb_substr($text, 0, self::MAX_CHARS);
        }

        // Clean and normalize text
        $text = self::normalizeText($text);

        // Re-check length and fast path
        if (mb_strlen($text) <= $chunkSize) {
            return [$text];
        }

        $chunks = [];
        $start = 0;
        $textLength = mb_strlen($text);

        // Clamp overlap to be lower than chunk size
        if ($overlap >= $chunkSize) {
            $overlap = max(0, (int) floor($chunkSize * 0.25));
        }

        while ($start < $textLength) {
            // Get chunk
            $chunk = mb_substr($text, $start, $chunkSize);
            if ($chunk === '') {
                break; // safety
            }

            // If not the last chunk, try to break at sentence boundary
            if ($start + $chunkSize < $textLength) {
                $chunk = self::breakAtSentence($chunk);
            }

            $trimmed = trim($chunk);
            if ($trimmed !== '') {
                $chunks[] = $trimmed;
            }

            // Move start position (with overlap), ensure forward progress
            $advance = mb_strlen($trimmed) - $overlap;
            if ($advance < 1) { $advance = max(1, (int) floor($chunkSize * 0.75)); }
            $start += $advance;
        }

        return array_filter($chunks, fn($c) => mb_strlen(trim($c)) > 50); // Min 50 chars
    }

    /**
     * Normalize text for chunking
     */
    private static function normalizeText(string $text): string
    {
        // Remove excessive whitespace (limit backtracking on very long strings)
        $text = preg_replace('/\s{2,}/', ' ', $text);

        // Remove control characters except newlines and tabs
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        return trim($text);
    }

    /**
     * Try to break chunk at sentence boundary
     */
    private static function breakAtSentence(string $chunk): string
    {
        // Look for sentence endings in last 20% of chunk
        $searchStart = (int)(mb_strlen($chunk) * 0.8);
        $searchPart = mb_substr($chunk, $searchStart);
        
        // Try to find sentence ending punctuation
        $sentenceEndings = ['. ', '? ', '! ', '.\n', '?\n', '!\n'];
        $lastPos = -1;
        
        foreach ($sentenceEndings as $ending) {
            $pos = mb_strrpos($searchPart, $ending);
            if ($pos !== false && $pos > $lastPos) {
                $lastPos = $pos + mb_strlen($ending);
            }
        }
        
        if ($lastPos > 0) {
            return mb_substr($chunk, 0, $searchStart + $lastPos);
        }
        
        // If no sentence break, try word boundary
        $lastSpace = mb_strrpos($chunk, ' ');
        if ($lastSpace !== false && $lastSpace > mb_strlen($chunk) * 0.7) {
            return mb_substr($chunk, 0, $lastSpace);
        }
        
        return $chunk;
    }

    /**
     * Chunk text by semantic sections (paragraphs)
     */
    public static function chunkBySections(string $text, int $maxChunkSize = 1500): array
    {
        // Split by double newlines (paragraphs)
        $sections = preg_split('/\n\s*\n/', $text);
        $chunks = [];
        $currentChunk = '';

        foreach ($sections as $section) {
            $section = trim($section);
            if (empty($section)) continue;

            // If section alone is too big, split it
            if (mb_strlen($section) > $maxChunkSize) {
                if (!empty($currentChunk)) {
                    $chunks[] = $currentChunk;
                    $currentChunk = '';
                }
                $chunks = array_merge($chunks, self::chunk($section, $maxChunkSize, 100));
                continue;
            }

            // Try to add to current chunk
            if (mb_strlen($currentChunk) + mb_strlen($section) + 2 <= $maxChunkSize) {
                $currentChunk .= ($currentChunk ? "\n\n" : '') . $section;
            } else {
                if (!empty($currentChunk)) {
                    $chunks[] = $currentChunk;
                }
                $currentChunk = $section;
            }
        }

        if (!empty($currentChunk)) {
            $chunks[] = $currentChunk;
        }

        return array_filter($chunks, fn($c) => mb_strlen(trim($c)) > 50);
    }
}
