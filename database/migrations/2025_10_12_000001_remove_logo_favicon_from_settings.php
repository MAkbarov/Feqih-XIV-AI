<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Remove deprecated settings moved to Theme Settings page
        DB::table('settings')->whereIn('key', [
            'brand_logo_url',
            'favicon_url',
            'brand_logo_file',
            'favicon_file'
        ])->delete();
    }

    public function down(): void
    {
        // No-op: keys will be recreated by app when needed via Theme Settings
    }
};
