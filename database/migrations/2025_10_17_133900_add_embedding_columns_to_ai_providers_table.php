<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            if (!Schema::hasColumn('ai_providers', 'supports_embedding')) {
                $table->boolean('supports_embedding')->default(false)->after('base_url');
            }
            if (!Schema::hasColumn('ai_providers', 'embedding_model')) {
                $table->string('embedding_model', 255)->nullable()->after('supports_embedding');
            }
            if (!Schema::hasColumn('ai_providers', 'embedding_base_url')) {
                $table->string('embedding_base_url', 255)->nullable()->after('embedding_model');
            }
            if (!Schema::hasColumn('ai_providers', 'embedding_dimension')) {
                $table->integer('embedding_dimension')->nullable()->after('embedding_base_url');
            }
            if (Schema::hasColumn('ai_providers', 'driver')) {
                // Ensure driver column can hold longer values
                try {
                    $table->string('driver', 255)->change();
                } catch (\Throwable $e) {
                    // ignore if platform doesn't support change in this context
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            if (Schema::hasColumn('ai_providers', 'embedding_dimension')) {
                $table->dropColumn('embedding_dimension');
            }
            if (Schema::hasColumn('ai_providers', 'embedding_base_url')) {
                $table->dropColumn('embedding_base_url');
            }
            if (Schema::hasColumn('ai_providers', 'embedding_model')) {
                $table->dropColumn('embedding_model');
            }
            if (Schema::hasColumn('ai_providers', 'supports_embedding')) {
                $table->dropColumn('supports_embedding');
            }
        });
    }
};
