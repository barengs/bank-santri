<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_code', 20)->unique();
            $table->string('product_name', 100);
            $table->enum('product_type', ['Tabungan', 'Deposito', 'Pinjaman'])->default('Tabungan');
            $table->decimal('interest_rate', 5, 2)->default(0)->comment('Nisbah bagi hasil (%)');
            $table->decimal('admin_fee', 12, 2)->default(0);
            $table->decimal('opening_fee', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('accounts', function (Blueprint $table) {
            $table->string('account_number', 30)->primary()->comment('= NIS santri');
            $table->unsignedBigInteger('customer_id')->comment('Student ID di smpt');
            $table->string('customer_name');
            $table->unsignedBigInteger('product_id');
            $table->decimal('balance', 15, 2)->default(0);
            $table->enum('status', ['AKTIF', 'TIDAK AKTIF', 'TUTUP', 'TERBLOKIR', 'DIBEKUKAN'])->default('AKTIF');
            $table->enum('akad_type', ['wadiah', 'mudharabah'])->default('wadiah');
            $table->date('open_date');
            $table->date('close_date')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });

        Schema::create('transaction_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('category', ['transfer', 'payment', 'cash_operation', 'fee', 'topup']);
            $table->boolean('is_debit')->default(false);
            $table->boolean('is_credit')->default(false);
            $table->string('default_debit_coa')->nullable();
            $table->string('default_credit_coa')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('transaction_type_id')->nullable();
            $table->string('source_account', 30)->nullable();
            $table->string('destination_account', 30)->nullable();
            $table->string('reference_number', 50)->unique();
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'reversed'])->default('success');
            $table->string('channel', 30)->nullable()->comment('teller|midtrans|bank_transfer|system');
            $table->string('akad_type', 30)->nullable()->comment('ijarah|murabahah|wadiah|qardh|wakalah');
            $table->text('akad_description')->nullable();
            $table->timestamps();

            $table->foreign('transaction_type_id')->references('id')->on('transaction_types')->nullOnDelete();
            $table->foreign('source_account')->references('account_number')->on('accounts')->nullOnDelete();
            $table->foreign('destination_account')->references('account_number')->on('accounts')->nullOnDelete();
        });

        Schema::create('account_movements', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 30);
            $table->uuid('transaction_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->enum('type', ['credit', 'debit']);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('account_number')->references('account_number')->on('accounts')->onDelete('cascade');
        });

        Schema::create('transaction_ledgers', function (Blueprint $table) {
            $table->id();
            $table->uuid('transaction_id');
            $table->string('coa_code', 20);
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
        });

        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->string('coa_code', 20)->primary();
            $table->string('account_name', 100);
            $table->enum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense', 'zis']);
            $table->string('parent_coa_code', 20)->nullable();
            $table->unsignedTinyInteger('level')->default(1);
            $table->boolean('is_postable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('parent_coa_code')->references('coa_code')->on('chart_of_accounts')->nullOnDelete();
        });

        Schema::create('top_up_requests', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 30);
            $table->unsignedBigInteger('student_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->enum('channel', ['cash', 'bank_transfer', 'midtrans']);
            $table->enum('status', ['pending', 'waiting_verification', 'success', 'failed'])->default('pending');
            $table->string('payment_ref', 100)->nullable();
            $table->string('payment_proof')->nullable()->comment('Path foto bukti transfer');
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('account_number')->references('account_number')->on('accounts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('top_up_requests');
        Schema::dropIfExists('transaction_ledgers');
        Schema::dropIfExists('account_movements');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('transaction_types');
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('products');
        Schema::dropIfExists('chart_of_accounts');
    }
};
