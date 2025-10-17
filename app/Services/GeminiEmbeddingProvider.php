<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Models\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $embeddingDimension = 768; // Gemini default

    public function __construct(AiProvider $provider)
    {
        $this->apiKey = $provider->api_key;
        
        // RAG/Embedding üçün spesifik model və base URL
        $this->model = $provider->embedding_model ?? 'models/embedding-001';
        $this->baseUrl = $provider->embedding_base_url ?? 'https://generativelanguage.googleapis.com/v1beta';
        
        if ($provider->embedding_dimension) {
            $this->embeddingDimension = $provider->embedding_dimension;
        }
    }

    public function generateEmbedding(string $text): array
    {
        try {
            // Gemini API format
            $url = $this->baseUrl . '/' . $this->model . ':embedContent?key=' . $this->apiKey;
            
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($url, [
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
                throw new \Exception('Gemini embedding failed: ' . $response->body());
            }

            $data = $response->json();
            
            if (!isset($data['embedding']['values'])) {
                throw new \Exception('Invalid Gemini embedding response format');
            }

            return $data['embedding']['values'];

        } catch (\Exception $e) {
            Log::error('Gemini Embedding Exception', [
                'message' => $e->getMessage(),
                'text_length' => mb_strlen($text)
            ]);
            throw $e;
        }
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        // Gemini batch API-nin spesifik formatı varsa burada istifadə edilə bilər
        // Hal-hazırda fallback: tək-tək
        try {
            $embeddings = [];
            foreach ($texts as $text) {
                $embeddings[] = $this->generateEmbedding($text);
            }
            return $embeddings;
        } catch (\Exception $e) {
            Log::error('Gemini Batch Embedding Exception', [
                'message' => $e->getMessage(),
                'count' => count($texts)
            ]);
            throw $e;
        }
    }

    public function getDimension(): int
    {
        return $this->embeddingDimension;
    }
}
