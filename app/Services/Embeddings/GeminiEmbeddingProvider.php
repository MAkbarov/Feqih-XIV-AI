<?php

namespace App\Services\Embeddings;

use App\Interfaces\EmbeddingProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class GeminiEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $dimension = 768; // Gemini embedding dimension

    public function __construct(array $config)
    {
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to decrypt Gemini API key');
        }

        // Use embedding model if specified
        $this->model = $config['embedding_model'] ?? 'models/embedding-001';
        
        // Use embedding base URL if specified
        $this->baseUrl = rtrim($config['embedding_base_url'] ?? 'https://generativelanguage.googleapis.com/v1beta', '/');
    }

    public function generateEmbedding(string $text): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/' . $this->model . ':embedContent?key=' . $this->apiKey, [
                    'model' => $this->model,
                    'content' => [
                        'parts' => [
                            ['text' => $text]
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                Log::error('Gemini Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to generate embedding: ' . $response->body());
            }

            $data = $response->json();
            
            if (!isset($data['embedding']['values'])) {
                throw new \Exception('Invalid embedding response format');
            }

            return $data['embedding']['values'];

        } catch (\Exception $e) {
            Log::error('Gemini Embedding Exception', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        // Gemini supports batch embedding
        try {
            $requests = [];
            foreach ($texts as $text) {
                $requests[] = [
                    'model' => $this->model,
                    'content' => [
                        'parts' => [
                            ['text' => $text]
                        ]
                    ]
                ];
            }

            $response = Http::timeout(60)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/' . $this->model . ':batchEmbedContents?key=' . $this->apiKey, [
                    'requests' => $requests
                ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to generate batch embeddings');
            }

            $data = $response->json();
            
            $embeddings = [];
            foreach ($data['embeddings'] as $item) {
                $embeddings[] = $item['values'];
            }

            return $embeddings;

        } catch (\Exception $e) {
            Log::error('Gemini Batch Embedding Exception', [
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