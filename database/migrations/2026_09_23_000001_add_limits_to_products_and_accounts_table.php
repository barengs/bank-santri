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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('minimum_balance', 15, 2)->default(0)->after('opening_fee');
            $table->decimal('daily_withdrawal_limit', 15, 2)->nullable()->after('minimum_balance');
        });

        Schema::table('accounts', function (Blueprint $table) {
            $table->decimal('daily_withdrawal_limit', 15, 2)->nullable()->after('balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('daily_withdrawal_limit');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['minimum_balance', 'daily_withdrawal_limit']);
        });
    }
};
