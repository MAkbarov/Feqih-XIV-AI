<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            if (!Schema::hasColumn('ai_providers', 'embedding_model')) {
                $table->string('embedding_model')->nullable()->after('model');
            }
            if (!Schema::hasColumn('ai_providers', 'embedding_base_url')) {
                $table->string('embedding_base_url')->nullable()->after('embedding_model');
            }
        });
    }

    public function down()
    {
        Schema::table('ai_providers', function (Blueprint $table) {
            $table->dropColumn(['embedding_model', 'embedding_base_url']);
        });
    }
};