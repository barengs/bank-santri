<?php

namespace Database\Seeders;

use App\Models\TransactionItem;
use App\Models\TransactionType;
use App\Models\TransactionRule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransactionMasterSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        TransactionRule::truncate();
        TransactionType::truncate();
        TransactionItem::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ============================================================
        // 1. Transaction Items (Master COA mapping)
        // ============================================================
        $items = [
            // COA 1101 — Kas Tunai Teller
            ['item_name' => 'Kas Tunai Teller (Masuk)',     'default_amount' => 0, 'coa_code' => '1101', 'entry_type' => 'debit',  'value_mode' => 'total', 'description' => 'Penerimaan tunai di loket teller'],
            ['item_name' => 'Kas Tunai Teller (Keluar)',    'default_amount' => 0, 'coa_code' => '1101', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Pengeluaran tunai dari loket teller'],
            // COA 2100 — Simpanan Wadiah (Kewajiban Bank kepada Santri)
            ['item_name' => 'Simpanan Wadiah (Masuk)',      'default_amount' => 0, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Setoran ke saldo tabungan santri'],
            ['item_name' => 'Simpanan Wadiah (Keluar)',     'default_amount' => 0, 'coa_code' => '2100', 'entry_type' => 'debit',  'value_mode' => 'total', 'description' => 'Debet dari saldo tabungan santri'],
            // COA 4100 — Pendapatan Bank
            ['item_name' => 'Pendapatan Infaq Pendaftaran', 'default_amount' => 0, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Pendapatan infaq/biaya pendaftaran santri baru'],
            ['item_name' => 'Pendapatan Pembayaran Paket',  'default_amount' => 0, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Pendapatan dari pembayaran paket santri'],
            ['item_name' => 'Pendapatan Koperasi',          'default_amount' => 0, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Pendapatan dari transaksi koperasi'],
            // COA 1102 — Rekening Bank / Transfer
            ['item_name' => 'Bank Transfer (Masuk)',        'default_amount' => 0, 'coa_code' => '1102', 'entry_type' => 'debit',  'value_mode' => 'total', 'description' => 'Penerimaan via transfer bank'],
        ];

        foreach ($items as $item) {
            TransactionItem::create($item);
        }

        // ============================================================
        // 2. Transaction Types
        // ============================================================
        $types = [
            ['code' => 'CASH-DEP',    'name' => 'Setoran Tunai Tabungan',   'category' => 'cash_operation'],
            ['code' => 'CASH-WDR',    'name' => 'Penarikan Tunai Tabungan', 'category' => 'cash_operation'],
            ['code' => 'FUND-TRF',    'name' => 'Transfer Antar Rekening',  'category' => 'transfer'],
            ['code' => 'TOPUP-CASH',  'name' => 'Top-Up Tunai via Kasir',   'category' => 'top_up'],
            ['code' => 'TOPUP-TRF',   'name' => 'Top-Up Transfer Bank',     'category' => 'top_up'],
            ['code' => 'PAYMENT-PKG', 'name' => 'Pembayaran Paket Santri',  'category' => 'payment'],
            ['code' => 'COOP-BUY',    'name' => 'Pembelian di Koperasi',    'category' => 'koperasi'],
            // REG-NEW: catatan pendapatan bank, TIDAK menggerakkan saldo rekening santri
            ['code' => 'REG-NEW',     'name' => 'Pendaftaran Santri Baru',  'category' => 'registration'],
        ];

        foreach ($types as $t) {
            TransactionType::create($t);
        }

        // ============================================================
        // 3. Rules (COA Mapping per Jenis Transaksi)
        // ============================================================
        $kasIn   = TransactionItem::where('item_name', 'Kas Tunai Teller (Masuk)')->first();
        $kasOut  = TransactionItem::where('item_name', 'Kas Tunai Teller (Keluar)')->first();
        $wadIn   = TransactionItem::where('item_name', 'Simpanan Wadiah (Masuk)')->first();
        $wadOut  = TransactionItem::where('item_name', 'Simpanan Wadiah (Keluar)')->first();
        $regFee  = TransactionItem::where('item_name', 'Pendapatan Infaq Pendaftaran')->first();
        $pkgFee  = TransactionItem::where('item_name', 'Pendapatan Pembayaran Paket')->first();
        $coopFee = TransactionItem::where('item_name', 'Pendapatan Koperasi')->first();
        $bankTrf = TransactionItem::where('item_name', 'Bank Transfer (Masuk)')->first();

        // CASH-DEP: Setoran Tunai → Kas (D) / Simpanan Wadiah (C)
        $t = TransactionType::where('code', 'CASH-DEP')->first();
        $t->rules()->create(['transaction_item_id' => $kasIn->id,   'coa_code' => $kasIn->coa_code,   'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $wadIn->id,   'coa_code' => $wadIn->coa_code,   'entry_type' => 'credit', 'value_mode' => 'total']);

        // CASH-WDR: Penarikan Tunai → Simpanan Wadiah (D) / Kas (C)
        $t = TransactionType::where('code', 'CASH-WDR')->first();
        $t->rules()->create(['transaction_item_id' => $wadOut->id,  'coa_code' => $wadOut->coa_code,  'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $kasOut->id,  'coa_code' => $kasOut->coa_code,  'entry_type' => 'credit', 'value_mode' => 'total']);

        // FUND-TRF: Transfer antar rekening → Simpanan Wadiah (D) / Simpanan Wadiah (C)
        $t = TransactionType::where('code', 'FUND-TRF')->first();
        $t->rules()->create(['transaction_item_id' => $wadOut->id,  'coa_code' => $wadOut->coa_code,  'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $wadIn->id,   'coa_code' => $wadIn->coa_code,   'entry_type' => 'credit', 'value_mode' => 'total']);

        // TOPUP-CASH: Top-Up Tunai → Kas (D) / Simpanan Wadiah (C)
        $t = TransactionType::where('code', 'TOPUP-CASH')->first();
        $t->rules()->create(['transaction_item_id' => $kasIn->id,   'coa_code' => $kasIn->coa_code,   'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $wadIn->id,   'coa_code' => $wadIn->coa_code,   'entry_type' => 'credit', 'value_mode' => 'total']);

        // TOPUP-TRF: Top-Up Transfer Bank → Bank (D) / Simpanan Wadiah (C)
        $t = TransactionType::where('code', 'TOPUP-TRF')->first();
        $t->rules()->create(['transaction_item_id' => $bankTrf->id, 'coa_code' => $bankTrf->coa_code, 'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $wadIn->id,   'coa_code' => $wadIn->coa_code,   'entry_type' => 'credit', 'value_mode' => 'total']);

        // PAYMENT-PKG: Pembayaran Paket → Simpanan Wadiah (D) / Pendapatan (C)
        $t = TransactionType::where('code', 'PAYMENT-PKG')->first();
        $t->rules()->create(['transaction_item_id' => $wadOut->id,  'coa_code' => $wadOut->coa_code,  'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $pkgFee->id,  'coa_code' => $pkgFee->coa_code,  'entry_type' => 'credit', 'value_mode' => 'total']);

        // COOP-BUY: Pembelian Koperasi → Simpanan Wadiah (D) / Pendapatan Koperasi (C)
        $t = TransactionType::where('code', 'COOP-BUY')->first();
        $t->rules()->create(['transaction_item_id' => $wadOut->id,  'coa_code' => $wadOut->coa_code,  'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $coopFee->id, 'coa_code' => $coopFee->coa_code, 'entry_type' => 'credit', 'value_mode' => 'total']);

        // REG-NEW: Pendaftaran → Kas (D) / Pendapatan Infaq (C)
        // CATATAN: Tidak ada rule saldo rekening santri.
        // Ini hanya mencatat pendapatan bank secara jurnal COA.
        // Saldo santri TIDAK bergerak saat aktivasi pendaftaran.
        $t = TransactionType::where('code', 'REG-NEW')->first();
        $t->rules()->create(['transaction_item_id' => $kasIn->id,   'coa_code' => $kasIn->coa_code,   'entry_type' => 'debit',  'value_mode' => 'total']);
        $t->rules()->create(['transaction_item_id' => $regFee->id,  'coa_code' => $regFee->coa_code,  'entry_type' => 'credit', 'value_mode' => 'total']);
    }
}
