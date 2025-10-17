<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Interfaces\EmbeddingProviderInterface;
use App\Interfaces\VectorStoreInterface;
use App\Models\AiProvider;
use Illuminate\Support\Facades\Log;

class RAGHealthController extends Controller
{
    /**
     * Check active embedding provider connection
     */
    public function checkEmbeddingProvider(EmbeddingProviderInterface $provider)
    {
        $activeProvider = AiProvider::where('is_active', true)->first();
        
        if (!$activeProvider) {
            return response()->json([
                'success' => false,
                'message' => 'Aktiv AI Provider tapılmadı',
                'status' => 'error'
            ], 400);
        }

        if (!$activeProvider->supports_embedding) {
            return response()->json([
                'success' => false,
                'message' => "Aktiv provider ({$activeProvider->name}) embedding dəstəkləmir. RAG üçün embedding lazımdır.",
                'provider' => $activeProvider->name,
                'driver' => $activeProvider->driver,
                'status' => 'not_supported'
            ], 400);
        }

        try {
            // Try to generate a simple embedding
            $embedding = $provider->generateEmbedding("test");
            
            if (is_array($embedding) && count($embedding) > 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Embedding provider ({$activeProvider->name}) bağlantısı aktiv",
                    'provider' => $activeProvider->name,
                    'model' => $activeProvider->embedding_model,
                    'dimension' => count($embedding),
                    'status' => 'connected'
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Provider cavab verdi, amma embedding yaradılmadı',
                'status' => 'warning'
            ], 500);
            
        } catch (\Exception $e) {
            Log::error('Embedding Provider Health Check Failed', [
                'provider' => $activeProvider->name,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => "Embedding provider ({$activeProvider->name}) bağlantı xətası: " . $e->getMessage(),
                'provider' => $activeProvider->name,
                'status' => 'error'
            ], 500);
        }
    }

    /**
     * Check Pinecone connection
     */
    public function checkPinecone(VectorStoreInterface $vectorStore)
    {
        try {
            $healthy = $vectorStore->healthCheck();
            
            if ($healthy) {
                return response()->json([
                    'success' => true,
                    'message' => 'Pinecone bağlantısı aktiv',
                    'status' => 'connected',
                    'base_url' => method_exists($vectorStore, 'getBaseUrl') ? $vectorStore->getBaseUrl() : null,
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Pinecone bağlantı problemi',
                'status' => 'error',
                'base_url' => method_exists($vectorStore, 'getBaseUrl') ? $vectorStore->getBaseUrl() : null,
            ], 500);
            
        } catch (\Exception $e) {
            Log::error('Pinecone Health Check Failed', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Pinecone bağlantı xətası: ' . $e->getMessage(),
                'status' => 'error',
                'base_url' => method_exists($vectorStore, 'getBaseUrl') ? $vectorStore->getBaseUrl() : null,
            ], 500);
        }
    }

    /**
     * Check RAG system overall health
     */
    public function checkRAGSystem(
        EmbeddingProviderInterface $embeddingProvider,
        VectorStoreInterface $vectorStore
    ) {
        $activeProvider = AiProvider::where('is_active', true)->first();
        
        $results = [
            'embedding_provider' => ['status' => 'unknown', 'message' => '', 'name' => $activeProvider ? $activeProvider->name : 'Unknown'],
            'pinecone' => ['status' => 'unknown', 'message' => ''],
            'overall' => ['status' => 'unknown', 'message' => '']
        ];

        // Check Active Embedding Provider
        if (!$activeProvider) {
            $results['embedding_provider'] = [
                'status' => 'error',
                'message' => 'Aktiv AI Provider tapılmadı',
                'name' => 'None'
            ];
        } elseif (!$activeProvider->supports_embedding) {
            $results['embedding_provider'] = [
                'status' => 'not_supported',
                'message' => "Embedding dəstəkləmir",
                'name' => $activeProvider->name
            ];
        } else {
            try {
                $embedding = $embeddingProvider->generateEmbedding("test");
                if (is_array($embedding) && count($embedding) > 0) {
                    $results['embedding_provider'] = [
                        'status' => 'connected',
                        'message' => 'Aktiv',
                        'name' => $activeProvider->name,
                        'model' => $activeProvider->embedding_model,
                        'dimension' => count($embedding)
                    ];
                } else {
                    $results['embedding_provider'] = [
                        'status' => 'warning',
                        'message' => 'Cavab alındı, amma embedding yaradılmadı',
                        'name' => $activeProvider->name
                    ];
                }
            } catch (\Exception $e) {
                $results['embedding_provider'] = [
                    'status' => 'error',
                    'message' => $e->getMessage(),
                    'name' => $activeProvider->name
                ];
            }
        }

        // Check Pinecone
        try {
            $healthy = $vectorStore->healthCheck();
            $results['pinecone'] = [
                'status' => $healthy ? 'connected' : 'error',
                'message' => $healthy ? 'Aktiv' : 'Bağlantı problemi'
            ];
        } catch (\Exception $e) {
            $results['pinecone'] = [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }

        // Overall status
        $allConnected = $results['embedding_provider']['status'] === 'connected' 
                     && $results['pinecone']['status'] === 'connected';
        
        $results['overall'] = [
            'status' => $allConnected ? 'healthy' : 'unhealthy',
            'message' => $allConnected 
                ? 'RAG sistemi tam aktiv' 
                : 'RAG sistemə problemlər var'
        ];

        return response()->json([
            'success' => $allConnected,
            'results' => $results
        ]);
    }

    /**
     * Check if RAG can be enabled (active provider supports embedding)
     */
    public function checkCompatibility()
    {
        $activeProvider = AiProvider::where('is_active', true)->first();

        if (!$activeProvider) {
            return response()->json([
                'can_enable' => false,
                'reason' => 'no_active_provider',
                'message' => 'Aktiv AI Provider tapılmadı. Zəhmət olmasa AI Providers səhifəsindən bir provider aktivləşdirin.',
                'action' => 'activate_provider'
            ], 400);
        }

        if (!$activeProvider->supports_embedding) {
            return response()->json([
                'can_enable' => false,
                'reason' => 'no_embedding_support',
                'message' => "Aktiv provider ({$activeProvider->name}) embedding dəstəkləmir. RAG sistemi üçün embedding lazımdır.",
                'current_provider' => [
                    'id' => $activeProvider->id,
                    'name' => $activeProvider->name,
                    'driver' => $activeProvider->driver,
                    'supports_embedding' => false
                ],
                'action' => 'change_provider',
                'compatible_providers' => $this->getCompatibleProviders()
            ], 400);
        }

        // Auto-fix: If supports_embedding=true but embedding_model or embedding_dimension is missing
        if ($activeProvider->supports_embedding && (!$activeProvider->embedding_model || !$activeProvider->embedding_dimension)) {
            // Auto-detect based on driver
            if (!$activeProvider->embedding_model) {
                if (strtolower($activeProvider->driver) === 'openai') {
                    $activeProvider->embedding_model = 'text-embedding-3-small';
                } elseif (strtolower($activeProvider->driver) === 'deepseek') {
                    $activeProvider->embedding_model = 'deepseek-embed';
                } elseif (strtolower($activeProvider->driver) === 'gemini') {
                    $activeProvider->embedding_model = 'models/embedding-001';
                } elseif (strtolower($activeProvider->driver) === 'anthropic') {
                    $activeProvider->embedding_model = 'voyage-2';
                }
            }

            // Auto-detect dimension based on model
            if (!$activeProvider->embedding_dimension && $activeProvider->embedding_model) {
                $dimension = 1536; // default
                if (str_contains($activeProvider->embedding_model, 'text-embedding-3-large')) {
                    $dimension = 3072;
                } elseif (str_contains($activeProvider->embedding_model, 'text-embedding-ada-002')) {
                    $dimension = 1536;
                } elseif (str_contains($activeProvider->embedding_model, 'text-embedding-3-small')) {
                    $dimension = 1536;
                } elseif (str_contains($activeProvider->embedding_model, 'deepseek-embed')) {
                    $dimension = 1536;
                } elseif (str_contains($activeProvider->embedding_model, 'embedding-001')) {
                    $dimension = 768;
                } elseif (str_contains($activeProvider->embedding_model, 'voyage')) {
                    $dimension = 1024;
                }
                $activeProvider->embedding_dimension = $dimension;
            }

            // Save changes
            $activeProvider->save();
            
            Log::info('Auto-fixed embedding configuration', [
                'provider' => $activeProvider->name,
                'embedding_model' => $activeProvider->embedding_model,
                'embedding_dimension' => $activeProvider->embedding_dimension
            ]);
        }

        return response()->json([
            'can_enable' => true,
            'message' => 'RAG sistemi aktivləşdirilə bilər!',
            'active_provider' => [
                'id' => $activeProvider->id,
                'name' => $activeProvider->name,
                'driver' => $activeProvider->driver,
                'supports_embedding' => true,
                'embedding_model' => $activeProvider->embedding_model,
                'embedding_dimension' => $activeProvider->embedding_dimension
            ]
        ]);
    }

    /**
     * Get list of embedding-compatible providers
     */
    private function getCompatibleProviders()
    {
        return AiProvider::where('supports_embedding', true)
            ->get(['id', 'name', 'driver', 'embedding_model', 'is_active'])
            ->map(function ($provider) {
                return [
                    'id' => $provider->id,
                    'name' => $provider->name,
                    'driver' => $provider->driver,
                    'embedding_model' => $provider->embedding_model,
                    'is_active' => $provider->is_active
                ];
            });
    }

    /**
     * Get all embedding-compatible providers
     */
    public function getEmbeddingProviders()
    {
        $providers = AiProvider::where('supports_embedding', true)
            ->get(['id', 'name', 'driver', 'embedding_model', 'embedding_dimension', 'is_active']);

        return response()->json([
            'providers' => $providers,
            'active_provider_id' => AiProvider::where('is_active', true)->value('id')
        ]);
    }
}
