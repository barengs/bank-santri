<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'product_id')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->foreignId('product_id')
                    ->nullable()
                    ->after('guard_name')
                    ->constrained('products')
                    ->nullOnDelete();
            });
        }

        $now = now();

        // Pastikan default products tersedia terlebih dahulu agar foreign key valid
        DB::table('products')->updateOrInsert(
            ['id' => 1],
            [
                'product_code' => 'TAB001',
                'product_name' => 'Tabungan Tibyan',
                'product_type' => 'Tabungan',
                'interest_rate' => 0,
                'admin_fee' => 0,
                'opening_fee' => 50000,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('products')->updateOrInsert(
            ['id' => 2],
            [
                'product_code' => 'TAB002',
                'product_name' => 'Tabungan Kubar',
                'product_type' => 'Tabungan',
                'interest_rate' => 0,
                'admin_fee' => 0,
                'opening_fee' => 50000,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Seed / inisialisasi default roles berbasis cakupan produk bank (Tibyan vs Kubar)
        $rolesToSeed = [
            [
                'name'       => 'teller-tibyan',
                'guard_name' => 'api',
                'product_id' => 1, // Tabungan Tibyan
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'teller-kubar',
                'guard_name' => 'api',
                'product_id' => 2, // Tabungan Kubar
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($rolesToSeed as $r) {
            $exists = DB::table('roles')->where('name', $r['name'])->where('guard_name', 'api')->first();
            if (!$exists) {
                $roleId = DB::table('roles')->insertGetId($r);

                // Salin hak akses menu & permission dari role teller standar
                $baseRole = DB::table('roles')->where('name', 'teller')->where('guard_name', 'api')->first();
                if ($baseRole) {
                    $baseMenus = DB::table('role_menu')->where('role_id', $baseRole->id)->get();
                    foreach ($baseMenus as $bm) {
                        DB::table('role_menu')->insertOrIgnore([
                            'role_id' => $roleId,
                            'menu_id' => $bm->menu_id,
                        ]);
                    }

                    $basePerms = DB::table('role_has_permissions')->where('role_id', $baseRole->id)->get();
                    foreach ($basePerms as $bp) {
                        DB::table('role_has_permissions')->insertOrIgnore([
                            'role_id'       => $roleId,
                            'permission_id' => $bp->permission_id,
                        ]);
                    }
                }
            } else {
                DB::table('roles')->where('id', $exists->id)->update(['product_id' => $r['product_id']]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn('product_id');
        });
    }
};

