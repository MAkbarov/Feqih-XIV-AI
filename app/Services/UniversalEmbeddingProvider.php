<?php

namespace App\Services;

use App\Interfaces\EmbeddingProviderInterface;
use App\Services\Embeddings\OpenAIEmbeddingProvider;
use App\Services\Embeddings\DeepSeekEmbeddingProvider;
use App\Services\Embeddings\GeminiEmbeddingProvider;
use App\Services\Embeddings\AnthropicEmbeddingProvider;
use App\Services\Embeddings\CustomEmbeddingProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UniversalEmbeddingProvider implements EmbeddingProviderInterface
{
    private ?EmbeddingProviderInterface $activeProvider = null;
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

        // Create appropriate embedding provider based on driver
        switch ($activeProvider->driver) {
            case 'openai':
                $this->activeProvider = new OpenAIEmbeddingProvider($this->providerConfig);
                break;
            
            case 'deepseek':
                $this->activeProvider = new DeepSeekEmbeddingProvider($this->providerConfig);
                break;
            
            case 'gemini':
                $this->activeProvider = new GeminiEmbeddingProvider($this->providerConfig);
                break;
            
            case 'anthropic':
                $this->activeProvider = new AnthropicEmbeddingProvider($this->providerConfig);
                break;
            
            case 'custom':
                $this->activeProvider = new CustomEmbeddingProvider($this->providerConfig);
                break;
            
            default:
                throw new \Exception("Unsupported AI provider driver: {$activeProvider->driver}");
        }

        Log::info("Initialized embedding provider", [
            'driver' => $activeProvider->driver,
            'embedding_model' => $activeProvider->embedding_model ?? 'default',
        ]);
    }

    public function generateEmbedding(string $text): array
    {
        if (!$this->activeProvider) {
            throw new \Exception('No active embedding provider');
        }

        return $this->activeProvider->generateEmbedding($text);
    }

    public function generateEmbeddingsBatch(array $texts): array
    {
        if (!$this->activeProvider) {
            throw new \Exception('No active embedding provider');
        }

        // If provider supports batch, use it. Otherwise, process one by one
        if (method_exists($this->activeProvider, 'generateEmbeddingsBatch')) {
            return $this->activeProvider->generateEmbeddingsBatch($texts);
        }

        // Fallback to single processing
        return array_map(fn($text) => $this->generateEmbedding($text), $texts);
    }

    public function getDimension(): int
    {
        if (!$this->activeProvider) {
            return 1536; // Default OpenAI dimension
        }

        return $this->activeProvider->getDimension();
    }

    /**
     * Get the current active provider info
     */
    public function getActiveProviderInfo(): array
    {
        return [
            'driver' => $this->providerConfig['driver'] ?? 'unknown',
            'model' => $this->providerConfig['embedding_model'] ?? $this->providerConfig['model'] ?? 'unknown',
            'dimension' => $this->getDimension(),
        ];
    }
}