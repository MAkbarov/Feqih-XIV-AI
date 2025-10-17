<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Interfaces\ChatProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DeepSeekProvider implements EmbeddingProviderInterface, ChatProviderInterface
{
    private string $apiKey;
    private string $embeddingModel;
    private string $chatModel;
    private string $baseUrl = 'https://api.deepseek.com';
    private int $embeddingDimension = 1024; // DeepSeek embedding dimension

    public function __construct()
    {
        // Read from ai_providers table (active provider)
        $activeProvider = DB::table('ai_providers')
            ->where('is_active', true)
            ->where('driver', 'deepseek')
            ->first();

        if ($activeProvider) {
            // Decrypt API key
            try {
                $this->apiKey = \Illuminate\Support\Facades\Crypt::decryptString($activeProvider->api_key);
            } catch (\Throwable $e) {
                $this->apiKey = '';
                Log::warning('Failed to decrypt DeepSeek API key');
            }
            
            $this->chatModel = $activeProvider->model ?? 'deepseek-chat';
            $this->embeddingModel = $activeProvider->model ?? 'deepseek-chat';
            
            // Override base URL if custom is set
            if (!empty($activeProvider->base_url)) {
                $this->baseUrl = rtrim($activeProvider->base_url, '/');
            }
        } else {
            // Fallback to settings table (legacy support)
            $this->apiKey = $this->getSetting('deepseek_api_key', '');
            $this->embeddingModel = $this->getSetting('deepseek_embedding_model', 'deepseek-chat');
            $this->chatModel = $this->getSetting('deepseek_chat_model', 'deepseek-chat');
        }
    }

    /**
     * Get setting from database (legacy fallback)
     */
    private function getSetting(string $key, $default = null)
    {
        $setting = DB::table('settings')->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    // ==================== EMBEDDING INTERFACE ====================

    public function generateEmbedding(string $text): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/embeddings', [
                    'model' => $this->embeddingModel,
                    'input' => $text,
                ]);

            if (!$response->successful()) {
                Log::error('DeepSeek Embedding API Error', [
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
            Log::error('DeepSeek Embedding Exception', [
                'message' => $e->getMessage(),
                'text_length' => mb_strlen($text)
            ]);
            throw $e;
        }
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        // DeepSeek supports batch embedding
        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/embeddings', [
                    'model' => $this->embeddingModel,
                    'input' => $texts,
                ]);

            if (!$response->successful()) {
                Log::error('DeepSeek Batch Embedding API Error', [
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
            Log::error('DeepSeek Batch Embedding Exception', [
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

    // ==================== CHAT INTERFACE ====================

    public function generateResponse(string $prompt, array $options = []): string
    {
        try {
            $requestData = [
                'model' => $this->chatModel,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => $options['temperature'] ?? 0.3,
                'max_tokens' => $options['max_tokens'] ?? 2000,
            ];

            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/chat/completions', $requestData);

            if (!$response->successful()) {
                Log::error('DeepSeek Chat API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to generate response: ' . $response->body());
            }

            $data = $response->json();
            
            if (!isset($data['choices'][0]['message']['content'])) {
                throw new \Exception('Invalid chat response format');
            }

            return trim($data['choices'][0]['message']['content']);

        } catch (\Exception $e) {
            Log::error('DeepSeek Chat Exception', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        try {
            $requestData = [
                'model' => $this->chatModel,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => $options['temperature'] ?? 0.3,
                'max_tokens' => $options['max_tokens'] ?? 2000,
                'stream' => true,
            ];

            $response = Http::timeout(120)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->withOptions(['stream' => true])
                ->post($this->baseUrl . '/chat/completions', $requestData);

            // Parse SSE stream
            $buffer = '';
            foreach ($response->getBody() as $chunk) {
                $buffer .= $chunk;
                
                while (($pos = strpos($buffer, "\n")) !== false) {
                    $line = substr($buffer, 0, $pos);
                    $buffer = substr($buffer, $pos + 1);
                    
                    if (strpos($line, 'data: ') === 0) {
                        $data = trim(substr($line, 6));
                        
                        if ($data === '[DONE]') {
                            return;
                        }
                        
                        $json = json_decode($data, true);
                        if (isset($json['choices'][0]['delta']['content'])) {
                            $callback($json['choices'][0]['delta']['content']);
                        }
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error('DeepSeek Streaming Exception', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function supportsStreaming(): bool
    {
        return true;
    }
}
