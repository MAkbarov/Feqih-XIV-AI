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
        Schema::table('ai_providers', function (Blueprint $table) {
            $table->boolean('supports_embedding')->default(false)->after('is_active');
            $table->string('embedding_model')->nullable()->after('supports_embedding');
            $table->integer('embedding_dimension')->nullable()->after('embedding_model');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            $table->dropColumn(['supports_embedding', 'embedding_model', 'embedding_dimension']);
        });
    }
};
