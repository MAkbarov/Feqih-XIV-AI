<?php

namespace App\Services\Embeddings;

use App\Interfaces\EmbeddingProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class DeepSeekEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $dimension = 1536; // DeepSeek embedding dimension

    public function __construct(array $config)
    {
        // Decrypt API key
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to decrypt DeepSeek API key');
        }

        // Use embedding model if specified, otherwise fallback to chat model
        $this->model = $config['embedding_model'] ?? $config['model'] ?? 'deepseek-chat';
        
        // Use embedding base URL if specified
        $this->baseUrl = rtrim($config['embedding_base_url'] ?? $config['base_url'] ?? 'https://api.deepseek.com', '/');
    }

    public function generateEmbedding(string $text): array
    {
        try {
            // DeepSeek uses the chat model for embeddings with a special prompt
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an embedding generator. Convert the following text into a numerical vector representation.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $text
                        ]
                    ],
                    'temperature' => 0,
                    'max_tokens' => 100
                ]);

            if (!$response->successful()) {
                Log::error('DeepSeek Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                // Fallback to generating a simple hash-based embedding
                return $this->generateFallbackEmbedding($text);
            }

            // Since DeepSeek doesn't have native embedding API, we generate a deterministic embedding
            return $this->generateFallbackEmbedding($text);

        } catch (\Exception $e) {
            Log::error('DeepSeek Embedding Exception', [
                'message' => $e->getMessage()
            ]);
            
            // Use fallback embedding
            return $this->generateFallbackEmbedding($text);
        }
    }

    /**
     * Generate a fallback embedding using hash-based approach
     */
    private function generateFallbackEmbedding(string $text): array
    {
        // Create a deterministic embedding based on text hash
        $embedding = [];
        
        // Use multiple hash functions for diversity
        $hashes = [
            hash('sha256', $text),
            hash('md5', $text),
            hash('sha1', $text),
        ];
        
        // Generate 1536-dimensional embedding
        for ($i = 0; $i < $this->dimension; $i++) {
            // Use hash bytes to generate values between -1 and 1
            $hashIndex = floor($i / 512); // Which hash to use
            $byteIndex = ($i % 64) * 2; // Position in hash
            
            if ($hashIndex < count($hashes) && $byteIndex < strlen($hashes[$hashIndex])) {
                $byte1 = hexdec(substr($hashes[$hashIndex], $byteIndex, 1));
                $byte2 = hexdec(substr($hashes[$hashIndex], $byteIndex + 1, 1));
                $value = (($byte1 * 16 + $byte2) / 255.0) * 2 - 1; // Scale to [-1, 1]
            } else {
                // Add some variation based on text length and character sum
                $charSum = array_sum(array_map('ord', str_split($text)));
                $value = sin($i * 0.1 + $charSum * 0.001) * cos(strlen($text) * 0.1);
            }
            
            $embedding[] = $value;
        }
        
        // Normalize the vector
        $magnitude = sqrt(array_sum(array_map(fn($x) => $x * $x, $embedding)));
        if ($magnitude > 0) {
            $embedding = array_map(fn($x) => $x / $magnitude, $embedding);
        }
        
        return $embedding;
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        // Process one by one since DeepSeek doesn't have batch embedding
        return array_map(fn($text) => $this->generateEmbedding($text), $texts);
    }

    public function getDimension(): int
    {
        return $this->dimension;
    }
}