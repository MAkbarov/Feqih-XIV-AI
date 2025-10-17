<?php

namespace App\Services;

use App\Models\AiProvider;
use Illuminate\Support\Facades\Log;
use OpenAI;
use Exception;

class EmbeddingService
{
    protected $client = null;
    protected $driver = null;
    protected $model = 'text-embedding-3-small';

    public function __construct()
    {
        // Initialize client lazily to avoid database dependency during service registration
        // Client will be initialized when first needed
    }
    
    protected function initializeClient()
    {
        if ($this->client !== null) {
            return; // Already initialized
        }
        
        try {
            // Check if database is available first
            if (!\Schema::hasTable('ai_providers')) {
                Log::info('AiProvider table not available, using fallback embedding');
                return;
            }
            
            $provider = AiProvider::getActive();
            if ($provider) {
                $this->driver = $provider->driver;
                
                // Yalnız OpenAI və ya API key mövcud olan provayderlərdə embedding client yaradırıq
                if (in_array($provider->driver, ['openai', 'custom', 'deepseek']) && !empty($provider->api_key)) {
                    try {
                        $factory = OpenAI::factory()->withApiKey($provider->api_key);
                        if (!empty($provider->base_url)) {
                            $factory = $factory->withBaseUri($provider->base_url);
                        }
                        $this->client = $factory->make();
                        Log::info('✅ Embedding client yaradıldı', [
                            'driver' => $provider->driver,
                            'has_base_url' => !empty($provider->base_url)
                        ]);
                    } catch (Exception $embedEx) {
                        Log::warning('⚠️ Embedding client yaradıla bilmədi - fallback istifadə ediləcək', [
                            'driver' => $provider->driver,
                            'error' => $embedEx->getMessage()
                        ]);
                        $this->client = null;
                    }
                } else {
                    Log::info('ℹ️ Embedding üçün uyğun provayder yoxdur - fallback istifadə ediləcək', [
                        'driver' => $provider->driver ?? 'unknown',
                        'has_api_key' => !empty($provider->api_key)
                    ]);
                }
            }
        } catch (Exception $e) {
            Log::warning('EmbeddingService init failed: ' . $e->getMessage());
        }
    }

    /**
     * Return float[] embedding or null on failure
     */
    public function embed(string $text): ?array
    {
        $text = trim($text);
        if ($text === '') return null;

        // Initialize client if needed
        $this->initializeClient();
        
        // Try OpenAI-compatible embeddings first
        if ($this->client) {
            try {
                $result = $this->client->embeddings()->create([
                    'model' => $this->model,
                    'input' => $text,
                ]);
                $vec = $result->embeddings[0]->embedding ?? null;
                if (is_array($vec) && count($vec) > 0) {
                    return array_map('floatval', $vec);
                }
            } catch (Exception $e) {
                Log::warning('Embedding API failed, falling back: ' . $e->getMessage());
            }
        }

        // Fallback: simple hashed bag-of-words vector (low quality but deterministic)
        return $this->simpleHashEmbedding($text);
    }

    /**
     * Simple hash-based embedding (fixed size), fallback only
     */
    protected function simpleHashEmbedding(string $text, int $dim = 256): array
    {
        $vec = array_fill(0, $dim, 0.0);
        $tokens = preg_split('/\s+/', mb_strtolower($text));
        foreach ($tokens as $tok) {
            if ($tok === '') continue;
            $h = crc32($tok) % $dim;
            $vec[$h] += 1.0;
        }
        // L2 normalize
        $norm = 0.0;
        foreach ($vec as $v) { $norm += $v * $v; }
        $norm = sqrt($norm) ?: 1.0;
        foreach ($vec as $i => $v) { $vec[$i] = $v / $norm; }
        return $vec;
    }

    public static function cosine(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        if ($n === 0) return 0.0;
        $dot = 0.0; $na = 0.0; $nb = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }
        $den = sqrt($na) * sqrt($nb);
        return $den ? ($dot / $den) : 0.0;
    }
}
