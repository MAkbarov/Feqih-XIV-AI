<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Full system access and administration privileges',
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Standard user with basic chat access',
            ],
            [
                'name' => 'moderator',
                'display_name' => 'Moderator',
                'description' => 'Limited admin access for content moderation',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}