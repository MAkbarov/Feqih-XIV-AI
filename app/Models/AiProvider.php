<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class AiProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'driver',
        'model',
        'api_key',
        'base_url',
        'custom_params',
        'is_active',
        'supports_embedding',
        'embedding_model',
        'embedding_dimension',
        'embedding_base_url' // RAG/Embedding üçün ayrı base URL
    ];

    /**
     * Boot method to auto-detect embedding configuration
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-fix embedding config before saving
        static::saving(function ($provider) {
            $driver = strtolower($provider->driver ?? '');

            // Auto-set supports_embedding for known providers
            if (in_array($driver, ['openai', 'deepseek', 'gemini', 'anthropic']) && $provider->supports_embedding === null) {
                $provider->supports_embedding = true;
            }

            // Auto-detect embedding_model if missing
            if ($provider->supports_embedding && empty($provider->embedding_model)) {
                switch ($driver) {
                    case 'openai':
                        $provider->embedding_model = 'text-embedding-3-small';
                        break;
                    case 'deepseek':
                        $provider->embedding_model = 'deepseek-embed';
                        break;
                    case 'gemini':
                        $provider->embedding_model = 'models/embedding-001';
                        break;
                    case 'anthropic':
                        $provider->embedding_model = 'voyage-2';
                        break;
                }
            }

            // Auto-detect embedding_dimension based on model if missing
            if ($provider->supports_embedding && empty($provider->embedding_dimension) && !empty($provider->embedding_model)) {
                $dimension = 1536; // default
                $model = $provider->embedding_model;

                if (str_contains($model, 'text-embedding-3-large')) {
                    $dimension = 3072;
                } elseif (str_contains($model, 'text-embedding-ada-002')) {
                    $dimension = 1536;
                } elseif (str_contains($model, 'text-embedding-3-small')) {
                    $dimension = 1536;
                } elseif (str_contains($model, 'deepseek-embed')) {
                    $dimension = 1536;
                } elseif (str_contains($model, 'embedding-001')) {
                    $dimension = 768;
                } elseif (str_contains($model, 'voyage')) {
                    $dimension = 1024;
                }

                $provider->embedding_dimension = $dimension;
            }

            // Auto-set embedding_base_url for OpenAI if missing
            if ($driver === 'openai' && empty($provider->embedding_base_url)) {
                $provider->embedding_base_url = 'https://api.openai.com/v1';
            }
        });
    }

    protected $casts = [
        'is_active' => 'boolean',
        'supports_embedding' => 'boolean',
    ];

    // Encrypt API key on set
    public function setApiKeyAttribute(?string $value): void
    {
        if ($value !== null && $value !== '') {
            $this->attributes['api_key'] = Crypt::encryptString($value);
        } elseif ($value === null) {
            $this->attributes['api_key'] = null;
        }
        // If empty string, don't change existing value
    }

    // Decrypt API key on get
    public function getApiKeyAttribute(?string $value): ?string
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            // If decryption fails (e.g., APP_KEY changed), do not break the UI
            return null;
        }
    }

    public static function getActive(): ?self
    {
        return static::where('is_active', true)->first();
    }
    
    /**
     * Get messages associated with this provider
     */
    public function messages()
    {
        // This is a conceptual relationship - we might need to track which provider was used for each message
        // For now, this returns an empty relation to prevent errors
        return $this->hasMany(Message::class, 'ai_provider_id');
    }
}
