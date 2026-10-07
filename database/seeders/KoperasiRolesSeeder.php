<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class KoperasiRolesSeeder extends Seeder
{
    /**
     * Role untuk aplikasi mobile POS (komprasi_tamjid / SantriPay & Meal).
     * - Kasir Koperasi: transaksi POS koperasi (check/debit/transactions via API koperasi)
     * - Petugas DPU: klaim jatah makan dapur umum
     *
     * Role ini TIDAK memiliki menu web (tanpa akses dashboard bank-santri),
     * hanya dipakai sebagai identitas JWT & audit trail di API koperasi.
     * transaction.reverse sengaja TIDAK diberikan.
     */
    public function run(): void
    {
        Role::updateOrCreate(['name' => 'kasir_koperasi', 'guard_name' => 'api']);
        Role::updateOrCreate(['name' => 'petugas_dpu', 'guard_name' => 'api']);
    }
}
