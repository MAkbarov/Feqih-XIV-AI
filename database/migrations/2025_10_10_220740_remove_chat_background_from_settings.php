<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove chat background related settings from settings table
        DB::table('settings')->whereIn('key', [
            'chat_background_type',
            'chat_background_color', 
            'chat_background_gradient',
            'chat_background_image'
        ])->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore default chat background settings if needed
        DB::table('settings')->insert([
            ['key' => 'chat_background_type', 'value' => 'default', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'chat_background_color', 'value' => '#f3f4f6', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'chat_background_gradient', 'value' => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'chat_background_image', 'value' => '', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
};
