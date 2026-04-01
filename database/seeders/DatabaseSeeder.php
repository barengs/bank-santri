<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default admin user untuk Bank Santri
        DB::table('users')->insertOrIgnore([
            'name'       => 'Admin Bank Santri',
            'email'      => 'admin@banksantri.id',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Produk tabungan default (Wadiah)
        DB::table('products')->insertOrIgnore([
            ['product_code' => 'TAB-WADIAH', 'product_name' => 'Tabungan Wadiah Santri', 'product_type' => 'Tabungan', 'interest_rate' => 0, 'admin_fee' => 0, 'opening_fee' => 0, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['product_code' => 'TAB-MUDH',   'product_name' => 'Tabungan Mudharabah',    'product_type' => 'Tabungan', 'interest_rate' => 2, 'admin_fee' => 0, 'opening_fee' => 0, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Transaction Types
        DB::table('transaction_types')->insertOrIgnore([
            ['code' => 'CASH-DEP',  'name' => 'Setoran Tunai',        'category' => 'cash_operation', 'is_debit' => false, 'is_credit' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'CASH-WDR',  'name' => 'Penarikan Tunai',      'category' => 'cash_operation', 'is_debit' => true,  'is_credit' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'TOPUP-CASH','name' => 'Top-Up Tunai',         'category' => 'topup',          'is_debit' => false, 'is_credit' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'TOPUP-TRF', 'name' => 'Top-Up Transfer Bank', 'category' => 'topup',          'is_debit' => false, 'is_credit' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'FUND-TRF',  'name' => 'Transfer Antar Rekening','category' => 'transfer',     'is_debit' => true,  'is_credit' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'ADMIN-PAY', 'name' => 'Pembayaran Administrasi','category' => 'payment',      'is_debit' => true,  'is_credit' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'COOP-BUY',  'name' => 'Belanja Koperasi',     'category' => 'payment',        'is_debit' => true,  'is_credit' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // COA Syariah Dasar — parent rows FIRST
        // Level 1 (root accounts — no parent_coa_code)
        DB::table('chart_of_accounts')->insertOrIgnore([
            ['coa_code' => '1000', 'account_name' => 'Aset',       'account_type' => 'asset',     'level' => 1, 'is_postable' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '2000', 'account_name' => 'Kewajiban',  'account_type' => 'liability', 'level' => 1, 'is_postable' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '3000', 'account_name' => 'Ekuitas',   'account_type' => 'equity',    'level' => 1, 'is_postable' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '4000', 'account_name' => 'Pendapatan','account_type' => 'revenue',   'level' => 1, 'is_postable' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '6000', 'account_name' => 'Dana ZIS',  'account_type' => 'zis',       'level' => 1, 'is_postable' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Level 2 (membutuhkan parent level 1)
        DB::table('chart_of_accounts')->insertOrIgnore([
            ['coa_code' => '1100', 'account_name' => 'Kas dan Setara Kas',       'account_type' => 'asset',     'parent_coa_code' => '1000', 'level' => 2, 'is_postable' => false, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '1200', 'account_name' => 'Dana Santri (Wadiah)',     'account_type' => 'asset',     'parent_coa_code' => '1000', 'level' => 2, 'is_postable' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '2100', 'account_name' => 'Tabungan Santri-Wadiah',  'account_type' => 'liability', 'parent_coa_code' => '2000', 'level' => 2, 'is_postable' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '4100', 'account_name' => 'Pendapatan Administrasi', 'account_type' => 'revenue',   'parent_coa_code' => '4000', 'level' => 2, 'is_postable' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '6100', 'account_name' => 'Dana Zakat',              'account_type' => 'zis',       'parent_coa_code' => '6000', 'level' => 2, 'is_postable' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['coa_code' => '6200', 'account_name' => 'Dana Infak/Shadaqah',     'account_type' => 'zis',       'parent_coa_code' => '6000', 'level' => 2, 'is_postable' => true,  'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Level 3 (membutuhkan parent level 2)
        DB::table('chart_of_accounts')->insertOrIgnore([
            ['coa_code' => '1101', 'account_name' => 'Kas Teller', 'account_type' => 'asset', 'parent_coa_code' => '1100', 'level' => 3, 'is_postable' => true, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
