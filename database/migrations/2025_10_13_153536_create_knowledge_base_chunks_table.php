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
        Schema::create('knowledge_base_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('knowledge_base_id')
                  ->constrained('knowledge_base')
                  ->onDelete('cascade');
            $table->text('content');
            $table->integer('char_count');
            $table->integer('chunk_index')->default(0);
            $table->string('vector_id')->nullable()->index(); // Pinecone/Weaviate vector ID
            $table->timestamps();
            
            $table->index(['knowledge_base_id', 'chunk_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_base_chunks');
    }
};
