<?php

namespace App\Services;

use App\Interfaces\VectorStoreInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PineconeVectorStore implements VectorStoreInterface
{
    private string $apiKey;
    private string $environment;
    private string $indexName;
    private string $baseUrl;

    public function getBaseUrl(): string
    {
        return $this->baseUrl ?? '';
    }

    public function __construct()
    {
        $this->apiKey = $this->getSetting('pinecone_api_key', '');
        $this->environment = $this->getSetting('pinecone_environment', '');
        $this->indexName = $this->getSetting('pinecone_index_name', 'chatbot-knowledge');
        
        // Get custom host URL or construct default
        $customHost = $this->getSetting('pinecone_host', '');
        
        if (!empty($customHost)) {
            // Use custom host URL directly
            $this->baseUrl = rtrim($customHost, '/');
            
            Log::info('Pinecone VectorStore initialized (custom host)', [
                'base_url' => $this->baseUrl
            ]);
        } else {
            // Construct default Pinecone URL - REQUIRES environment
            if (empty($this->environment)) {
                Log::error('Pinecone konfiqurasiya xətası', [
                    'message' => 'pinecone_host VƏ YA pinecone_environment təyin edilməlidir'
                ]);
                
                // Default qeyri-keçərli URL - healthCheck xəta verəcək
                $this->baseUrl = 'https://invalid-pinecone-config';
            } else {
                $this->baseUrl = "https://{$this->indexName}-{$this->environment}.svc.pinecone.io";
                
                Log::info('Pinecone VectorStore initialized (auto URL)', [
                    'base_url' => $this->baseUrl,
                    'environment' => $this->environment,
                    'index' => $this->indexName
                ]);
            }
        }
    }

    private function getSetting(string $key, $default = null)
    {
        $setting = DB::table('settings')->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public function upsert(array $vectorsWithMetadata): bool
    {
        try {
            // Pinecone expects vectors in this format:
            // {'vectors': [{'id': 'vec1', 'values': [...], 'metadata': {...}}]}
            
            $vectors = [];
            foreach ($vectorsWithMetadata as $item) {
                $vectors[] = [
                    'id' => (string)$item['id'],
                    'values' => $item['vector'],
                    'metadata' => $item['metadata'] ?? []
                ];
            }

            $response = Http::timeout(30)
                ->withHeaders([
                    'Api-Key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/vectors/upsert', [
                    'vectors' => $vectors,
                    'namespace' => '' // Use default namespace
                ]);

            if (!$response->successful()) {
                Log::error('Pinecone Upsert Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'count' => count($vectors)
                ]);
                return false;
            }

            Log::info('Pinecone Upsert Success', [
                'count' => count($vectors),
                'response' => $response->json()
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Pinecone Upsert Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    public function query(array $vector, int $topK, array $filter = []): array
    {
        try {
            $requestData = [
                'vector' => $vector,
                'topK' => $topK,
                'includeMetadata' => true,
                'namespace' => ''
            ];

            if (!empty($filter)) {
                $requestData['filter'] = $filter;
            }

            $response = Http::timeout(30)
                ->withHeaders([
                    'Api-Key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/query', $requestData);

            if (!$response->successful()) {
                Log::error('Pinecone Query Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [];
            }

            $data = $response->json();
            
            // Transform Pinecone response to our format
            $results = [];
            if (isset($data['matches'])) {
                foreach ($data['matches'] as $match) {
                    $results[] = [
                        'id' => $match['id'],
                        'score' => $match['score'] ?? 0,
                        'metadata' => $match['metadata'] ?? []
                    ];
                }
            }

            Log::info('Pinecone Query Success', [
                'results_count' => count($results),
                'top_score' => $results[0]['score'] ?? 0
            ]);

            return $results;

        } catch (\Exception $e) {
            Log::error('Pinecone Query Exception', [
                'message' => $e->getMessage()
            ]);
            return [];
        }
    }

    public function delete(array $ids): bool
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Api-Key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/vectors/delete', [
                    'ids' => array_map('strval', $ids),
                    'namespace' => ''
                ]);

            if (!$response->successful()) {
                Log::error('Pinecone Delete Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return false;
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Pinecone Delete Exception', [
                'message' => $e->getMessage()
            ]);
            return false;
        }
    }

    public function deleteByKnowledgeBaseId(int $knowledgeBaseId): bool
    {
        try {
            // Delete by metadata filter
            $response = Http::timeout(30)
                ->withHeaders([
                    'Api-Key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/vectors/delete', [
                    'filter' => [
                        'knowledge_base_id' => ['$eq' => $knowledgeBaseId]
                    ],
                    'namespace' => ''
                ]);

            if (!$response->successful()) {
                Log::error('Pinecone Delete By KB ID Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'kb_id' => $knowledgeBaseId
                ]);
                return false;
            }

            Log::info('Pinecone Delete By KB ID Success', [
                'kb_id' => $knowledgeBaseId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Pinecone Delete By KB ID Exception', [
                'message' => $e->getMessage(),
                'kb_id' => $knowledgeBaseId
            ]);
            return false;
        }
    }

    public function healthCheck(): bool
    {
        try {
            // Koňfigurasiya yoxla
            if (empty($this->apiKey)) {
                Log::error('Pinecone Health Check Failed: API Key yoxdur');
                throw new \Exception('Pinecone API Key təyin edilməyib');
            }

            if (empty($this->baseUrl) || $this->baseUrl === 'https://invalid-pinecone-config') {
                Log::error('Pinecone Health Check Failed: Konfiqurasiya tam deyil');
                throw new \Exception(
                    'Pinecone konfiqurasiyası tam deyil. Zəhmət olmasa "Host URL" SAHƏSİNİ tam olaraq doldurun '
                    . 'VƏ YA "Environment" və "Index Name" sahələrini doldurun.'
                );
            }

            Log::info('Pinecone Health Check Başladı', [
                'base_url' => $this->baseUrl,
                'api_key_length' => strlen($this->apiKey),
                'api_key_prefix' => substr($this->apiKey, 0, 10) . '...'
            ]);

            $response = Http::timeout(10)
                ->withHeaders([
                    'Api-Key' => $this->apiKey,
                ])
                ->get($this->baseUrl . '/describe_index_stats');

            if (!$response->successful()) {
                Log::error('Pinecone Health Check HTTP Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'url' => $this->baseUrl . '/describe_index_stats'
                ]);
                
                throw new \Exception(
                    "Pinecone HTTP xətası: {$response->status()} - " . $response->body()
                );
            }

            Log::info('Pinecone Health Check Uğurlu', [
                'response' => $response->json()
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Pinecone Health Check Exception', [
                'message' => $e->getMessage(),
                'base_url' => $this->baseUrl ?? 'undefined',
                'has_api_key' => !empty($this->apiKey)
            ]);
            
            // Exception-u yenidən throw et ki, controller dətailə ulaşsın
            throw $e;
        }
    }
}
