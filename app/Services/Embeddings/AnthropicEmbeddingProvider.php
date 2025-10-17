<?php

namespace App\Services\Embeddings;

use App\Interfaces\EmbeddingProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class AnthropicEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $dimension = 1024; // VoyageAI default dimension

    public function __construct(array $config)
    {
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to decrypt API key');
        }

        // Anthropic uses VoyageAI for embeddings
        // Use embedding model if specified
        $this->model = $config['embedding_model'] ?? 'voyage-2';
        
        // Use embedding base URL - default to VoyageAI
        $this->baseUrl = rtrim($config['embedding_base_url'] ?? 'https://api.voyageai.com/v1', '/');

        // Set dimension based on model
        if (strpos($this->model, 'voyage-large') !== false) {
            $this->dimension = 1536;
        } elseif (strpos($this->model, 'voyage-code') !== false) {
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
                    'input' => [$text],
                    'input_type' => 'document'
                ]);

            if (!$response->successful()) {
                Log::error('VoyageAI Embedding API Error', [
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
            Log::error('VoyageAI Embedding Exception', [
                'message' => $e->getMessage()
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
                    'input_type' => 'document'
                ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to generate batch embeddings');
            }

            $data = $response->json();
            
            $embeddings = [];
            foreach ($data['data'] as $item) {
                $embeddings[] = $item['embedding'];
            }

            return $embeddings;

        } catch (\Exception $e) {
            Log::error('VoyageAI Batch Embedding Exception', [
                'message' => $e->getMessage()
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