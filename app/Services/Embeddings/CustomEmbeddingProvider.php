<?php

namespace App\Services\Embeddings;

use App\Interfaces\EmbeddingProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class CustomEmbeddingProvider implements EmbeddingProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $dimension = 1536; // Default dimension

    public function __construct(array $config)
    {
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            $this->apiKey = ''; // Custom might not need API key
        }

        $this->model = $config['embedding_model'] ?? $config['model'] ?? 'custom';
        $this->baseUrl = rtrim($config['embedding_base_url'] ?? $config['base_url'] ?? 'http://localhost:8080', '/');
        
        // Try to parse dimension from model name or config
        if (isset($config['embedding_dimension'])) {
            $this->dimension = (int)$config['embedding_dimension'];
        }
    }

    public function generateEmbedding(string $text): array
    {
        try {
            $headers = ['Content-Type' => 'application/json'];
            
            // Add authorization if API key exists
            if (!empty($this->apiKey)) {
                $headers['Authorization'] = 'Bearer ' . $this->apiKey;
            }

            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($this->baseUrl . '/embeddings', [
                    'model' => $this->model,
                    'input' => $text,
                ]);

            if (!$response->successful()) {
                Log::error('Custom Embedding API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to generate embedding');
            }

            $data = $response->json();
            
            // Try different response formats
            if (isset($data['embedding'])) {
                return $data['embedding'];
            } elseif (isset($data['data'][0]['embedding'])) {
                return $data['data'][0]['embedding'];
            } elseif (isset($data['embeddings'][0])) {
                return $data['embeddings'][0];
            } elseif (isset($data['vector'])) {
                return $data['vector'];
            } elseif (is_array($data) && isset($data[0]) && is_numeric($data[0])) {
                // Direct array response
                return $data;
            }

            throw new \Exception('Unknown embedding response format');

        } catch (\Exception $e) {
            Log::error('Custom Embedding Exception', [
                'message' => $e->getMessage(),
                'url' => $this->baseUrl
            ]);
            throw $e;
        }
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        // Try batch endpoint first
        try {
            $headers = ['Content-Type' => 'application/json'];
            
            if (!empty($this->apiKey)) {
                $headers['Authorization'] = 'Bearer ' . $this->apiKey;
            }

            $response = Http::timeout(60)
                ->withHeaders($headers)
                ->post($this->baseUrl . '/embeddings/batch', [
                    'model' => $this->model,
                    'input' => $texts,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['embeddings'])) {
                    return $data['embeddings'];
                } elseif (isset($data['data'])) {
                    $embeddings = [];
                    foreach ($data['data'] as $item) {
                        $embeddings[] = $item['embedding'] ?? $item;
                    }
                    return $embeddings;
                }
            }
        } catch (\Exception $e) {
            // Batch endpoint might not exist
        }

        // Fallback to single processing
        return array_map(fn($text) => $this->generateEmbedding($text), $texts);
    }

    public function getDimension(): int
    {
        return $this->dimension;
    }
}