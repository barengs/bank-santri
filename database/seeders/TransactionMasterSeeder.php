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
        // 1. Transaction Items (MTI - Master Transaction Items)
        // ============================================================
        
        // --- Core Items (Source/Destination Accounts) ---
        $coreItems = [
            ['item_name' => 'Kas Tunai Teller',     'default_amount' => 0, 'coa_code' => '1101', 'entry_type' => 'debit',  'value_mode' => 'total', 'description' => 'Penerimaan tunai di loket teller'],
            ['item_name' => 'Kas Tunai (Keluar)',    'default_amount' => 0, 'coa_code' => '1101', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Pengeluaran tunai dari loket teller'],
            ['item_name' => 'Saldo Tabungan Santri', 'default_amount' => 0, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Saldo simpanan wadiah santri'],
            ['item_name' => 'Bank Transfer (In)',    'default_amount' => 0, 'coa_code' => '1102', 'entry_type' => 'debit',  'value_mode' => 'total', 'description' => 'Penerimaan via transfer bank'],
        ];

        foreach ($coreItems as $item) {
            TransactionItem::create($item);
        }

        // --- BIAYA PENDAFTARAN (COA 4100) ---
        $pendaftaranItems = [
            ['item_name' => 'PENDAFTARAN',                      'default_amount' => 100000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya pendaftaran santri baru'],
            ['item_name' => 'UANG GEDUNG',                      'default_amount' => 500000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya pembangunan/uang gedung'],
            ['item_name' => 'AL QUR\'AN DAN AMALAN',            'default_amount' => 120000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya pengadaan Al-Quran dan kitab amalan'],
            ['item_name' => 'SERAGAM MADRASAH DINIYAH',         'default_amount' => 170000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya seragam madrasah'],
            ['item_name' => 'REGISTRASI MADRASAH DINIYAH',      'default_amount' => 100000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya registrasi madrasah'],
            ['item_name' => 'KITAB AL-MIFTAH LENGKAP',          'default_amount' => 150000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya kitab Al-Miftah'],
            ['item_name' => 'TES URINE DAN CEK GOLONGAN DARAH', 'default_amount' => 100000, 'coa_code' => '4100', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya kesehatan awal'],
        ];

        foreach ($pendaftaranItems as $item) {
            TransactionItem::create($item);
        }

        // --- BIAYA OPERASIONAL/TAHUNAN (COA 4200) ---
        $operasionalItems = [
            ['item_name' => 'SYAHRIYAH',                    'default_amount' => 600000, 'coa_code' => '4200', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya syahriyah tahunan'],
            ['item_name' => 'LEMARI',                       'default_amount' => 50000,  'coa_code' => '4200', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya sewa/pemeliharaan lemari'],
            ['item_name' => 'LOMBA GEBYAR ADHA',            'default_amount' => 60000,  'coa_code' => '4200', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya kegiatan Idul Adha'],
            ['item_name' => 'LEMBAGA PENGEMBANGAN MUTU',    'default_amount' => 150000, 'coa_code' => '4200', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya pengembangan mutu santri'],
            ['item_name' => 'PENDIDIKAN',                   'default_amount' => 150000, 'coa_code' => '4200', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya operasional pendidikan'],
            ['item_name' => 'INFAQ KESEHATAN',              'default_amount' => 50000,  'coa_code' => '4200', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya layanan kesehatan tahunan'],
        ];

        foreach ($operasionalItems as $item) {
            TransactionItem::create($item);
        }

        // --- BIAYA BULANAN (COA 4300) ---
        $bulananItems = [
            ['item_name' => 'DPU (Dapur Umum)', 'default_amount' => 400000, 'coa_code' => '4300', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya makan bulanan'],
            ['item_name' => 'LAUNDRY',          'default_amount' => 35000,  'coa_code' => '4300', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya cuci pakaian bulanan'],
            ['item_name' => 'ADMIN',            'default_amount' => 15000,  'coa_code' => '4300', 'entry_type' => 'credit', 'value_mode' => 'fixed', 'description' => 'Biaya administrasi bulanan'],
        ];

        foreach ($bulananItems as $item) {
            TransactionItem::create($item);
        }

        // --- TABUNGAN SANTRI (COA 2100) ---
        $tabunganItems = [
            ['item_name' => 'UANG SAKU', 'default_amount' => 0, 'coa_code' => '2100', 'entry_type' => 'credit', 'value_mode' => 'total', 'description' => 'Setoran uang saku santri'],
        ];

        foreach ($tabunganItems as $item) {
            TransactionItem::create($item);
        }

        // ============================================================
        // 2. Transaction Types (Event Categories)
        // ============================================================
        $types = [
            ['code' => 'BIAYA-REG',     'name' => 'Pendaftaran Santri Baru', 'category' => 'fee',     'description' => 'Pembayaran biaya pendaftaran satu kali'],
            ['code' => 'BIAYA-ANNUAL',  'name' => 'Biaya Tahunan Santri',    'category' => 'fee',     'description' => 'Pembayaran biaya operasional tahunan'],
            ['code' => 'BIAYA-MONTHLY', 'name' => 'Biaya Bulanan Santri',    'category' => 'fee',     'description' => 'Pembayaran paket bulanan santri'],
            ['code' => 'TOPUP-SANTRI',  'name' => 'Setoran Tunai Tabungan',  'category' => 'topup',   'description' => 'Pengisian saldo tabungan santri'],
            ['code' => 'WDR-SANTRI',    'name' => 'Penarikan Tabungan',      'category' => 'cash_operation', 'description' => 'Penarikan tunai saldo santri'],
        ];

        foreach ($types as $t) {
            TransactionType::create($t);
        }

        // ============================================================
        // 3. Rules (Mapping Event to MTIs)
        // ============================================================
        
        $kasIn  = TransactionItem::where('item_name', 'Kas Tunai Teller')->first();
        $kasOut = TransactionItem::where('item_name', 'Kas Tunai (Keluar)')->first();
        $wadIn  = TransactionItem::where('item_name', 'Saldo Tabungan Santri')->first();

        // --- BIAYA-REG Rules ---
        $tReg = TransactionType::where('code', 'BIAYA-REG')->first();
        $tReg->rules()->create(['transaction_item_id' => $kasIn->id, 'coa_code' => $kasIn->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        foreach ($pendaftaranItems as $pi) {
            $mti = TransactionItem::where('item_name', $pi['item_name'])->first();
            $tReg->rules()->create(['transaction_item_id' => $mti->id, 'coa_code' => $mti->coa_code, 'entry_type' => 'credit', 'value_mode' => 'fixed']);
        }

        // --- BIAYA-ANNUAL Rules ---
        $tAnn = TransactionType::where('code', 'BIAYA-ANNUAL')->first();
        $tAnn->rules()->create(['transaction_item_id' => $kasIn->id, 'coa_code' => $kasIn->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        foreach ($operasionalItems as $oi) {
            $mti = TransactionItem::where('item_name', $oi['item_name'])->first();
            $tAnn->rules()->create(['transaction_item_id' => $mti->id, 'coa_code' => $mti->coa_code, 'entry_type' => 'credit', 'value_mode' => 'fixed']);
        }

        // --- BIAYA-MONTHLY Rules ---
        $tMon = TransactionType::where('code', 'BIAYA-MONTHLY')->first();
        $tMon->rules()->create(['transaction_item_id' => $kasIn->id, 'coa_code' => $kasIn->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        foreach ($bulananItems as $bi) {
            $mti = TransactionItem::where('item_name', $bi['item_name'])->first();
            $tMon->rules()->create(['transaction_item_id' => $mti->id, 'coa_code' => $mti->coa_code, 'entry_type' => 'credit', 'value_mode' => 'fixed']);
        }

        // --- TOPUP-SANTRI Rules ---
        $tTop = TransactionType::where('code', 'TOPUP-SANTRI')->first();
        $tTop->rules()->create(['transaction_item_id' => $kasIn->id, 'coa_code' => $kasIn->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        $tTop->rules()->create(['transaction_item_id' => $wadIn->id, 'coa_code' => $wadIn->coa_code, 'entry_type' => 'credit', 'value_mode' => 'total']);

        // --- WDR-SANTRI Rules ---
        $tWdr = TransactionType::where('code', 'WDR-SANTRI')->first();
        // Simpanan Wadiah (D) / Kas (C)
        $tWdr->rules()->create(['transaction_item_id' => $wadIn->id,  'coa_code' => $wadIn->coa_code,  'entry_type' => 'debit',  'value_mode' => 'total']);
        $tWdr->rules()->create(['transaction_item_id' => $kasOut->id, 'coa_code' => $kasOut->coa_code, 'entry_type' => 'credit', 'value_mode' => 'total']);
    }
}
