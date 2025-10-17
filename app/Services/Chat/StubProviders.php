<?php

namespace App\Services\Chat;

use App\Interfaces\ChatProviderInterface;

// Gemini Chat Provider
class GeminiChatProvider implements ChatProviderInterface
{
    public function __construct(array $config) {}
    
    public function generateResponse(string $prompt, array $options = []): string
    {
        throw new \Exception("Gemini chat provider not yet implemented");
    }
    
    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        throw new \Exception("Gemini streaming not yet implemented");
    }
    
    public function supportsStreaming(): bool
    {
        return false;
    }
}

// Anthropic Chat Provider
class AnthropicChatProvider implements ChatProviderInterface
{
    public function __construct(array $config) {}
    
    public function generateResponse(string $prompt, array $options = []): string
    {
        throw new \Exception("Anthropic chat provider not yet implemented");
    }
    
    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        throw new \Exception("Anthropic streaming not yet implemented");
    }
    
    public function supportsStreaming(): bool
    {
        return false;
    }
}

// Custom Chat Provider
class CustomChatProvider implements ChatProviderInterface
{
    public function __construct(array $config) {}
    
    public function generateResponse(string $prompt, array $options = []): string
    {
        throw new \Exception("Custom chat provider not yet implemented");
    }
    
    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void
    {
        throw new \Exception("Custom streaming not yet implemented");
    }
    
    public function supportsStreaming(): bool
    {
        return false;
    }
}
