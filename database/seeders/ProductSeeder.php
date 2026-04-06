<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('products')->updateOrInsert(
            ['id' => 1],
            [
                'product_code' => 'TAB001',
                'product_name' => 'Tabungan Tibyan',
                'product_type' => 'Tabungan',
                'interest_rate' => 0,
                'admin_fee' => 0,
                'opening_fee' => 50000,
                'is_active' => 1,
                'updated_at' => now()
            ]
        );

        DB::table('products')->updateOrInsert(
            ['id' => 2],
            [
                'product_code' => 'TAB002',
                'product_name' => 'Tabungan Kubar',
                'product_type' => 'Tabungan',
                'interest_rate' => 0,
                'admin_fee' => 0,
                'opening_fee' => 50000,
                'is_active' => 1,
                'updated_at' => now()
            ]
        );
    }
}
