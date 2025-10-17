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
        // Add source_url column to both possible table names for compatibility
        $tables = ['knowledge_bases', 'knowledge_base'];
        
        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'source_url')) {
                        $table->string('source_url', 1024)->nullable()->after('source');
                        \Log::info("✅ Added source_url column to {$tableName}");
                    } else {
                        \Log::info("ℹ️ source_url column already exists in {$tableName}");
                    }
                    
                    if (!Schema::hasColumn($tableName, 'metadata')) {
                        $table->json('metadata')->nullable()->after('language');
                        \Log::info("✅ Added metadata column to {$tableName}");
                    }
                    
                    if (!Schema::hasColumn($tableName, 'embedding')) {
                        $table->text('embedding')->nullable()->after('metadata');
                        \Log::info("✅ Added embedding column to {$tableName}");
                    }
                });
                break; // Only process the first existing table
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['knowledge_bases', 'knowledge_base'];
        
        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'source_url')) {
                        $table->dropColumn('source_url');
                    }
                    if (Schema::hasColumn($tableName, 'metadata')) {
                        $table->dropColumn('metadata');
                    }
                    if (Schema::hasColumn($tableName, 'embedding')) {
                        $table->dropColumn('embedding');
                    }
                });
                break;
            }
        }
    }
};
