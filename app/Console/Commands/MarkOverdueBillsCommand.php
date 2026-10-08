<?php

namespace App\Console\Commands;

use App\Models\Bill;
use Illuminate\Console\Command;

class MarkOverdueBillsCommand extends Command
{
    protected $signature = 'bills:mark-overdue';

    protected $description = 'Perbarui status tagihan yang belum lunas menjadi overdue jika telah melewati tanggal jatuh tempo';

    public function handle(): int
    {
        $this->info("Mengecek tagihan yang melewati jatuh tempo...");

        $updated = Bill::markOverdue();

        if ($updated > 0) {
            $this->info("Berhasil memperbarui {$updated} tagihan menjadi overdue.");
        } else {
            $this->info("Tidak ada tagihan yang jatuh tempo hari ini.");
        }

        return self::SUCCESS;
    }
}
