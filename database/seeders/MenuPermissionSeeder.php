<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Str;

class MenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $menus = Menu::where('is_divider', false)->get();
        $actions = ['view', 'create', 'update', 'delete', 'print', 'approve'];

        $created = 0;
        $allPermNames = [];

        foreach ($menus as $menu) {
            $slug = Str::slug($menu->name, '_');
            foreach ($actions as $action) {
                $permName = "{$slug}.{$action}";
                $allPermNames[] = $permName;
                $perm = Permission::firstOrCreate([
                    'name' => $permName,
                    'guard_name' => 'api'
                ]);
                if ($perm->wasRecentlyCreated) {
                    $created++;
                }
            }
        }

        // 1. Assign all permissions to 'admin'
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions(Permission::all());
        }

        // 2. Assign permissions for adminbank based on their menus
        $adminBank = Role::where('name', 'adminbank')->first();
        if ($adminBank) {
            $menuSlugs = $adminBank->menus->map(fn($m) => Str::slug($m->name, '_'))->toArray();
            $perms = Permission::where(function($q) use ($menuSlugs) {
                foreach ($menuSlugs as $slug) {
                    $q->orWhere('name', 'like', "{$slug}.%");
                }
            })->get();
            $adminBank->syncPermissions($perms);
        }

        // 3. Assign permissions for teller (operasional & transaksi actions)
        $teller = Role::where('name', 'teller')->first();
        if ($teller) {
            $tellerMenuSlugs = $teller->menus->map(fn($m) => Str::slug($m->name, '_'))->toArray();
            $tellerActions = ['view', 'create', 'update', 'print'];
            $perms = Permission::where(function($q) use ($tellerMenuSlugs, $tellerActions) {
                foreach ($tellerMenuSlugs as $slug) {
                    foreach ($tellerActions as $act) {
                        $q->orWhere('name', "{$slug}.{$act}");
                    }
                }
            })->get();
            $teller->syncPermissions($perms);
        }

        // 4. Assign permissions for pimpinan (view, print, approve on reports & dashboard)
        $pimpinan = Role::where('name', 'pimpinan')->first();
        if ($pimpinan) {
            $pimpinanMenuSlugs = $pimpinan->menus->map(fn($m) => Str::slug($m->name, '_'))->toArray();
            $pimpinanActions = ['view', 'print', 'approve'];
            $perms = Permission::where(function($q) use ($pimpinanMenuSlugs, $pimpinanActions) {
                foreach ($pimpinanMenuSlugs as $slug) {
                    foreach ($pimpinanActions as $act) {
                        $q->orWhere('name', "{$slug}.{$act}");
                    }
                }
            })->get();
            $pimpinan->syncPermissions($perms);
        }

        echo "Permissions synced for all roles.\n";
    }
}

