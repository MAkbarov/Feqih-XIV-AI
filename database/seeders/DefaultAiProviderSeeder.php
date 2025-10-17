<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\AiProvider;

class DefaultAiProviderSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providers = [
            [
                'name' => 'OpenAI GPT-4',
                'driver' => 'openai',
                'model' => 'gpt-4',
                'api_key' => '', // Empty - will be configured by admin
                'base_url' => 'https://api.openai.com/v1',
                'is_active' => false,
            ],
            [
                'name' => 'Claude Sonnet',
                'driver' => 'anthropic',
                'model' => 'claude-3-sonnet-20240229',
                'api_key' => '', // Empty - will be configured by admin
                'base_url' => 'https://api.anthropic.com',
                'is_active' => false,
            ],
            [
                'name' => 'DeepSeek Chat',
                'driver' => 'deepseek',
                'model' => 'deepseek-chat',
                'api_key' => '', // Empty - will be configured by admin
                'base_url' => 'https://api.deepseek.com/v1',
                'is_active' => false,
            ],
        ];

        foreach ($providers as $provider) {
            AiProvider::firstOrCreate(
                ['name' => $provider['name']],
                $provider
            );
        }
    }
}