<?php

namespace App\Interfaces;

interface ChatProviderInterface
{
    /**
     * Generate chat response for given prompt
     *
     * @param string $prompt
     * @param array $options Additional options (temperature, max_tokens, etc.)
     * @return string
     */
    public function generateResponse(string $prompt, array $options = []): string;

    /**
     * Generate streaming response (if supported)
     *
     * @param string $prompt
     * @param callable $callback
     * @param array $options
     * @return void
     */
    public function generateStreamingResponse(string $prompt, callable $callback, array $options = []): void;

    /**
     * Check if this provider supports streaming
     *
     * @return bool
     */
    public function supportsStreaming(): bool;
}
