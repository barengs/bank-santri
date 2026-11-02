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
        Schema::table('roles', function (Blueprint $table) {
            $table->foreignId('product_id')
                ->nullable()
                ->after('guard_name')
                ->constrained('products')
                ->nullOnDelete();
        });

        // Seed / inisialisasi default roles berbasis cakupan produk bank (Tibyan vs Kubar)
        $now = now();
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

