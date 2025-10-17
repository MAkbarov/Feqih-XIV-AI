<?php

namespace App\Services\Chat;

use App\Interfaces\ChatProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class DeepSeekChatProvider implements ChatProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    public function __construct(array $config)
    {
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to decrypt DeepSeek API key');
        }

        $this->model = $config['model'] ?? 'deepseek-chat';
        $this->baseUrl = rtrim($config['base_url'] ?? 'https://api.deepseek.com/v1', '/');
    }

    public function generateResponse(string $prompt, array $options = []): string
    {
        // DeepSeek is OpenAI-compatible, use same implementation
        try {
            $requestData = [
                'model' => $this->model,
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
                throw new \Exception('Failed to generate response: ' . $response->body());
            }

            $data = $response->json();
            return trim($data['choices'][0]['message']['content']);

        } catch (\Exception $e) {
            Log::error('DeepSeek Chat Exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        // Similar to OpenAI streaming
        $this->generateResponse($prompt, $options); // For now, just use non-streaming
    }

    public function supportsStreaming(): bool
    {
        return true; // DeepSeek supports streaming (OpenAI compatible)
    }
}
