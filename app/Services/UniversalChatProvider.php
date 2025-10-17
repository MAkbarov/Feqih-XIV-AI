<?php

namespace App\Services;

use App\Interfaces\ChatProviderInterface;
use App\Services\Chat\OpenAIChatProvider;
use App\Services\Chat\DeepSeekChatProvider;
use App\Services\Chat\GeminiChatProvider;
use App\Services\Chat\AnthropicChatProvider;
use App\Services\Chat\CustomChatProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UniversalChatProvider implements ChatProviderInterface
{
    private ?ChatProviderInterface $activeProvider = null;
    private array $providerConfig;

    public function __construct()
    {
        $this->initializeActiveProvider();
    }

    private function initializeActiveProvider(): void
    {
        // Get active AI provider from database
        $activeProvider = DB::table('ai_providers')
            ->where('is_active', true)
            ->first();

        if (!$activeProvider) {
            throw new \Exception('No active AI provider configured');
        }

        $this->providerConfig = (array) $activeProvider;

        // Create appropriate chat provider based on driver
        switch ($activeProvider->driver) {
            case 'openai':
                $this->activeProvider = new OpenAIChatProvider($this->providerConfig);
                break;
            
            case 'deepseek':
                $this->activeProvider = new DeepSeekChatProvider($this->providerConfig);
                break;
            
            case 'gemini':
                $this->activeProvider = new GeminiChatProvider($this->providerConfig);
                break;
            
            case 'anthropic':
                $this->activeProvider = new AnthropicChatProvider($this->providerConfig);
                break;
            
            case 'custom':
                $this->activeProvider = new CustomChatProvider($this->providerConfig);
                break;
            
            default:
                throw new \Exception("Unsupported AI provider driver: {$activeProvider->driver}");
        }

        Log::info("Initialized chat provider", [
            'driver' => $activeProvider->driver,
            'model' => $activeProvider->model ?? 'default',
        ]);
    }

    public function generateResponse(string $prompt, array $options = []): string
    {
        if (!$this->activeProvider) {
            throw new \Exception('No active chat provider');
        }

        return $this->activeProvider->generateResponse($prompt, $options);
    }

    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        if (!$this->activeProvider) {
            throw new \Exception('No active chat provider');
        }

        // If provider supports streaming, use it
        if (method_exists($this->activeProvider, 'generateStreamingResponse')) {
            $this->activeProvider->generateStreamingResponse($prompt, $callback, $options);
        } else {
            // Fallback: simulate streaming by sending response in chunks
            $response = $this->generateResponse($prompt, $options);
            $words = explode(' ', $response);
            foreach ($words as $word) {
                $callback($word . ' ');
                usleep(50000); // 50ms delay
            }
        }
    }

    /**
     * Get the current active provider info
     */
    public function getActiveProviderInfo(): array
    {
        return [
            'driver' => $this->providerConfig['driver'] ?? 'unknown',
            'model' => $this->providerConfig['model'] ?? 'unknown',
        ];
    }

    /**
     * Check if the provider supports streaming
     */
    public function supportsStreaming(): bool
    {
        if (!$this->activeProvider) {
            return false;
        }

        // Check if the active provider implements the streaming method
        if (method_exists($this->activeProvider, 'supportsStreaming')) {
            return $this->activeProvider->supportsStreaming();
        }

        // Default: check if generateStreamingResponse method exists
        return method_exists($this->activeProvider, 'generateStreamingResponse');
    }
}
