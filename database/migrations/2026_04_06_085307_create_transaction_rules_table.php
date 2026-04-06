<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaction_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_type_id');
            $table->string('coa_code', 20);
            $table->enum('entry_type', ['debit', 'credit']);
            $table->enum('value_mode', ['total', 'fixed', 'remainder'])->default('total');
            $table->decimal('fixed_amount', 15, 2)->nullable();
            $table->string('description')->nullable();
            $table->timestamps();

            $table->foreign('transaction_type_id')->references('id')->on('transaction_types')->onDelete('cascade');
            $table->foreign('coa_code')->references('coa_code')->on('chart_of_accounts')->onDelete('cascade');
        });

        // Cleanup transaction_types columns
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->dropColumn(['default_debit_coa', 'default_credit_coa']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->string('default_debit_coa', 20)->nullable();
            $table->string('default_credit_coa', 20)->nullable();
        });
        Schema::dropIfExists('transaction_rules');
    }
};
