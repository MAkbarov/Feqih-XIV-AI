<?php

namespace App\Services\Chat;

use App\Interfaces\ChatProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class OpenAIChatProvider implements ChatProviderInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    public function __construct(array $config)
    {
        // Decrypt API key
        try {
            $this->apiKey = Crypt::decryptString($config['api_key']);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to decrypt OpenAI API key');
        }

        $this->model = $config['model'] ?? 'gpt-4o-mini';
        $this->baseUrl = rtrim($config['base_url'] ?? 'https://api.openai.com/v1', '/');
    }

    public function generateResponse(string $prompt, array $options = []): string
    {
        try {
            $requestData = [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => $options['temperature'] ?? 0.3,
                'max_tokens' => $options['max_tokens'] ?? 2000,
            ];

            // Add optional parameters if provided
            if (isset($options['top_p'])) {
                $requestData['top_p'] = $options['top_p'];
            }
            if (isset($options['presence_penalty'])) {
                $requestData['presence_penalty'] = $options['presence_penalty'];
            }
            if (isset($options['frequency_penalty'])) {
                $requestData['frequency_penalty'] = $options['frequency_penalty'];
            }
            if (isset($options['seed'])) {
                $requestData['seed'] = $options['seed'];
            }

            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/chat/completions', $requestData);

            if (!$response->successful()) {
                Log::error('OpenAI Chat API Error', [
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
            Log::error('OpenAI Chat Exception', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        try {
            $requestData = [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => $options['temperature'] ?? 0.3,
                'max_tokens' => $options['max_tokens'] ?? 2000,
                'stream' => true
            ];

            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->withOptions([
                    'stream' => true,
                    'sink' => function ($chunk) use ($callback) {
                        // Parse Server-Sent Events
                        $lines = explode("\n", $chunk);
                        foreach ($lines as $line) {
                            if (strpos($line, 'data: ') === 0) {
                                $json = substr($line, 6);
                                if ($json !== '[DONE]') {
                                    $data = json_decode($json, true);
                                    if (isset($data['choices'][0]['delta']['content'])) {
                                        $callback($data['choices'][0]['delta']['content']);
                                    }
                                }
                            }
                        }
                    }
                ])
                ->post($this->baseUrl . '/chat/completions', $requestData);

        } catch (\Exception $e) {
            Log::error('OpenAI Streaming Exception', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function supportsStreaming(): bool
    {
        return true; // OpenAI supports streaming
    }
}
