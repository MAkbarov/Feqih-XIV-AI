<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\KnowledgeBase;
use App\Models\KnowledgeBaseChunk;
use App\Services\TextChunker;
use App\Interfaces\EmbeddingProviderInterface;
use App\Interfaces\VectorStoreInterface;
use Carbon\Carbon;

class ProcessKnowledgeBaseEntry implements ShouldQueue
{
    use Queueable;

    public $timeout = 600; // 10 minutes timeout
    public $tries = 3;

    protected KnowledgeBase $knowledgeBase;

    /**
     * Create a new job instance.
     */
    public function __construct(KnowledgeBase $knowledgeBase)
    {
        $this->knowledgeBase = $knowledgeBase;
    }

    /**
     * Execute the job - Index knowledge base entry into RAG system
     */
    public function handle(
        EmbeddingProviderInterface $embeddingProvider,
        VectorStoreInterface $vectorStore
    ): void
    {
        Log::info('🚀 RAG INDEXING STARTED', [
            'kb_id' => $this->knowledgeBase->id,
            'title' => $this->knowledgeBase->title
        ]);

        DB::beginTransaction();
        
        try {
            // Step 1: Update status to 'indexing'
            $this->knowledgeBase->update([
                'indexing_status' => 'indexing'
            ]);

            // Step 2: Delete old chunks and vectors
            $this->cleanupOldData($vectorStore);

            // Step 3: Get chunking parameters from settings
            $chunkSize = (int)$this->getSetting('rag_chunk_size', 1024);
            $chunkOverlap = (int)$this->getSetting('rag_chunk_overlap', 200);

            Log::info('📝 RAG CHUNKING PARAMETERS', [
                'chunk_size' => $chunkSize,
                'chunk_overlap' => $chunkOverlap
            ]);

            // Step 4: Split content into chunks
            $content = $this->knowledgeBase->content;
            $chunks = TextChunker::chunk($content, $chunkSize, $chunkOverlap);

            if (empty($chunks)) {
                throw new \Exception('No valid chunks generated from content');
            }

            Log::info('✂️ TEXT CHUNKED', [
                'total_chunks' => count($chunks),
                'avg_chunk_size' => (int)(array_sum(array_map('mb_strlen', $chunks)) / count($chunks))
            ]);

            // Step 5: Generate embeddings for all chunks (batch if possible)
            $embeddings = $embeddingProvider->generateEmbeddingsBatch($chunks);

            if (count($embeddings) !== count($chunks)) {
                throw new \Exception('Embedding count mismatch');
            }

            Log::info('🧠 EMBEDDINGS GENERATED', [
                'count' => count($embeddings),
                'dimension' => count($embeddings[0] ?? [])
            ]);

            // Step 6: Save chunks to database and prepare for vector store
            $vectorsWithMetadata = [];
            $savedChunks = [];

            foreach ($chunks as $index => $chunkContent) {
                $chunk = KnowledgeBaseChunk::create([
                    'knowledge_base_id' => $this->knowledgeBase->id,
                    'content' => $chunkContent,
                    'char_count' => mb_strlen($chunkContent),
                    'chunk_index' => $index,
                ]);

                $savedChunks[] = $chunk;

                $vectorsWithMetadata[] = [
                    'id' => 'kb_' . $this->knowledgeBase->id . '_chunk_' . $chunk->id,
                    'vector' => $embeddings[$index],
                    'metadata' => [
                        'knowledge_base_id' => $this->knowledgeBase->id,
                        'chunk_id' => $chunk->id,
                        'chunk_index' => $index,
                        'title' => $this->knowledgeBase->title,
                        'category' => $this->knowledgeBase->category ?? '',
                        'source_url' => $this->knowledgeBase->source_url ?? '',
                        'char_count' => $chunk->char_count,
                    ]
                ];
            }

            // Step 7: Upsert vectors to vector store (Pinecone)
            $success = $vectorStore->upsert($vectorsWithMetadata);

            if (!$success) {
                throw new \Exception('Failed to upsert vectors to vector store');
            }

            Log::info('📦 VECTORS UPSERTED TO STORE', [
                'count' => count($vectorsWithMetadata)
            ]);

            // Step 8: Update vector_id in chunks
            foreach ($savedChunks as $index => $chunk) {
                $chunk->update([
                    'vector_id' => $vectorsWithMetadata[$index]['id']
                ]);
            }

            // Step 9: Mark as completed
            $this->knowledgeBase->update([
                'indexing_status' => 'completed',
                'chunks_count' => count($chunks),
                'last_indexed_at' => Carbon::now(),
            ]);

            DB::commit();

            Log::info('✅ RAG INDEXING COMPLETED SUCCESSFULLY', [
                'kb_id' => $this->knowledgeBase->id,
                'chunks_count' => count($chunks),
                'duration' => 'completed'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            // Mark as failed
            $this->knowledgeBase->update([
                'indexing_status' => 'failed'
            ]);

            Log::error('❌ RAG INDEXING FAILED', [
                'kb_id' => $this->knowledgeBase->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Cleanup old chunks and vectors
     */
    private function cleanupOldData(VectorStoreInterface $vectorStore): void
    {
        // Delete from vector store
        $vectorStore->deleteByKnowledgeBaseId($this->knowledgeBase->id);

        // Delete from database (cascade should handle this, but explicit is better)
        KnowledgeBaseChunk::where('knowledge_base_id', $this->knowledgeBase->id)->delete();

        Log::info('🗑️ OLD DATA CLEANED', [
            'kb_id' => $this->knowledgeBase->id
        ]);
    }

    /**
     * Get setting from database
     */
    private function getSetting(string $key, $default = null)
    {
        $setting = DB::table('settings')->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
