<?php

namespace App\Interfaces;

interface VectorStoreInterface
{
    /**
     * Upsert vectors with metadata to vector store
     *
     * @param array $vectorsWithMetadata [['id' => '1', 'vector' => [...], 'metadata' => [...]]]
     * @return bool
     */
    public function upsert(array $vectorsWithMetadata): bool;

    /**
     * Query vector store for similar vectors
     *
     * @param array $vector Query vector
     * @param int $topK Number of results to return
     * @param array $filter Optional metadata filter
     * @return array [['id' => '1', 'score' => 0.95, 'metadata' => [...]]]
     */
    public function query(array $vector, int $topK, array $filter = []): array;

    /**
     * Delete vectors by IDs
     *
     * @param array $ids
     * @return bool
     */
    public function delete(array $ids): bool;

    /**
     * Delete all vectors for a specific knowledge base entry
     *
     * @param int $knowledgeBaseId
     * @return bool
     */
    public function deleteByKnowledgeBaseId(int $knowledgeBaseId): bool;

    /**
     * Check connection health
     *
     * @return bool
     */
    public function healthCheck(): bool;
}
