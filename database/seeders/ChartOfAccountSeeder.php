<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        // Level 1 Accounts
        $level1 = [
            ['coa_code' => '1000', 'account_name' => 'Aset',       'account_type' => 'asset',     'level' => 1, 'is_postable' => false],
            ['coa_code' => '2000', 'account_name' => 'Kewajiban',  'account_type' => 'liability', 'level' => 1, 'is_postable' => false],
            ['coa_code' => '3000', 'account_name' => 'Ekuitas',    'account_type' => 'equity',    'level' => 1, 'is_postable' => false],
            ['coa_code' => '4000', 'account_name' => 'Pendapatan', 'account_type' => 'revenue',   'level' => 1, 'is_postable' => false],
            ['coa_code' => '5000', 'account_name' => 'Beban',      'account_type' => 'expense',   'level' => 1, 'is_postable' => false],
            ['coa_code' => '6000', 'account_name' => 'Dana ZIS',   'account_type' => 'zis',       'level' => 1, 'is_postable' => false],
        ];

        foreach ($level1 as $coa) {
            DB::table('chart_of_accounts')->updateOrInsert(['coa_code' => $coa['coa_code']], array_merge($coa, ['created_at' => now(), 'updated_at' => now()]));
        }

        // Level 2 Accounts
        $level2 = [
            ['coa_code' => '1100', 'account_name' => 'Kas dan Setara Kas', 'parent_coa_code' => '1000', 'account_type' => 'asset',     'level' => 2, 'is_postable' => false],
            ['coa_code' => '2100', 'account_name' => 'Tabungan Santri',     'parent_coa_code' => '2000', 'account_type' => 'liability', 'level' => 2, 'is_postable' => true],
            ['coa_code' => '4100', 'account_name' => 'Pendapatan Admin',    'parent_coa_code' => '4000', 'account_type' => 'revenue',   'level' => 2, 'is_postable' => true],
        ];

        foreach ($level2 as $coa) {
            DB::table('chart_of_accounts')->updateOrInsert(['coa_code' => $coa['coa_code']], array_merge($coa, ['created_at' => now(), 'updated_at' => now()]));
        }

        // Level 3 Accounts
        $level3 = [
            ['coa_code' => '1101', 'account_name' => 'Kas Utama', 'parent_coa_code' => '1100', 'account_type' => 'asset', 'level' => 3, 'is_postable' => true],
            ['coa_code' => '1102', 'account_name' => 'Rekening Bank', 'parent_coa_code' => '1100', 'account_type' => 'asset', 'level' => 3, 'is_postable' => true],
        ];

        foreach ($level3 as $coa) {
            DB::table('chart_of_accounts')->updateOrInsert(['coa_code' => $coa['coa_code']], array_merge($coa, ['created_at' => now(), 'updated_at' => now()]));
        }
    }
}
