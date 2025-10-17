<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if old table exists and new table doesn't exist
        if (Schema::hasTable('knowledge_base') && !Schema::hasTable('knowledge_bases')) {
            Schema::rename('knowledge_base', 'knowledge_bases');
            \Log::info('✅ Table renamed: knowledge_base → knowledge_bases');
        } else {
            \Log::info('ℹ️ Table rename skipped - knowledge_bases already exists or knowledge_base not found');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse: rename back to original name
        if (Schema::hasTable('knowledge_bases') && !Schema::hasTable('knowledge_base')) {
            Schema::rename('knowledge_bases', 'knowledge_base');
            \Log::info('✅ Table renamed back: knowledge_bases → knowledge_base');
        }
    }
};
