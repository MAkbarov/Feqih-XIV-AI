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
        Schema::table('users', function (Blueprint $table) {
            // Remove old background fields - we now only use active_background_type
            $table->dropColumn([
                'chat_background_color',
                'chat_background_image', 
                'chat_background_size',
                'chat_background_position'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore old background fields if needed
            $table->text('chat_background_color')->nullable()->after('email_verified_at');
            $table->string('chat_background_image')->nullable()->after('chat_background_color');
            $table->string('chat_background_size')->default('cover')->after('chat_background_image');
            $table->string('chat_background_position')->default('center')->after('chat_background_size');
        });
    }
};
