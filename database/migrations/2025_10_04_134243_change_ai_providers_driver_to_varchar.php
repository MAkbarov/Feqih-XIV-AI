<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change driver column from ENUM to VARCHAR to support 'deepseek'
        if (Schema::hasTable('ai_providers')) {
            try {
                DB::statement('ALTER TABLE ai_providers MODIFY COLUMN driver VARCHAR(50) DEFAULT "openai"');
            } catch (\Exception $e) {
                // Fallback: use Laravel schema builder
                Schema::table('ai_providers', function (Blueprint $table) {
                    $table->string('driver', 50)->default('openai')->change();
                });
            }

            // Now update any DeepSeek providers that were stored as 'custom'
            DB::table('ai_providers')
                ->where('driver', 'custom')
                ->where('base_url', 'like', '%deepseek.com%')
                ->update(['driver' => 'deepseek']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Update any 'deepseek' drivers back to 'custom'
        if (Schema::hasTable('ai_providers')) {
            DB::table('ai_providers')
                ->where('driver', 'deepseek')
                ->update([
                    'driver' => 'custom',
                    'base_url' => DB::raw("COALESCE(base_url, 'https://api.deepseek.com')")
                ]);
        }
    }
};
