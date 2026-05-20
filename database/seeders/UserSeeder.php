<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Main Admin
        $admin = \App\Models\User::updateOrCreate(
            ['email' => 'admin@banksantri.id'],
            [
                'name'     => 'Admin Utama Bank',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role'     => 'admin', // Legacy column
            ]
        );
        $admin->assignRole('admin');

        // 2. Admin Bank (Manager)
        $adminBank = \App\Models\User::updateOrCreate(
            ['email' => 'manager@banksantri.id'],
            [
                'name'     => 'Manager Operasional',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role'     => 'adminbank',
            ]
        );
        $adminBank->assignRole('adminbank');

        // 3. Teller
        $teller = \App\Models\User::updateOrCreate(
            ['email' => 'teller1@banksantri.id'],
            [
                'name'     => 'Siti Aminah (Teller 1)',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role'     => 'teller',
            ]
        );
        $teller->assignRole('teller');

        // 4. Pimpinan
        $pimpinan = \App\Models\User::updateOrCreate(
            ['email' => 'pimpinan@tamjid.or.id'],
            [
                'name'     => 'KH. Ahmad Fauzi (Pimpinan)',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role'     => 'pimpinan',
            ]
        );
        $pimpinan->assignRole('pimpinan');
    }
}
