<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // Master Paket Pembayaran
        // ============================================================
        Schema::create('payment_packages', function (Blueprint $table) {
            $table->id();
            $table->string('package_code', 30)->unique()->comment('Kode unik, mis: PKT-A-2025-1');
            $table->string('package_name', 150)->comment('Nama paket, mis: Paket A Semester Ganjil 2025');
            $table->text('description')->nullable();
            $table->string('academic_year', 20)->nullable()->comment('Tahun ajaran, mis: 2024/2025');
            $table->enum('semester', ['ganjil', 'genap'])->nullable();
            $table->decimal('total_amount', 15, 2)->default(0)->comment('Total nominal (auto-sum dari items)');
            $table->decimal('saku_amount', 15, 2)->default(0)->comment('Porsi uang saku (tetap di balance)');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ============================================================
        // Rincian Item dalam Paket
        // Kategori menentukan apakah dana langsung dialokasikan
        // atau tetap mengendap sebagai uang saku.
        // ============================================================
        Schema::create('payment_package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('payment_packages')->onDelete('cascade');
            $table->string('item_name', 150)->comment('mis: SPP, Uang Asrama, Uang Makan, Uang Saku');
            $table->enum('category', [
                'pendidikan',   // SPP, KBM, Ujian
                'asrama',       // Uang asrama, listrik, air
                'konsumsi',     // Uang makan
                'kesehatan',    // Dana kesehatan
                'saku',         // Uang saku — TIDAK dieksekusi langsung, tetap di rekening
                'lainnya',
            ])->default('lainnya');
            $table->decimal('amount', 15, 2);
            $table->boolean('is_saku')->default(false)->comment('True = dana tetap di rekening, bisa ditarik di koperasi');
            $table->timestamps();
        });

        // ============================================================
        // Catatan Pembayaran per Santri
        // Dibuat saat admin memproses pembayaran dari saldo rekening.
        // ============================================================
        Schema::create('payment_records', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 30);
            $table->foreignId('package_id')->constrained('payment_packages');
            $table->foreignId('top_up_request_id')->nullable()->constrained('top_up_requests')->nullOnDelete();
            $table->string('reference_number', 50)->unique()->comment('Nomor referensi pembayaran');
            $table->decimal('total_amount', 15, 2)->comment('Total yang dibayarkan (non-saku)');
            $table->decimal('saku_allocated', 15, 2)->default(0)->comment('Porsi saku yang dikreditkan ke rekening');
            $table->enum('status', ['pending', 'paid', 'partial', 'cancelled'])->default('paid');
            $table->timestamp('paid_at')->nullable()->useCurrent();
            $table->unsignedBigInteger('processed_by')->nullable()->comment('user_id admin yang proses');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('account_number')->references('account_number')->on('accounts')->onDelete('cascade');
        });

        // ============================================================
        // Rincian per Item dalam Payment Record
        // ============================================================
        Schema::create('payment_record_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_record_id')->constrained('payment_records')->onDelete('cascade');
            $table->foreignId('package_item_id')->constrained('payment_package_items');
            $table->string('item_name', 150);
            $table->string('category', 30);
            $table->decimal('amount', 15, 2);
            $table->boolean('is_saku')->default(false);
            $table->timestamps();
        });

        // ============================================================
        // Koperasi Transactions
        // Transaksi debit di koperasi via QR Code kartu santri.
        // ============================================================
        Schema::create('koperasi_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 30);
            $table->string('reference_number', 50)->unique();
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('outlet_name', 100)->nullable()->comment('Nama koperasi/outlet');
            $table->string('item_description', 255)->nullable()->comment('Deskripsi barang yang dibeli');
            $table->string('cashier_note', 255)->nullable();
            $table->timestamps();

            $table->foreign('account_number')->references('account_number')->on('accounts')->onDelete('cascade');
        });

        // ============================================================
        // Settings / Konfigurasi Aplikasi
        // ============================================================
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general')->comment('general, midtrans, koperasi, smpt');
            $table->string('label', 150)->nullable()->comment('Label untuk UI');
            $table->boolean('is_secret')->default(false)->comment('True = tidak ditampilkan di response');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('koperasi_transactions');
        Schema::dropIfExists('payment_record_items');
        Schema::dropIfExists('payment_records');
        Schema::dropIfExists('payment_package_items');
        Schema::dropIfExists('payment_packages');
    }
};
