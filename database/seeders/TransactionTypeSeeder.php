<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransactionTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'id' => 1,
                'code' => 'CASH-DEP',
                'name' => 'Setoran Tunai',
                'category' => 'cash_operation',
                'is_debit' => false,
                'is_credit' => true,
            ],
            [
                'id' => 2,
                'code' => 'CASH-WDR',
                'name' => 'Penarikan Tunai',
                'category' => 'cash_operation',
                'is_debit' => true,
                'is_credit' => false,
            ],
            [
                'id' => 3,
                'code' => 'TOPUP-CASH',
                'name' => 'Top-Up Tunai',
                'category' => 'topup',
                'is_debit' => false,
                'is_credit' => true,
            ],
            [
                'id' => 4,
                'code' => 'TOPUP-TRF',
                'name' => 'Top-Up Transfer Bank',
                'category' => 'topup',
                'is_debit' => false,
                'is_credit' => true,
            ],
            [
                'id' => 5,
                'code' => 'FUND-TRF',
                'name' => 'Transfer Antar Rekening',
                'category' => 'transfer',
                'is_debit' => true,
                'is_credit' => true,
            ],
            [
                'id' => 6,
                'code' => 'ADMIN-PAY',
                'name' => 'Pembayaran Administrasi',
                'category' => 'payment',
                'is_debit' => true,
                'is_credit' => false,
            ],
            [
                'id' => 7,
                'code' => 'COOP-BUY',
                'name' => 'Belanja Koperasi',
                'category' => 'payment',
                'is_debit' => true,
                'is_credit' => false,
            ],
            [
                'id' => 8,
                'code' => 'REG-FEE',
                'name' => 'Biaya Pendaftaran',
                'category' => 'payment',
                'is_debit' => false,
                'is_credit' => true,
            ],
        ];

        foreach ($types as $t) {
            DB::table('transaction_types')->updateOrInsert(
                ['id' => $t['id']],
                array_merge($t, [
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );
        }
    }
}
