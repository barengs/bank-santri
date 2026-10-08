<?php

namespace App\Console\Commands;

use App\Services\BillingService;
use Illuminate\Console\Command;

class GenerateBillsCommand extends Command
{
    protected $signature = 'bills:generate 
                            {--period= : Periode tagihan format YYYY-MM (misal: 2026-05)} 
                            {--package= : ID paket pembayaran (PaymentPackage ID)} 
                            {--due-date= : Tanggal jatuh tempo (YYYY-MM-DD)}';

    protected $description = 'Terbitkan tagihan paket bulanan untuk seluruh santri aktif dengan snapshot harga paket';

    public function handle(BillingService $billingService): int
    {
        $period = $this->option('period') ?? now()->format('Y-m');
        $packageId = $this->option('package');
        $dueDate = $this->option('due-date');

        if (!$packageId) {
            $this->error('Opsi --package [ID] wajib diisi.');
            return self::FAILURE;
        }

        $this->info("Memulai pembuatan tagihan untuk periode {$period}...");

        try {
            $result = $billingService->generateBills(
                $period,
                (int) $packageId,
                $dueDate,
                null // null for CLI
            );

            $this->info("Selesai! Dibuat: {$result['created']}, Dilewati: {$result['skipped']}, Total: Rp " . number_format($result['total_value'], 0, ',', '.'));
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Gagal: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
