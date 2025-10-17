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
        Schema::table('user_backgrounds', function (Blueprint $table) {
            // First, update the enum to include 'default'
            $table->dropColumn('active_type');
        });
        
        Schema::table('user_backgrounds', function (Blueprint $table) {
            $table->enum('active_type', ['solid', 'gradient', 'image', 'default'])->default('solid')->after('user_id');
        });
        
        Schema::table('user_backgrounds', function (Blueprint $table) {
            // Make solid_color nullable
            $table->string('solid_color', 7)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_backgrounds', function (Blueprint $table) {
            $table->dropColumn('active_type');
        });
        
        Schema::table('user_backgrounds', function (Blueprint $table) {
            $table->enum('active_type', ['solid', 'gradient', 'image'])->default('solid')->after('user_id');
        });
        
        Schema::table('user_backgrounds', function (Blueprint $table) {
            $table->string('solid_color', 7)->default('#f3f4f6')->change();
        });
    }
};
