<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\TransactionType;
use App\Models\TransactionItem;
use App\Models\Setting;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Transaction Type: COOP-BUY (Belanja Koperasi)
        $coopBuy = TransactionType::firstOrCreate(
            ['code' => 'COOP-BUY'],
            [
                'name'        => 'Belanja Koperasi',
                'category'    => 'cash_operation',
                'description' => 'Transaksi belanja santri di koperasi pesantren via kartu',
                'is_debit'    => false,
                'is_credit'   => false,
                'is_active'   => true,
            ]
        );

        $wadIn  = TransactionItem::where('item_name', 'Saldo Tabungan Santri')->first();
        $kasOut = TransactionItem::where('item_name', 'Kas Tunai (Keluar)')->first();

        if ($coopBuy && $wadIn && $kasOut && $coopBuy->rules()->count() === 0) {
            // Debit: 2100 (Tabungan Santri berkurang)
            $coopBuy->rules()->create([
                'transaction_item_id' => $wadIn->id,
                'coa_code'            => $wadIn->coa_code,
                'entry_type'          => 'debit',
                'value_mode'          => 'total',
            ]);
            // Credit: 1101 (Kas / Hutang Outlet Koperasi)
            $coopBuy->rules()->create([
                'transaction_item_id' => $kasOut->id,
                'coa_code'            => $kasOut->coa_code,
                'entry_type'          => 'credit',
                'value_mode'          => 'total',
            ]);
        }

        // 2. Transaction Type: COOP-MEAL (Konsumsi Dapur Umum Santri)
        $coopMeal = TransactionType::firstOrCreate(
            ['code' => 'COOP-MEAL'],
            [
                'name'        => 'Makan Dapur Umum',
                'category'    => 'cash_operation',
                'description' => 'Transaksi konsumsi/makan santri di dapur umum via kartu',
                'is_debit'    => false,
                'is_credit'   => false,
                'is_active'   => true,
            ]
        );

        $dpuItem = TransactionItem::where('item_name', 'DPU (Dapur Umum)')->first();

        if ($coopMeal && $wadIn && $coopMeal->rules()->count() === 0) {
            // Debit: 2100 (Tabungan Santri berkurang)
            $coopMeal->rules()->create([
                'transaction_item_id' => $wadIn->id,
                'coa_code'            => $wadIn->coa_code,
                'entry_type'          => 'debit',
                'value_mode'          => 'total',
            ]);
            // Credit: 4300 / Kas Out
            $targetCredit = $dpuItem ?? $kasOut;
            if ($targetCredit) {
                $coopMeal->rules()->create([
                    'transaction_item_id' => $targetCredit->id,
                    'coa_code'            => $targetCredit->coa_code,
                    'entry_type'          => 'credit',
                    'value_mode'          => 'total',
                ]);
            }
        }

        // 3. Setting default aturan dapur umum santri (Dinamis)
        $defaultSessions = [
            [
                'id'         => 'pagi',
                'name'       => 'Makan Pagi (Sarapan)',
                'start_time' => '06:00',
                'end_time'   => '08:30',
                'price'      => 10000,
                'is_active'  => true,
            ],
            [
                'id'         => 'siang',
                'name'       => 'Makan Siang',
                'start_time' => '11:30',
                'end_time'   => '13:45',
                'price'      => 12000,
                'is_active'  => true,
            ],
            [
                'id'         => 'malam',
                'name'       => 'Makan Malam',
                'start_time' => '17:30',
                'end_time'   => '19:45',
                'price'      => 12000,
                'is_active'  => true,
            ],
        ];

        Setting::updateOrCreate(
            ['key' => 'dapur_meal_sessions'],
            [
                'value'     => json_encode($defaultSessions),
                'group'     => 'dapur',
                'label'     => 'Konfigurasi Sesi Makan Dapur Umum',
                'is_secret' => false,
            ]
        );

        Setting::updateOrCreate(
            ['key' => 'dapur_prevent_double_tap'],
            [
                'value'     => '1',
                'group'     => 'dapur',
                'label'     => 'Cegah Tap Ganda Santri Dalam Satu Sesi',
                'is_secret' => false,
            ]
        );
    }

    public function down(): void
    {
        TransactionType::whereIn('code', ['COOP-BUY', 'COOP-MEAL'])->delete();
        Setting::whereIn('key', ['dapur_meal_sessions', 'dapur_prevent_double_tap'])->delete();
    }
};
