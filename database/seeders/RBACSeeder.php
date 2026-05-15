<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Menu;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RBACSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles (Spatie)
        $admin = Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $adminBank = Role::updateOrCreate(['name' => 'adminbank', 'guard_name' => 'api']);
        $teller = Role::updateOrCreate(['name' => 'teller', 'guard_name' => 'api']);
        $pimpinan = Role::updateOrCreate(['name' => 'pimpinan', 'guard_name' => 'api']);

        // 2. Menus
        $menus = [
            ['name' => 'Dashboard Bank', 'icon' => 'LayoutDashboard', 'path' => '/', 'roles' => ['admin', 'adminbank', 'pimpinan', 'teller']],
            
            ['name' => 'Operasional Bank', 'icon' => 'CreditCard', 'path' => null, 'roles' => ['admin', 'adminbank', 'teller'], 'children' => [
                ['name' => 'Transaksi Bank', 'icon' => 'CreditCard', 'path' => '/transaksi'],
                ['name' => 'Entri Transaksi', 'icon' => 'PlusCircle', 'path' => '/entri-transaksi'],
                ['name' => 'Rekening Bank', 'icon' => 'Users', 'path' => '/nasabah'],
                ['name' => 'Top-Up / Setor Tunai', 'icon' => 'PlusCircle', 'path' => '/topup'],
                ['name' => 'Transfer Bank', 'icon' => 'Send', 'path' => '/transfer'],
                ['name' => 'Mutasi Rekening', 'icon' => 'History', 'path' => '/mutasi'],
            ]],

            ['name' => 'Pembayaran & Tagihan', 'icon' => 'Package', 'path' => null, 'roles' => ['admin', 'adminbank', 'teller'], 'children' => [
                ['name' => 'Paket Pembayaran', 'icon' => 'Package', 'path' => '/paket-pembayaran'],
                ['name' => 'Proses Pembayaran', 'icon' => 'Receipt', 'path' => '/proses-pembayaran'],
                ['name' => 'Verifikasi Top-up', 'icon' => 'ShieldCheck', 'path' => '/verifikasi-topup'],
            ]],

            ['name' => 'Kasir Koperasi', 'icon' => 'ShoppingCart', 'path' => '/koperasi', 'roles' => ['admin', 'adminbank', 'teller']],
            ['name' => 'Laporan', 'icon' => 'PieChart', 'path' => '/laporan', 'roles' => ['admin', 'adminbank', 'pimpinan']],
            
            ['name' => 'divider_master', 'is_divider' => true, 'roles' => ['admin', 'adminbank']],

            ['name' => 'Master Data', 'icon' => 'Settings', 'path' => null, 'roles' => ['admin', 'adminbank'], 'children' => [
                ['name' => 'Produk Bank', 'icon' => 'Package', 'path' => '/master/produk'],
                ['name' => 'COA Bank', 'icon' => 'ArrowRightLeft', 'path' => '/master/coa'],
                ['name' => 'Master Rincian Transaksi', 'icon' => 'DollarSign', 'path' => '/master/rincian-transaksi'],
                ['name' => 'Jenis Transaksi Bank', 'icon' => 'Settings', 'path' => '/master/jenis-transaksi'],
                ['name' => 'Merchant Koperasi', 'icon' => 'Store', 'path' => '/master/koperasi-merchant'],
                ['name' => 'Pengaturan Bank', 'icon' => 'ShieldCheck', 'path' => '/master/pengaturan'],
            ]],

            ['name' => 'divider_security', 'is_divider' => true, 'roles' => ['admin']],

            ['name' => 'Keamanan Sistem', 'icon' => 'ShieldCheck', 'path' => null, 'roles' => ['admin'], 'children' => [
                ['name' => 'Manajemen User', 'icon' => 'Users', 'path' => '/security/user'],
                ['name' => 'Manajemen Menu', 'icon' => 'LayoutDashboard', 'path' => '/security/menu'],
                ['name' => 'Role & Hak Akses', 'icon' => 'ShieldCheck', 'path' => '/security/role'],
                ['name' => 'Permission', 'icon' => 'Lock', 'path' => '/security/permission'],
            ]],
        ];

        $order = 1;
        foreach ($menus as $m) {
            $menu = Menu::updateOrCreate(
                ['name' => $m['name'], 'path' => $m['path'] ?? null],
                [
                    'icon' => $m['icon'] ?? null,
                    'sort_order' => $order++,
                    'is_divider' => $m['is_divider'] ?? false,
                ]
            );

            // Attach roles
            if (isset($m['roles'])) {
                $roleIds = Role::whereIn('name', $m['roles'])->pluck('id');
                $menu->roles()->sync($roleIds);
            }

            // Children
            if (isset($m['children'])) {
                $childOrder = 1;
                foreach ($m['children'] as $c) {
                    $child = Menu::updateOrCreate(
                        ['name' => $c['name'], 'parent_id' => $menu->id],
                        [
                            'icon' => $c['icon'] ?? null,
                            'path' => $c['path'] ?? null,
                            'sort_order' => $childOrder++,
                        ]
                    );
                    if (isset($m['roles'])) {
                        $child->roles()->sync($roleIds);
                    }
                }
            }
        }

        // 3. Link existing users to roles
        $users = User::all();
        foreach ($users as $user) {
            // Check if user has legacy 'role' column value
            $roleName = $user->role ?? 'teller';
            $user->assignRole($roleName);
        }
    }
}
