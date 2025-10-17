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
        // Drop the placement column completely
        Schema::table('donation_pages', function (Blueprint $table) {
            $table->dropColumn('placement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donation_pages', function (Blueprint $table) {
            $table->string('placement')->default('modal')->after('content');
        });
    }
};
