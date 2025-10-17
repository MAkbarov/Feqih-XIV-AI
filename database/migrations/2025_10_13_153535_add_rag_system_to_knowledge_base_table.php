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
        Schema::table('knowledge_base', function (Blueprint $table) {
            $table->enum('indexing_status', ['pending', 'indexing', 'completed', 'failed'])
                  ->default('pending')
                  ->after('content');
            $table->integer('chunks_count')->default(0)->after('indexing_status');
            $table->timestamp('last_indexed_at')->nullable()->after('chunks_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('knowledge_base', function (Blueprint $table) {
            $table->dropColumn(['indexing_status', 'chunks_count', 'last_indexed_at']);
        });
    }
};
