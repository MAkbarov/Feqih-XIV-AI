<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateAiProvidersEmbeddingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // OpenAI - Supports Embedding
        DB::table('ai_providers')
            ->where('driver', 'openai')
            ->update([
                'supports_embedding' => true,
                'embedding_model' => 'text-embedding-3-small',
                'embedding_dimension' => 1536,
            ]);

        // Google Gemini - Supports Embedding
        DB::table('ai_providers')
            ->where('driver', 'gemini')
            ->update([
                'supports_embedding' => true,
                'embedding_model' => 'text-embedding-004',
                'embedding_dimension' => 768,
            ]);

        // Anthropic - NO Embedding Support
        DB::table('ai_providers')
            ->where('driver', 'anthropic')
            ->update([
                'supports_embedding' => false,
                'embedding_model' => null,
                'embedding_dimension' => null,
            ]);

        // DeepSeek - NO Embedding Support
        DB::table('ai_providers')
            ->where('driver', 'deepseek')
            ->update([
                'supports_embedding' => false,
                'embedding_model' => null,
                'embedding_dimension' => null,
            ]);

        $this->command->info('✅ AI Providers embedding info updated!');
        $this->command->info('   OpenAI: Supports embedding (text-embedding-3-small, 1536)');
        $this->command->info('   Gemini: Supports embedding (text-embedding-004, 768)');
        $this->command->info('   Anthropic: No embedding support');
        $this->command->info('   DeepSeek: No embedding support');
    }
}
