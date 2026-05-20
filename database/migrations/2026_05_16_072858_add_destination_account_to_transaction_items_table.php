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
        Schema::table('transaction_items', function (Blueprint $table) {
            $table->string('destination_account', 30)->nullable()->after('coa_code')->comment('No Rekening Instansi Tujuan (Opsional)');
            $table->foreign('destination_account')->references('account_number')->on('accounts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_items', function (Blueprint $table) {
            $table->dropForeign(['destination_account']);
            $table->dropColumn('destination_account');
        });
    }
};
