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
        // Kosongkan data lama agar bersih
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        TransactionRule::truncate();
        TransactionType::truncate();
        TransactionItem::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Create Transaction Items (Master Rincian)
        $items = [
            [
                'item_name'      => 'Kas Tunai Teller',
                'default_amount' => 0,
                'coa_code'       => '1101',
                'entry_type'     => 'debit',
                'value_mode'     => 'total',
                'description'    => 'Penerimaan tunai di loket teller',
            ],
            [
                'item_name'      => 'Pengeluaran Kas Tunai',
                'default_amount' => 0,
                'coa_code'       => '1101',
                'entry_type'     => 'credit',
                'value_mode'     => 'total',
                'description'    => 'Pengeluaran tunai dari loket teller',
            ],
            [
                'item_name'      => 'Simpanan Wadiah Santri',
                'default_amount' => 0,
                'coa_code'       => '2100',
                'entry_type'     => 'credit',
                'value_mode'     => 'total',
                'description'    => 'Setoran ke saldo tabungan santri',
            ],
            [
                'item_name'      => 'Penarikan Wadiah Santri',
                'default_amount' => 0,
                'coa_code'       => '2100',
                'entry_type'     => 'debit',
                'value_mode'     => 'total',
                'description'    => 'Debet dari saldo tabungan santri',
            ],
            [
                'item_name'      => 'Biaya Pendaftaran Pondok',
                'default_amount' => 1000000,
                'coa_code'       => '4100',
                'entry_type'     => 'credit',
                'value_mode'     => 'fixed',
                'description'    => 'Infaq pendaftaran santri baru',
            ],
            [
                'item_name'      => 'Biaya Admin Bank',
                'default_amount' => 5000,
                'coa_code'       => '4100',
                'entry_type'     => 'credit',
                'value_mode'     => 'fixed',
                'description'    => 'Biaya administrasi transaksi',
            ],
        ];

        foreach ($items as $item) {
            TransactionItem::create($item);
        }

        // 2. Create Transaction Types (Master Jenis)
        $types = [
            ['code' => 'CASH-DEP', 'name' => 'Setoran Tunai Tabungan', 'category' => 'cash_operation'],
            ['code' => 'CASH-WDR', 'name' => 'Penarikan Tunai Tabungan', 'category' => 'cash_operation'],
            ['code' => 'REG-NEW',  'name' => 'Pendaftaran Santri Baru', 'category' => 'payment'],
            ['code' => 'ADMIN-PAY','name' => 'Pembayaran Administrasi', 'category' => 'payment'],
        ];

        foreach ($types as $t) {
            TransactionType::create($t);
        }

        // 3. Create Rules (Mapping)
        $kasIn  = TransactionItem::where('item_name', 'Kas Tunai Teller')->first();
        $kasOut = TransactionItem::where('item_name', 'Pengeluaran Kas Tunai')->first();
        $wadIn  = TransactionItem::where('item_name', 'Simpanan Wadiah Santri')->first();
        $wadOut = TransactionItem::where('item_name', 'Penarikan Wadiah Santri')->first();
        $reg    = TransactionItem::where('item_name', 'Biaya Pendaftaran Pondok')->first();
        $adm    = TransactionItem::where('item_name', 'Biaya Admin Bank')->first();

        // Setoran Tunai: Kas (D) - Wadiah (C)
        $tSetoran = TransactionType::where('code', 'CASH-DEP')->first();
        $tSetoran->rules()->create(['transaction_item_id' => $kasIn->id, 'coa_code' => $kasIn->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        $tSetoran->rules()->create(['transaction_item_id' => $wadIn->id, 'coa_code' => $wadIn->coa_code, 'entry_type' => 'credit', 'value_mode' => 'total']);

        // Penarikan Tunai: Wadiah (D) - Kas (C)
        $tTarik = TransactionType::where('code', 'CASH-WDR')->first();
        $tTarik->rules()->create(['transaction_item_id' => $wadOut->id, 'coa_code' => $wadOut->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        $tTarik->rules()->create(['transaction_item_id' => $kasOut->id, 'coa_code' => $kasOut->coa_code, 'entry_type' => 'credit', 'value_mode' => 'total']);

        // Pendaftaran: Kas (D) - Infaq (C) & Admin (C)
        $tReg = TransactionType::where('code', 'REG-NEW')->first();
        $tReg->rules()->create(['transaction_item_id' => $kasIn->id, 'coa_code' => $kasIn->coa_code, 'entry_type' => 'debit', 'value_mode' => 'total']);
        $tReg->rules()->create(['transaction_item_id' => $reg->id, 'coa_code' => $reg->coa_code, 'entry_type' => 'credit', 'value_mode' => 'fixed', 'fixed_amount' => 1000000]);
        $tReg->rules()->create(['transaction_item_id' => $adm->id, 'coa_code' => $adm->coa_code, 'entry_type' => 'credit', 'value_mode' => 'fixed', 'fixed_amount' => 5000]);
    }
}
