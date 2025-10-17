<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Models\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $embeddingDimension = 1536;

    public function __construct(AiProvider $provider)
    {
        $this->apiKey = $provider->api_key;
        
        // RAG/Embedding üçün spesifik model və base URL
        $this->model = $provider->embedding_model ?? 'text-embedding-3-small';
        $this->baseUrl = $provider->embedding_base_url ?? 'https://api.openai.com/v1';
        
        // Auto-detect dimension based on model name
        if ($provider->embedding_dimension) {
            $this->embeddingDimension = $provider->embedding_dimension;
        } elseif (str_contains($this->model, 'text-embedding-3-large')) {
            $this->embeddingDimension = 3072;
        } elseif (str_contains($this->model, 'text-embedding-ada-002')) {
            $this->embeddingDimension = 1536;
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
                Log::error('OpenAI Batch Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
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
        return $this->embeddingDimension;
    }
}
