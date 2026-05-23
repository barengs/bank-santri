<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\TransactionType;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 0. Ensure we have the base Chart of Accounts (COAs) needed to satisfy foreign keys
        $coas = [
            // Level 1
            ['coa_code' => '1000', 'account_name' => 'Aset',       'account_type' => 'asset',     'level' => 1, 'is_postable' => false, 'parent_coa_code' => null],
            ['coa_code' => '2000', 'account_name' => 'Kewajiban',  'account_type' => 'liability', 'level' => 1, 'is_postable' => false, 'parent_coa_code' => null],
            // Level 2
            ['coa_code' => '1100', 'account_name' => 'Kas dan Setara Kas', 'parent_coa_code' => '1000', 'account_type' => 'asset',     'level' => 2, 'is_postable' => false],
            ['coa_code' => '2100', 'account_name' => 'Tabungan Santri',     'parent_coa_code' => '2000', 'account_type' => 'liability', 'level' => 2, 'is_postable' => true],
            // Level 3
            ['coa_code' => '1101', 'account_name' => 'Kas Utama', 'parent_coa_code' => '1100', 'account_type' => 'asset', 'level' => 3, 'is_postable' => true],
            ['coa_code' => '1102', 'account_name' => 'Rekening Bank', 'parent_coa_code' => '1100', 'account_type' => 'asset', 'level' => 3, 'is_postable' => true],
        ];

        foreach ($coas as $coa) {
            DB::table('chart_of_accounts')->updateOrInsert(
                ['coa_code' => $coa['coa_code']],
                array_merge($coa, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 1. Ensure we have the Transaction Items we need
        $kasIn = TransactionItem::firstOrCreate(
            ['item_name' => 'Kas Tunai Teller'],
            [
                'default_amount' => 0,
                'coa_code' => '1101',
                'entry_type' => 'debit',
                'value_mode' => 'total',
                'description' => 'Penerimaan tunai di loket teller'
            ]
        );

        $wadIn = TransactionItem::firstOrCreate(
            ['item_name' => 'Saldo Tabungan Santri'],
            [
                'default_amount' => 0,
                'coa_code' => '2100',
                'entry_type' => 'credit',
                'value_mode' => 'total',
                'description' => 'Saldo simpanan wadiah santri'
            ]
        );

        $bankIn = TransactionItem::firstOrCreate(
            ['item_name' => 'Bank Transfer (In)'],
            [
                'default_amount' => 0,
                'coa_code' => '1102',
                'entry_type' => 'debit',
                'value_mode' => 'total',
                'description' => 'Penerimaan via transfer bank'
            ]
        );

        // 2. Add TOPUP-CASH
        if ($kasIn && $wadIn) {
            $tCash = TransactionType::firstOrCreate(
                ['code' => 'TOPUP-CASH'],
                [
                    'name' => 'Top-Up Tunai',
                    'category' => 'topup',
                    'description' => 'Pengisian saldo tabungan via kasir'
                ]
            );

            // Set up rules for TOPUP-CASH if they don't exist
            if ($tCash->rules()->count() === 0) {
                $tCash->rules()->create([
                    'transaction_item_id' => $kasIn->id,
                    'coa_code' => $kasIn->coa_code,
                    'entry_type' => 'debit',
                    'value_mode' => 'total'
                ]);
                $tCash->rules()->create([
                    'transaction_item_id' => $wadIn->id,
                    'coa_code' => $wadIn->coa_code,
                    'entry_type' => 'credit',
                    'value_mode' => 'total'
                ]);
            }
        }

        // 3. Add TOPUP-TRF
        if ($bankIn && $wadIn) {
            $tTrf = TransactionType::firstOrCreate(
                ['code' => 'TOPUP-TRF'],
                [
                    'name' => 'Top-Up Transfer Bank',
                    'category' => 'topup',
                    'description' => 'Pengisian saldo tabungan via transfer bank'
                ]
            );

            // Set up rules for TOPUP-TRF if they don't exist
            if ($tTrf->rules()->count() === 0) {
                $tTrf->rules()->create([
                    'transaction_item_id' => $bankIn->id,
                    'coa_code' => $bankIn->coa_code,
                    'entry_type' => 'debit',
                    'value_mode' => 'total'
                ]);
                $tTrf->rules()->create([
                    'transaction_item_id' => $wadIn->id,
                    'coa_code' => $wadIn->coa_code,
                    'entry_type' => 'credit',
                    'value_mode' => 'total'
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tCash = TransactionType::where('code', 'TOPUP-CASH')->first();
        if ($tCash) {
            $tCash->rules()->delete();
            $tCash->delete();
        }

        $tTrf = TransactionType::where('code', 'TOPUP-TRF')->first();
        if ($tTrf) {
            $tTrf->rules()->delete();
            $tTrf->delete();
        }
    }
};
