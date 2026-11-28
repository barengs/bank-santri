<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\TransactionType;
use App\Models\TransactionItem;

return new class extends Migration
{
    public function up(): void
    {
        $fundTrf = TransactionType::firstOrCreate(
            ['code' => 'FUND-TRF'],
            [
                'name'        => 'Transfer Antar Rekening',
                'category'    => 'transfer',
                'description' => 'Pemindahbukuan saldo antar rekening santri dan/atau instansi',
                'is_debit'    => false,
                'is_credit'   => false,
                'is_active'   => true,
            ]
        );

        if ($fundTrf && $fundTrf->rules()->count() === 0) {
            $wadIn = TransactionItem::where('item_name', 'Saldo Tabungan Santri')->first();
            $coaCode = $wadIn?->coa_code ?? '2100';
            $itemId = $wadIn?->id;

            // Debit: 2100 (Saldo rekening pengirim berkurang)
            $fundTrf->rules()->create([
                'transaction_item_id' => $itemId,
                'coa_code'            => $coaCode,
                'entry_type'          => 'debit',
                'value_mode'          => 'total',
                'description'         => 'Pemindahbukuan dari rekening pengirim',
            ]);

            // Credit: 2100 (Saldo rekening penerima bertambah)
            $fundTrf->rules()->create([
                'transaction_item_id' => $itemId,
                'coa_code'            => $coaCode,
                'entry_type'          => 'credit',
                'value_mode'          => 'total',
                'description'         => 'Pemindahbukuan ke rekening penerima',
            ]);
        }
    }

    public function down(): void
    {
        $fundTrf = TransactionType::where('code', 'FUND-TRF')->first();
        if ($fundTrf) {
            $fundTrf->rules()->delete();
            $fundTrf->delete();
        }
    }
};
