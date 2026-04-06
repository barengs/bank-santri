<?php

namespace Database\Seeders;

use App\Models\TransactionRule;
use Illuminate\Database\Seeder;

class TransactionRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            // CASH-DEP (1): Debit Kas Utama, Credit Tabungan Santri
            ['transaction_type_id' => 1, 'coa_code' => '1101', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 1, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // CASH-WDR (2): Debit Tabungan Santri, Credit Kas Utama
            ['transaction_type_id' => 2, 'coa_code' => '2100', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 2, 'coa_code' => '1101', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // TOPUP-CASH (3): Debit Kas Utama, Credit Tabungan Santri
            ['transaction_type_id' => 3, 'coa_code' => '1101', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 3, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // TOPUP-TRF (4): Debit Kas Utama, Credit Tabungan Santri
            ['transaction_type_id' => 4, 'coa_code' => '1101', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 4, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // FUND-TRF (5): Debit Tabungan Santri, Credit Tabungan Santri
            ['transaction_type_id' => 5, 'coa_code' => '2100', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 5, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // ADMIN-PAY (6): Debit Tabungan Santri, Credit Pendapatan Admin
            ['transaction_type_id' => 6, 'coa_code' => '2100', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 6, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // COOP-BUY (7): Debit Tabungan Santri, Credit Kas Utama
            ['transaction_type_id' => 7, 'coa_code' => '2100', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 7, 'coa_code' => '1101', 'entry_type' => 'credit', 'value_mode' => 'total'],

            // REG-FEE (8): Debit Kas Utama, Credit Pendapatan Admin
            ['transaction_type_id' => 8, 'coa_code' => '1101', 'entry_type' => 'debit', 'value_mode' => 'total'],
            ['transaction_type_id' => 8, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'total'],
        ];

        foreach ($rules as $rule) {
            TransactionRule::create($rule);
        }
    }
}
