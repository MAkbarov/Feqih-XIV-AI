<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Interfaces\EmbeddingProviderInterface;

class EmbeddingProviderFactory
{
    /**
     * Aktiv AI Provider-dən müvafiq Embedding Provider yaradır
     * 
     * @throws \Exception
     */
    public static function createFromActiveProvider(): EmbeddingProviderInterface
    {
        $provider = AiProvider::getActive();

        if (!$provider) {
            throw new \Exception('Aktiv AI provayder tapılmadı. Admin paneldən bir provayder aktivləşdirin.');
        }

        // Driver əsasında müvafiq embedding provider class-ını seç
        return self::createFromProvider($provider);
    }

    /**
     * Verilmiş provider-dən embedding service yaradır
     */
    public static function createFromProvider(AiProvider $provider): EmbeddingProviderInterface
    {
        switch ($provider->driver) {
            case 'openai':
                return new OpenAIEmbeddingProvider($provider);
            
            case 'deepseek':
                return new DeepSeekEmbeddingProvider($provider);
            
            case 'anthropic':
                return new AnthropicEmbeddingProvider($provider);
            
            case 'gemini':
                return new GeminiEmbeddingProvider($provider);
            
            case 'custom':
                return new CustomEmbeddingProvider($provider);
            
            default:
                throw new \Exception("Dəstəklənməyən provayder driver-i: {$provider->driver}");
        }
    }

    /**
     * Provider-in embedding dəstəyini yoxla
     */
    public static function checkEmbeddingSupport(AiProvider $provider): bool
    {
        // Əgər embedding_model təyin edilibsə, demək RAG üçün konfiqurasiya olunub
        return !empty($provider->embedding_model);
    }
}
