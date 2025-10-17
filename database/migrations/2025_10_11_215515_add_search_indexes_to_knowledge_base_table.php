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
        
        // Helper function - index mövcuddurmu yoxla
        $indexExists = function($tableName, $indexName) {
            $indexes = \DB::select("SHOW INDEX FROM {$tableName} WHERE Key_name = ?", [$indexName]);
            return count($indexes) > 0;
        };
        
        Schema::table('knowledge_base', function (Blueprint $table) use ($indexExists) {
            // 1. is_active index
            if (!$indexExists('knowledge_base', 'idx_kb_is_active')) {
                $table->index('is_active', 'idx_kb_is_active');
            }
            
            // 2. category index
            if (!$indexExists('knowledge_base', 'idx_kb_category')) {
                $table->index('category', 'idx_kb_category');
            }
            
            // 3. source_url column və index
            if (!Schema::hasColumn('knowledge_base', 'source_url')) {
                $table->string('source_url', 1024)->nullable()->after('source');
            }
            if (!$indexExists('knowledge_base', 'idx_kb_source_url')) {
                $table->index('source_url', 'idx_kb_source_url');
            }
            
            // 4. Composite index
            if (!$indexExists('knowledge_base', 'idx_kb_active_category')) {
                $table->index(['is_active', 'category'], 'idx_kb_active_category');
            }
            
            // 6. created_at index
            if (!$indexExists('knowledge_base', 'idx_kb_created_at')) {
                $table->index('created_at', 'idx_kb_created_at');
            }
        });
        
        // 5. FULLTEXT indexes (ayrıca, exception handling ilə)
        try {
            if (!$indexExists('knowledge_base', 'idx_kb_title_fulltext')) {
                \DB::statement('ALTER TABLE knowledge_base ADD FULLTEXT INDEX idx_kb_title_fulltext (title)');
            }
            if (!$indexExists('knowledge_base', 'idx_kb_content_fulltext')) {
                \DB::statement('ALTER TABLE knowledge_base ADD FULLTEXT INDEX idx_kb_content_fulltext (content)');
            }
            if (!$indexExists('knowledge_base', 'idx_kb_title_content_fulltext')) {
                \DB::statement('ALTER TABLE knowledge_base ADD FULLTEXT INDEX idx_kb_title_content_fulltext (title, content)');
            }
        } catch (\Exception $e) {
            // FULLTEXT dəstəklənməyirsə, normal index yarat
            Schema::table('knowledge_base', function (Blueprint $table) use ($indexExists) {
                if (!$indexExists('knowledge_base', 'idx_kb_title')) {
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
        Schema::table('knowledge_base', function (Blueprint $table) {
            // Drop all indexes
            $table->dropIndex('idx_kb_is_active');
            $table->dropIndex('idx_kb_category');
            $table->dropIndex('idx_kb_source_url');
            $table->dropIndex('idx_kb_active_category');
            $table->dropIndex('idx_kb_created_at');
            
            // Drop FULLTEXT indexes
            try {
                \DB::statement('ALTER TABLE knowledge_base DROP INDEX idx_kb_title_fulltext');
                \DB::statement('ALTER TABLE knowledge_base DROP INDEX idx_kb_content_fulltext');
                \DB::statement('ALTER TABLE knowledge_base DROP INDEX idx_kb_title_content_fulltext');
            } catch (\Exception $e) {
                $table->dropIndex('idx_kb_title');
            }
        });
    }
};
