<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\TransactionItem;
use App\Services\AccountingService;
use Illuminate\Console\Command;

class ClaimUnassignedItemTransactionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'transaction:claim-unassigned
                            {--item= : ID atau nama Rincian Transaksi (TransactionItem)}
                            {--account= : Nomor Rekening Instansi tujuan (opsional jika sudah diset di Master Rincian)}
                            {--dry-run : Hanya tampilkan preview transaksi dan nominal tanpa mengubah data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mencari dan memindahkan dana dari transaksi rincian (TransactionItem) yang belum memiliki destination_account ke Rekening Instansi tujuan';

    /**
     * Execute the console command.
     */
    public function handle(AccountingService $accountingService): int
    {
        $itemFilter = $this->option('item');
        $targetAccount = $this->option('account');
        $isDryRun = (bool) $this->option('dry-run');

        $query = TransactionItem::with(['coa', 'destinationAccount']);

        if ($itemFilter) {
            if (is_numeric($itemFilter)) {
                $query->where('id', (int) $itemFilter);
            } else {
                $query->where('item_name', 'like', "%{$itemFilter}%");
            }
        } else {
            // Jika tanpa --item, ambil semua item yang sudah memiliki destination_account
            $query->whereNotNull('destination_account')->where('destination_account', '!=', '');
        }

        $items = $query->get();

        if ($items->isEmpty()) {
            $this->warn('Tidak ditemukan Master Rincian Transaksi yang sesuai (atau belum ada rincian yang diset Rekening Instansi Tujuan).');
            return self::FAILURE;
        }

        foreach ($items as $item) {
            $destAccountNo = $targetAccount ?: $item->destination_account;
            $this->line(str_repeat('=', 75));
            $this->info("Rincian Transaksi : [#{$item->id}] {$item->item_name} (COA: {$item->coa_code})");

            $unclaimed = $accountingService->findUnclaimedItemTransactions($item);
            $count = $unclaimed->count();
            $totalAmount = (float) $unclaimed->sum('amount');

            if ($count === 0) {
                $this->line(" -> Tidak ada transaksi tanpa rekening tujuan untuk rincian ini.");
                continue;
            }

            $this->warn(" -> Ditemukan {$count} transaksi tanpa rekening tujuan | Total: Rp " . number_format($totalAmount, 0, ',', '.'));

            $previewRows = $unclaimed->take(20)->map(fn($tx) => [
                $tx->created_at?->format('Y-m-d H:i'),
                $tx->reference_number,
                $tx->source_account ?? '(Tunai/Kasir)',
                'Rp ' . number_format((float) $tx->amount, 0, ',', '.'),
                \Illuminate\Support\Str::limit($tx->description, 40),
            ])->toArray();

            $this->table(['Tanggal', 'No. Referensi', 'Rekening Asal', 'Nominal', 'Deskripsi'], $previewRows);
            if ($count > 20) {
                $this->line(" ... dan " . ($count - 20) . " transaksi lainnya.");
            }

            if (empty($destAccountNo)) {
                $this->error(" -> Rekening Instansi Tujuan belum diset pada '{$item->item_name}'. Gunakan opsi --account=NOMOR_REKENING atau set di menu Master Rincian Transaksi.");
                continue;
            }

            $dstAcc = Account::where('account_number', $destAccountNo)->first();
            if (!$dstAcc) {
                $this->error(" -> Rekening tujuan '{$destAccountNo}' tidak ditemukan di tabel accounts.");
                continue;
            }

            $this->info(" -> Rekening Tujuan : {$dstAcc->customer_name} ({$dstAcc->account_number}) | Saldo Saat Ini: Rp " . number_format((float) $dstAcc->balance, 0, ',', '.'));

            if ($isDryRun) {
                $this->comment(" [DRY-RUN] Simulasi selesai. Saldo setelah klaim akan menjadi: Rp " . number_format((float) $dstAcc->balance + $totalAmount, 0, ',', '.'));
                continue;
            }

            if (!$this->confirm("Pindahkan {$count} transaksi (Rp " . number_format($totalAmount, 0, ',', '.') . ") ke rekening {$dstAcc->customer_name} ({$dstAcc->account_number})?", true)) {
                $this->line(" -> Dilewati.");
                continue;
            }

            try {
                $result = $accountingService->claimUnclaimedItemTransactions($item, $destAccountNo);
                $this->info(" [SUKSES] {$result['claimed_count']} transaksi berhasil dipindahkan.");
                $this->info(" Saldo Sebelum : Rp " . number_format($result['balance_before'], 0, ',', '.'));
                $this->info(" Total Masuk   : Rp " . number_format($result['total_claimed_amount'], 0, ',', '.'));
                $this->info(" Saldo Sesudah : Rp " . number_format($result['balance_after'], 0, ',', '.'));
            } catch (\Exception $e) {
                $this->error(" [GAGAL] " . $e->getMessage());
                return self::FAILURE;
            }
        }

        return self::SUCCESS;
    }
}

