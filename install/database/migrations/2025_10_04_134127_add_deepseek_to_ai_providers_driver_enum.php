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
        // First, update any existing 'custom' drivers that are actually DeepSeek back to 'deepseek'
        DB::table('ai_providers')
            ->where('driver', 'custom')
            ->where('base_url', 'like', '%deepseek.com%')
            ->update(['driver' => 'deepseek']);
            
        // Try to modify the ENUM column to include 'deepseek'
        // This will work if the column is currently an ENUM
        try {
            DB::statement("ALTER TABLE ai_providers MODIFY COLUMN driver ENUM('openai','anthropic','deepseek','custom') NOT NULL DEFAULT 'openai'");
        } catch (\Exception $e) {
            // If column is not ENUM or doesn't exist, try to make it VARCHAR
            try {
                Schema::table('ai_providers', function (Blueprint $table) {
                    $table->string('driver', 50)->default('openai')->change();
                });
            } catch (\Exception $e2) {
                // If table doesn't exist, create it
                if (!Schema::hasTable('ai_providers')) {
                    Schema::create('ai_providers', function (Blueprint $table) {
                        $table->id();
                        $table->string('name');
                        $table->string('driver', 50)->default('openai');
                        $table->string('model')->nullable();
                        $table->text('api_key')->nullable();
                        $table->string('base_url')->nullable();
                        $table->boolean('is_active')->default(false);
                        $table->timestamps();
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Update any 'deepseek' drivers back to 'custom'
        DB::table('ai_providers')
            ->where('driver', 'deepseek')
            ->update([
                'driver' => 'custom',
                'base_url' => DB::raw("COALESCE(base_url, 'https://api.deepseek.com')")
            ]);
            
        // Try to revert ENUM back to original
        try {
            DB::statement("ALTER TABLE ai_providers MODIFY COLUMN driver ENUM('openai','anthropic','custom') NOT NULL DEFAULT 'openai'");
        } catch (\Exception $e) {
            // If fails, leave as VARCHAR
        }
    }
};
