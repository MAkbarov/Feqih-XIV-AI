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
        // DISABLED: Table name remains as 'knowledge_base' (singular)
        // Rename migration is not needed - keeping original table name
        \Log::info('ℹ️ Table rename migration DISABLED - using knowledge_base (singular)');
        return;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // DISABLED: No action needed
        return;
    }
};
