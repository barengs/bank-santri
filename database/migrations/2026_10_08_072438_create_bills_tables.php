<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // Tagihan Bulanan Santri (Bills)
        // Masing-masing baris = tagihan SATU periode bulan untuk SATU rekening.
        // `amount` di-FREEZE saat tagihan dibuat (snapshot harga paket saat itu),
        // sehingga kenaikan kebijakan paket TIDAK mengubah tagihan lama.
        // ============================================================
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 30);
            $table->foreignId('package_id')->nullable()
                  ->constrained('payment_packages')->nullOnDelete();
            $table->string('bill_period', 7)->comment('Periode tagihan, format YYYY-MM, mis: 2026-03');
            $table->json('package_snapshot')->comment('Frozen copy items + harga paket saat tagihan dibuat');
            $table->decimal('amount', 15, 2)->comment('Tagihan yang harus dibayar (sudah di-freeze)');
            $table->decimal('paid_amount', 15, 2)->default(0)->comment('Akumulasi pembayaran yang sudah masuk');
            $table->date('due_date')->comment('Jatuh tempo pembayaran');
            $table->string('status', 20)->default('unpaid')
                  ->comment('unpaid | partial | paid | overdue | waived');
            $table->timestamp('issued_at')->nullable()->comment('Waktu tagihan diterbitkan oleh staf');
            $table->unsignedBigInteger('issued_by')->nullable()->comment('user_id staf yang menerbitkan');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('account_number')->references('account_number')->on('accounts')->onDelete('cascade');
            $table->unique(['account_number', 'bill_period'], 'bills_account_period_unique');
            $table->index(['status', 'due_date']);
        });

        // ============================================================
        // Alokasi Pembayaran ke Tagihan (Parsial / FIFO)
        // Satu transaksi pembayaran bisa dipecah ke beberapa tagihan
        // (mis: bayar 200rb menutup Maret dulu, sisanya ke April).
        // ============================================================
        Schema::create('bill_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');
            $table->foreignId('payment_record_id')->nullable()
                  ->constrained('payment_records')->nullOnDelete();
            $table->decimal('amount', 15, 2)->comment('Porsi pembayaran yang dialokasikan ke tagihan ini');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_payments');
        Schema::dropIfExists('bills');
    }
};
