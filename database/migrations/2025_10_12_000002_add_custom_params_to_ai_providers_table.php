<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            if (!Schema::hasColumn('ai_providers', 'custom_params')) {
                $table->text('custom_params')->nullable()->after('base_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            if (Schema::hasColumn('ai_providers', 'custom_params')) {
                $table->dropColumn('custom_params');
            }
        });
    }
};
