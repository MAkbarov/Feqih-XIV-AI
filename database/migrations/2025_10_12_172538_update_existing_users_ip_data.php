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
        // Test məqsədi üçün mövcud istifadəçilərə sample IP məlumatları əlavə et
        $users = \DB::table('users')
            ->where(function($query) {
                $query->whereNull('registration_ip')
                      ->orWhereNull('last_login_ip')
                      ->orWhereNull('last_login_at');
            })
            ->get();
            
        foreach($users as $user) {
            \DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'registration_ip' => $user->registration_ip ?? '192.168.1.' . rand(10, 254),
                    'last_login_ip' => $user->last_login_ip ?? '192.168.1.' . rand(10, 254),
                    'last_login_at' => $user->last_login_at ?? now()->subDays(rand(1, 10))->subHours(rand(1, 23))
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed for sample data
    }
};
