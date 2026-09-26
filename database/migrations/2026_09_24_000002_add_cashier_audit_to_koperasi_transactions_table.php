<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('koperasi_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('account_number')->comment('ID Kasir/Petugas yang memproses');
            $table->string('cashier_name', 150)->nullable()->after('user_id')->comment('Nama Kasir saat transaksi');

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('koperasi_transactions', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'cashier_name']);
        });
    }
};
