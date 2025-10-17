<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('user_backgrounds')) {
            try {
                // Make solid_color longer and nullable to allow 'transparent' or rgba values
                DB::statement("ALTER TABLE user_backgrounds MODIFY solid_color VARCHAR(20) NULL");
            } catch (\Throwable $e) {
                // Fallback for hosts without permissions
                try {
                    // Some MariaDB versions require USING syntax; attempt generic change
                    DB::statement("ALTER TABLE user_backgrounds MODIFY COLUMN solid_color VARCHAR(20) NULL");
                } catch (\Throwable $e2) {
                    // Swallow – installer will create correct schema on fresh installs
                }
            }
        }
    }

    public function down(): void
    {
        // No down migration to avoid truncation of existing data
    }
};
