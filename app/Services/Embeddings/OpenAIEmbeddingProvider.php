<?php

namespace App\Services\Embeddings;

use App\Interfaces\EmbeddingProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class OpenAIEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $dimension = 1536; // Default for text-embedding-ada-002

    public function __construct(array $config)
    {
        // Decrypt API key
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to decrypt OpenAI API key');
        }

        // Use embedding model if specified, otherwise use default
        $this->model = $config['embedding_model'] ?? 'text-embedding-ada-002';
        
        // Use embedding base URL if specified, otherwise use default
        $this->baseUrl = rtrim($config['embedding_base_url'] ?? $config['base_url'] ?? 'https://api.openai.com/v1', '/');

        // Set dimension based on model
        if (strpos($this->model, 'text-embedding-3-large') !== false) {
            $this->dimension = 3072;
        } elseif (strpos($this->model, 'text-embedding-3-small') !== false) {
            $this->dimension = 1536;
        }
    }

    public function generateEmbedding(string $text): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/embeddings', [
                    'model' => $this->model,
                    'input' => $text,
                ]);

            if (!$response->successful()) {
                Log::error('OpenAI Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to generate embedding: ' . $response->body());
            }

            $data = $response->json();
            
            if (!isset($data['data'][0]['embedding'])) {
                throw new \Exception('Invalid embedding response format');
            }

            return $data['data'][0]['embedding'];

        } catch (\Exception $e) {
            Log::error('OpenAI Embedding Exception', [
                'message' => $e->getMessage(),
                'model' => $this->model
            ]);
            throw $e;
        }
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/embeddings', [
                    'model' => $this->model,
                    'input' => $texts,
                ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to generate batch embeddings');
            }

            $data = $response->json();
            
            // Extract embeddings in order
            $embeddings = [];
            foreach ($data['data'] as $item) {
                $embeddings[] = $item['embedding'];
            }

            return $embeddings;

        } catch (\Exception $e) {
            Log::error('OpenAI Batch Embedding Exception', [
                'message' => $e->getMessage(),
                'count' => count($texts)
            ]);
            
            // Fallback: process one by one
            return array_map(fn($text) => $this->generateEmbedding($text), $texts);
        }
    }

    public function getDimension(): int
    {
        return $this->dimension;
    }
}