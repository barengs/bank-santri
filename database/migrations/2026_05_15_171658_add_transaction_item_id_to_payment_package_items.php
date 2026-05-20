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
        Schema::table('payment_package_items', function (Blueprint $table) {
            $table->foreignId('transaction_item_id')->nullable()->after('package_id')->constrained('transaction_items')->nullOnDelete();
        });

        Schema::table('payment_record_items', function (Blueprint $table) {
            $table->foreignId('transaction_item_id')->nullable()->after('package_item_id')->constrained('transaction_items')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payment_package_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transaction_item_id');
        });

        Schema::table('payment_record_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transaction_item_id');
        });
    }
};
