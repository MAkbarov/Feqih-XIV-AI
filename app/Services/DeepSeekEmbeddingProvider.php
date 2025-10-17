<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Models\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeepSeekEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $embeddingDimension = 1536; // DeepSeek default

    public function __construct(AiProvider $provider)
    {
        $this->apiKey = $provider->api_key;
        
        // RAG/Embedding üçün spesifik model və base URL
        $this->model = $provider->embedding_model ?? 'deepseek-embedder';
        $this->baseUrl = $provider->embedding_base_url ?? 'https://api.deepseek.com/v1';
        
        // Əgər embedding_dimension set olunubsa, onu istifadə et
        if ($provider->embedding_dimension) {
            $this->embeddingDimension = $provider->embedding_dimension;
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
                Log::error('DeepSeek Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('DeepSeek embedding failed: ' . $response->body());
            }

            $data = $response->json();
            
            if (!isset($data['data'][0]['embedding'])) {
                throw new \Exception('Invalid DeepSeek embedding response format');
            }

            return $data['data'][0]['embedding'];

        } catch (\Exception $e) {
            Log::error('DeepSeek Embedding Exception', [
                'message' => $e->getMessage(),
                'text_length' => mb_strlen($text)
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
                throw new \Exception('DeepSeek batch embedding failed');
            }

            $data = $response->json();
            
            $embeddings = [];
            foreach ($data['data'] as $item) {
                $embeddings[] = $item['embedding'];
            }

            return $embeddings;

        } catch (\Exception $e) {
            Log::error('DeepSeek Batch Embedding Exception', [
                'message' => $e->getMessage(),
                'count' => count($texts)
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
