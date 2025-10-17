<?php

namespace App\Interfaces;

interface EmbeddingProviderInterface
{
    /**
     * Generate embedding vector for given text
     *
     * @param string $text
     * @return array Vector array (e.g., [0.123, -0.456, ...])
     */
    public function generateEmbedding(string $text): array;

    /**
     * Generate embeddings for multiple texts in batch
     *
     * @param array $texts
     * @return array Array of vectors
     */
    public function generateEmbeddingsBatch(array $texts): array;

    /**
     * Get the dimension of embeddings produced by this provider
     *
     * @return int
     */
    public function getDimension(): int;
}
