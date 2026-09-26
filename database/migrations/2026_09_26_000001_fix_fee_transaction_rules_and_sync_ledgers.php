<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\TransactionType;
use App\Models\Transaction;
use App\Services\AccountingService;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Perbaiki Rule BIAYA-REG (Pendapatan Pendaftaran: 4100)
        $tReg = TransactionType::where('code', 'BIAYA-REG')->first();
        if ($tReg) {
            $tReg->rules()->where('entry_type', 'credit')->delete();
            $tReg->rules()->create([
                'coa_code'   => '4100',
                'entry_type' => 'credit',
                'value_mode' => 'total',
            ]);
        }

        // 2. Perbaiki Rule BIAYA-ANNUAL (Pendapatan Operasional: 4200)
        $tAnn = TransactionType::where('code', 'BIAYA-ANNUAL')->first();
        if ($tAnn) {
            $tAnn->rules()->where('entry_type', 'credit')->delete();
            $tAnn->rules()->create([
                'coa_code'   => '4200',
                'entry_type' => 'credit',
                'value_mode' => 'total',
            ]);
        }

        // 3. Perbaiki Rule BIAYA-MONTHLY (Pendapatan Bulanan/Paket: 4300)
        $tMon = TransactionType::where('code', 'BIAYA-MONTHLY')->first();
        if ($tMon) {
            $tMon->rules()->where('entry_type', 'credit')->delete();
            $tMon->rules()->create([
                'coa_code'   => '4300',
                'entry_type' => 'credit',
                'value_mode' => 'total',
            ]);
        }

        // 4. Sinkronisasi otomatis seluruh transaksi yang belum memiliki jurnal atau tidak seimbang
        $accountingService = app(AccountingService::class);
        Transaction::chunkById(100, function ($transactions) use ($accountingService) {
            foreach ($transactions as $transaction) {
                $accountingService->ensureLedgerEntries($transaction);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rule seimbang dipertahankan
    }
};
