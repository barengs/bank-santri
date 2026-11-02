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
        Schema::table('koperasi_merchants', function (Blueprint $table) {
            $table->string('account_number')->nullable()->after('name');
            $table->foreign('account_number')
                ->references('account_number')
                ->on('accounts')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('koperasi_merchants', function (Blueprint $table) {
            $table->dropForeign(['account_number']);
            $table->dropColumn('account_number');
        });
    }
};
