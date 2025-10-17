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
            if (!Schema::hasColumn('users', 'last_login_ip')) {
                $table->ipAddress('last_login_ip')->nullable()->after('role_id');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('last_login_ip');
            }
        });
        
        // Test məqsədi üçün mövcud istifadəçilərə sample IP məlumatları əlavə et
        \DB::table('users')
            ->whereNull('registration_ip')
            ->orWhereNull('last_login_ip')
            ->update([
                'registration_ip' => '192.168.1.' . rand(1, 254),
                'last_login_ip' => '192.168.1.' . rand(1, 254),
                'last_login_at' => now()->subDays(rand(1, 30))
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['registration_ip', 'last_login_ip', 'last_login_at']);
        });
    }
};
