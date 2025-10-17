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
        Schema::table('donation_pages', function (Blueprint $table) {
            // Check if column already exists to prevent duplicate column error
            if (!Schema::hasColumn('donation_pages', 'custom_texts')) {
                $table->json('custom_texts')->nullable()->after('payment_methods');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donation_pages', function (Blueprint $table) {
            // Only drop if column exists
            if (Schema::hasColumn('donation_pages', 'custom_texts')) {
                $table->dropColumn('custom_texts');
            }
        });
    }
};
