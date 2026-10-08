<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Index performa untuk laporan rekapitulasi & jurnal.
     * Kolom yang dibutuhkan oleh filter tanggal, arus (type),
     * join transaksi, dan filter produk/rekening.
     */
    public function up(): void
    {
        Schema::table('account_movements', function (Blueprint $table) {
            // Filter rentang tanggal (WHERE created_at BETWEEN ...)
            $table->index('created_at', 'am_created_at_idx');

            // Kombinasi filter periode + arus transaksi (kredit/debit)
            $table->index(['created_at', 'type'], 'am_created_at_type_idx');

            // Join ke transactions & whereIn(transaction_id) pada filter rincian
            $table->index('transaction_id', 'am_transaction_id_idx');
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Filter rentang tanggal transaksi (jurnal, laporan)
            $table->index('created_at', 'trx_created_at_idx');

            // Kombinasi periode + tipe transaksi (aturan transaksi)
            $table->index(['transaction_type_id', 'created_at'], 'trx_type_created_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_movements', function (Blueprint $table) {
            $table->dropIndex('am_created_at_idx');
            $table->dropIndex('am_created_at_type_idx');
            $table->dropIndex('am_transaction_id_idx');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('trx_created_at_idx');
            $table->dropIndex('trx_type_created_at_idx');
        });
    }
};
