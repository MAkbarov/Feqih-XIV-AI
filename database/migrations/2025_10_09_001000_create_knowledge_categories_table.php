<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Check if table already exists (for hosting deployments)
        if (!Schema::hasTable('knowledge_categories')) {
            Schema::create('knowledge_categories', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique(); // stable key, e.g., 'fiqh'
                $table->string('name'); // localized display name
                $table->string('locale', 10)->default('az');
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        } else {
            // Table exists, ensure columns are correct
            Schema::table('knowledge_categories', function (Blueprint $table) {
                // Add missing columns if they don't exist
                if (!Schema::hasColumn('knowledge_categories', 'key')) {
                    $table->string('key')->unique()->after('id');
                }
                if (!Schema::hasColumn('knowledge_categories', 'locale')) {
                    $table->string('locale', 10)->default('az')->after('name');
                }
                if (!Schema::hasColumn('knowledge_categories', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('locale');
                }
                if (!Schema::hasColumn('knowledge_categories', 'sort_order')) {
                    $table->unsignedInteger('sort_order')->default(0)->after('is_active');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_categories');
    }
};