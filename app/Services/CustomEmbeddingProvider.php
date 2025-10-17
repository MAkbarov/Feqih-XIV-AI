<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Models\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Custom/Generic Embedding Provider
 * OpenAI-compatible API format ilə işləyir
 * İstənilən fərdi embedding API ilə istifadə edilə bilər
 */
class CustomEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $embeddingDimension = 1536; // Default

    public function __construct(AiProvider $provider)
    {
        $this->apiKey = $provider->api_key ?? '';
        
        // RAG/Embedding üçün spesifik model və base URL
        $this->model = $provider->embedding_model ?? 'text-embedding-3-small';
        $this->baseUrl = $provider->embedding_base_url ?? 'https://api.openai.com/v1';
        
        if ($provider->embedding_dimension) {
            $this->embeddingDimension = $provider->embedding_dimension;
        }
    }

    public function generateEmbedding(string $text): array
    {
        try {
            // OpenAI-compatible format
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
                Log::error('Custom Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'base_url' => $this->baseUrl
                ]);
                throw new \Exception('Custom embedding failed: ' . $response->body());
            }

            $data = $response->json();
            
            // Try standard OpenAI format
            if (isset($data['data'][0]['embedding'])) {
                return $data['data'][0]['embedding'];
            }
            
            // Try alternative format (some APIs use different structure)
            if (isset($data['embedding'])) {
                return $data['embedding'];
            }
            
            if (isset($data['embeddings'][0])) {
                return $data['embeddings'][0];
            }

            throw new \Exception('Invalid custom embedding response format: ' . json_encode($data));

        } catch (\Exception $e) {
            Log::error('Custom Embedding Exception', [
                'message' => $e->getMessage(),
                'text_length' => mb_strlen($text),
                'base_url' => $this->baseUrl
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
                throw new \Exception('Custom batch embedding failed');
            }

            $data = $response->json();
            
            // Standard OpenAI format
            if (isset($data['data'])) {
                $embeddings = [];
                foreach ($data['data'] as $item) {
                    $embeddings[] = $item['embedding'];
                }
                return $embeddings;
            }

            throw new \Exception('Invalid custom batch embedding response format');

        } catch (\Exception $e) {
            Log::error('Custom Batch Embedding Exception', [
                'message' => $e->getMessage(),
                'count' => count($texts),
                'base_url' => $this->baseUrl
            ]);
            
            // Fallback: tək-tək işlət
            return array_map(fn($text) => $this->generateEmbedding($text), $texts);
        }
    }

    public function getDimension(): int
    {
        return $this->embeddingDimension;
    }
}
