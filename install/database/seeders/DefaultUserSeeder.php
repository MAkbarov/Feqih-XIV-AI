<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class DefaultUserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $userRole = Role::where('name', 'user')->first();

        if ($adminRole) {
            User::firstOrCreate(
                ['email' => 'admin@xiv-ai.com'],
                [
                    'name' => 'XIV AI Admin',
                    'password' => Hash::make('admin123'),
                    'role_id' => $adminRole->id,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}