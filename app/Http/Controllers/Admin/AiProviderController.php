<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Admin\Traits\HasFooterData;
use Illuminate\Support\Facades\Schema;

class AiProviderController extends Controller
{
    use HasFooterData;
    public function index(): Response
    {
        $columns = ['id','name','driver','model','base_url','is_active'];
        
        // Dinamik olaraq mövcud sütunları əlavə et
        if (Schema::hasColumn('ai_providers', 'custom_params')) {
            $columns[] = 'custom_params';
        }
        if (Schema::hasColumn('ai_providers', 'embedding_model')) {
            $columns[] = 'embedding_model';
        }
        if (Schema::hasColumn('ai_providers', 'embedding_base_url')) {
            $columns[] = 'embedding_base_url';
        }
        if (Schema::hasColumn('ai_providers', 'embedding_dimension')) {
            $columns[] = 'embedding_dimension';
        }
        
        return Inertia::render('Admin/Providers/Index', $this->addFooterDataToResponse([
            // Select only non-sensitive columns to avoid decrypting api_key during listing
            'providers' => AiProvider::select($columns)
                ->orderByDesc('is_active')
                ->get(),
        ]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'driver' => 'required|in:openai,anthropic,deepseek,gemini,custom',
            'model' => 'nullable|string|max:255',
            'api_key' => 'nullable|string|max:8192',
            'base_url' => 'nullable|url',
            // RAG/Embedding spesifik sahələr
            'embedding_model' => 'nullable|string|max:255',
            'embedding_base_url' => 'nullable|url',
            'embedding_dimension' => 'nullable|integer|min:128|max:4096',
            // Optional per-model caps for custom providers
            'context_window' => 'nullable|integer|min:1024|max:2000000',
            'max_output' => 'nullable|integer|min:1|max:32768',
            'is_active' => 'boolean',
        ]);

        // Set default values for DeepSeek
        if (($data['driver'] ?? '') === 'deepseek') {
            // DeepSeek is OpenAI-compatible, set default values
            $data['base_url'] = $data['base_url'] ?: 'https://api.deepseek.com/v1';
            if (empty($data['model'])) {
                $data['model'] = 'deepseek-chat'; // sensible default model name
            }
        }

        if (!empty($data['is_active'])) {
            AiProvider::query()->update(['is_active' => false]);
        }

        // Auto-detect embedding configuration if missing
        $data = $this->autoDetectEmbeddingConfig($data);

        // Pack custom_params JSON
        $custom = [];
        if (!empty($data['context_window'])) { $custom['context_window'] = (int)$data['context_window']; }
        if (!empty($data['max_output'])) { $custom['max_output'] = (int)$data['max_output']; }
        if (!empty($custom) && Schema::hasColumn('ai_providers', 'custom_params')) {
            $data['custom_params'] = json_encode($custom);
        }
        unset($data['context_window'], $data['max_output']);

        AiProvider::create($data);

        return back()->with('success', 'Provider saved');
    }

    public function update(Request $request, AiProvider $provider)
    {
        // Check if this is just a toggle request (only is_active field)
        if ($request->has('is_active') && count($request->except(['_token', '_method'])) === 1) {
            $isActive = $request->boolean('is_active');
            
            // If activating this provider, deactivate all others first
            if ($isActive) {
                AiProvider::where('id', '!=', $provider->id)->update(['is_active' => false]);
            }
            
            // Update the provider status
            $provider->update(['is_active' => $isActive]);
            
            // Return Inertia response, not JSON
            return back()->with('success', $isActive ? 'Provayder aktivləşdirildi' : 'Provayder deaktivləşdirildi');
        }
        
        // Full update validation for form edits
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'driver' => 'required|in:openai,anthropic,deepseek,gemini,custom',
            'model' => 'nullable|string|max:255',
            'api_key' => 'nullable|string|max:8192',
            'base_url' => 'nullable|url',
            // RAG/Embedding spesifik sahələr
            'embedding_model' => 'nullable|string|max:255',
            'embedding_base_url' => 'nullable|url',
            'embedding_dimension' => 'nullable|integer|min:128|max:4096',
            'context_window' => 'nullable|integer|min:1024|max:2000000',
            'max_output' => 'nullable|integer|min:1|max:32768',
            'is_active' => 'boolean',
        ]);

        // Set default values for DeepSeek
        if (($data['driver'] ?? '') === 'deepseek') {
            // DeepSeek is OpenAI-compatible, set default values
            $data['base_url'] = $data['base_url'] ?: 'https://api.deepseek.com/v1';
            if (empty($data['model'])) {
                $data['model'] = 'deepseek-chat';
            }
        }

        // If API key is empty in edit mode, don't update it
        if (empty($data['api_key'])) {
            unset($data['api_key']);
        }

        // If setting as active, deactivate all others
        if (!empty($data['is_active'])) {
            AiProvider::where('id', '!=', $provider->id)->update(['is_active' => false]);
        }

        // Auto-detect embedding configuration if missing
        $data = $this->autoDetectEmbeddingConfig($data);

        // Merge into custom_params
        $custom = [];
        if (!empty($data['context_window'])) { $custom['context_window'] = (int)$data['context_window']; }
        if (!empty($data['max_output'])) { $custom['max_output'] = (int)$data['max_output']; }
        unset($data['context_window'], $data['max_output']);

        if (!empty($custom) && Schema::hasColumn('ai_providers', 'custom_params')) {
            $existing = [];
            if ($provider->custom_params) {
                $ex = json_decode($provider->custom_params, true);
                if (is_array($ex)) { $existing = $ex; }
            }
            $data['custom_params'] = json_encode(array_merge($existing, $custom));
        }

        $provider->update($data);

        return back()->with('success', 'Provayder yeniləndi');
    }

    public function destroy(AiProvider $provider)
    {
        $provider->delete();
        return back()->with('success', 'Provider deleted');
    }

    /**
     * Auto-detect and set embedding configuration based on driver
     */
    private function autoDetectEmbeddingConfig(array $data): array
    {
        $driver = strtolower($data['driver'] ?? '');

        // Auto-detect embedding_model if not provided
        if (empty($data['embedding_model'])) {
            switch ($driver) {
                case 'openai':
                    $data['embedding_model'] = 'text-embedding-3-small';
                    break;
                case 'deepseek':
                    $data['embedding_model'] = 'deepseek-embed';
                    break;
                case 'gemini':
                    $data['embedding_model'] = 'models/embedding-001';
                    break;
                case 'anthropic':
                    $data['embedding_model'] = 'voyage-2';
                    break;
            }
        }

        // Auto-detect embedding_dimension based on model if not provided
        if (empty($data['embedding_dimension']) && !empty($data['embedding_model'])) {
            $model = $data['embedding_model'];
            $dimension = 1536; // default

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

            $data['embedding_dimension'] = $dimension;
        }

        // Auto-set embedding_base_url for OpenAI if not provided
        if (empty($data['embedding_base_url']) && $driver === 'openai') {
            $data['embedding_base_url'] = 'https://api.openai.com/v1';
        }

        // Auto-set supports_embedding to true for known providers
        if (in_array($driver, ['openai', 'deepseek', 'gemini', 'anthropic'])) {
            $data['supports_embedding'] = true;
        }

        return $data;
    }
}

