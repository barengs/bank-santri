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

        // Assign all permissions to 'admin' role by default
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions(Permission::all());
        }

        echo "Created {$created} permissions. Total permissions: " . Permission::count() . "\n";
    }
}
