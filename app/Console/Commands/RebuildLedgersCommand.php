<?php

namespace App\Console\Commands;

use App\Models\Transaction;
use App\Models\TransactionLedger;
use App\Services\AccountingService;
use Illuminate\Console\Command;

class RebuildLedgersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ledger:rebuild {--force : Force regenerate all ledgers even if balanced}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rebuild and synchronize General Ledger (Jurnal Umum) entries for all transactions';

    /**
     * Execute the console command.
     */
    public function handle(AccountingService $accountingService): int
    {
        $this->info('Starting rebuild of Transaction Ledgers (Jurnal Umum)...');

        $query = Transaction::query();
        $totalTransactions = $query->count();

        if ($totalTransactions === 0) {
            $this->warn('Tidak ada transaksi ditemukan di tabel transactions.');
            return self::SUCCESS;
        }

        $this->info("Ditemukan {$totalTransactions} transaksi. Memproses...");

        $bar = $this->output->createProgressBar($totalTransactions);
        $bar->start();

        $processed = 0;
        $force = $this->option('force');

        $query->chunkById(100, function ($transactions) use ($accountingService, $bar, &$processed, $force) {
            foreach ($transactions as $transaction) {
                if ($force) {
                    $transaction->ledgerEntries()->delete();
                }
                $accountingService->ensureLedgerEntries($transaction);
                $processed++;
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $totalLedgers = TransactionLedger::count();
        $totalDebit   = (float) TransactionLedger::sum('debit');
        $totalCredit  = (float) TransactionLedger::sum('credit');
        $isBalanced   = abs($totalDebit - $totalCredit) < 0.01;

        $this->info("Rebuild selesai!");
        $this->table(
            ['Metrik', 'Nilai'],
            [
                ['Total Transaksi Diproses', $processed],
                ['Total Entri Jurnal (Ledger)', $totalLedgers],
                ['Total Debit', 'Rp ' . number_format($totalDebit, 2, ',', '.')],
                ['Total Kredit', 'Rp ' . number_format($totalCredit, 2, ',', '.')],
                ['Status Keseimbangan', $isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG (UNBALANCED)'],
            ]
        );

        return $isBalanced ? self::SUCCESS : self::FAILURE;
    }
}
