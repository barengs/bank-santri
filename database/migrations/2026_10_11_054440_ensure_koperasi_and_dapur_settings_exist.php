<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pastikan setting default untuk Koperasi selalu ada (tidak hilang di env lain)
        $settings = [
            [
                'key' => 'koperasi_max_transaction_amount',
                'value' => '100000',
                'group' => 'koperasi',
                'label' => 'Limit Maksimal Per Transaksi (Rp)',
                'is_secret' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'koperasi_daily_limit_tiers',
                'value' => '[{"min":10000,"max":150000,"limit":5000},{"min":150001,"max":300000,"limit":10000},{"min":300001,"max":null,"limit":15000}]',
                'group' => 'koperasi',
                'label' => 'Batas Limit Belanja Harian Koperasi (Tiers)',
                'is_secret' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'dapur_max_transaction_amount',
                'value' => '50000',
                'group' => 'dapur',
                'label' => 'Limit Maksimal Per Transaksi (Rp)',
                'is_secret' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $s) {
            DB::table('settings')->updateOrInsert(
                ['key' => $s['key']],
                $s
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'koperasi_max_transaction_amount',
            'koperasi_daily_limit_tiers',
            'dapur_max_transaction_amount',
        ])->delete();
    }
};
