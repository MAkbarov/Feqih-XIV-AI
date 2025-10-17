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
        // 🚀 SUPER-FAST SEARCH İNDEKSLƏRİ
        
        // Determine which table name to use (renamed to 'knowledge_bases' in later migration)
        $tableName = Schema::hasTable('knowledge_bases') ? 'knowledge_bases' : 'knowledge_base';
        
        // Check if table exists first (critical for fresh installs)
        if (!Schema::hasTable($tableName)) {
            // Table doesn't exist yet - skip this migration
            // It will be created by base migration first
            return;
        }
        
        // Helper function - index mövcuddurmu yoxla
        $indexExists = function($tableName, $indexName) {
            try {
                $indexes = \DB::select("SHOW INDEX FROM {$tableName} WHERE Key_name = ?", [$indexName]);
                return count($indexes) > 0;
            } catch (\Exception $e) {
                // Table doesn't exist or other error
                return false;
            }
        };
        
        Schema::table($tableName, function (Blueprint $table) use ($indexExists, $tableName) {
            // 1. is_active index
            if (!$indexExists($tableName, 'idx_kb_is_active')) {
                $table->index('is_active', 'idx_kb_is_active');
            }
            
            // 2. category index
            if (!$indexExists($tableName, 'idx_kb_category')) {
                $table->index('category', 'idx_kb_category');
            }
            
            // 3. source_url column və index
            if (!Schema::hasColumn($tableName, 'source_url')) {
                $table->string('source_url', 1024)->nullable()->after('source');
            }
            if (!$indexExists($tableName, 'idx_kb_source_url')) {
                $table->index('source_url', 'idx_kb_source_url');
            }
            
            // 4. Composite index
            if (!$indexExists($tableName, 'idx_kb_active_category')) {
                $table->index(['is_active', 'category'], 'idx_kb_active_category');
            }
            
            // 6. created_at index
            if (!$indexExists($tableName, 'idx_kb_created_at')) {
                $table->index('created_at', 'idx_kb_created_at');
            }
        });
        
        // 5. FULLTEXT indexes (ayrıca, exception handling ilə)
        try {
            if (!$indexExists($tableName, 'idx_kb_title_fulltext')) {
                \DB::statement("ALTER TABLE {$tableName} ADD FULLTEXT INDEX idx_kb_title_fulltext (title)");
            }
            if (!$indexExists($tableName, 'idx_kb_content_fulltext')) {
                \DB::statement("ALTER TABLE {$tableName} ADD FULLTEXT INDEX idx_kb_content_fulltext (content)");
            }
            if (!$indexExists($tableName, 'idx_kb_title_content_fulltext')) {
                \DB::statement("ALTER TABLE {$tableName} ADD FULLTEXT INDEX idx_kb_title_content_fulltext (title, content)");
            }
        } catch (\Exception $e) {
            // FULLTEXT dəstəklənməyirsə, normal index yarat
            Schema::table($tableName, function (Blueprint $table) use ($indexExists, $tableName) {
                if (!$indexExists($tableName, 'idx_kb_title')) {
                    $table->index('title', 'idx_kb_title');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Determine which table name to use
        $tableName = Schema::hasTable('knowledge_bases') ? 'knowledge_bases' : 'knowledge_base';
        
        // Check if table exists before trying to drop indexes
        if (!Schema::hasTable($tableName)) {
            return;
        }
        
        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            // Drop all indexes (with existence checks to prevent errors)
            try { $table->dropIndex('idx_kb_is_active'); } catch (\Exception $e) {}
            try { $table->dropIndex('idx_kb_category'); } catch (\Exception $e) {}
            try { $table->dropIndex('idx_kb_source_url'); } catch (\Exception $e) {}
            try { $table->dropIndex('idx_kb_active_category'); } catch (\Exception $e) {}
            try { $table->dropIndex('idx_kb_created_at'); } catch (\Exception $e) {}
            
            // Drop FULLTEXT indexes
            try {
                \DB::statement("ALTER TABLE {$tableName} DROP INDEX idx_kb_title_fulltext");
            } catch (\Exception $e) {}
            try {
                \DB::statement("ALTER TABLE {$tableName} DROP INDEX idx_kb_content_fulltext");
            } catch (\Exception $e) {}
            try {
                \DB::statement("ALTER TABLE {$tableName} DROP INDEX idx_kb_title_content_fulltext");
            } catch (\Exception $e) {}
            try {
                $table->dropIndex('idx_kb_title');
            } catch (\Exception $e) {}
        });
    }
};
