<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SecurityController extends Controller
{
    public function sidebar()
    {
        $user = auth('api')->user();
        if (!$user) return response()->json(['data' => []]);

        // Get all role IDs for the user
        $roleIds = $user->roles->pluck('id')->toArray();

        $menus = Menu::whereNull('parent_id')
            ->whereHas('roles', function($q) use ($roleIds) {
                $q->whereIn('roles.id', $roleIds);
            })
            ->with(['children' => function($q) use ($roleIds) {
                $q->whereHas('roles', function($sq) use ($roleIds) {
                    $sq->whereIn('roles.id', $roleIds);
                })->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $menus]);
    }

    // Menu CRUD
    public function getMenus()
    {
        return response()->json(['data' => Menu::with('children')->whereNull('parent_id')->orderBy('sort_order')->get()]);
    }

    // Role CRUD
    public function getRoles()
    {
        // Self-healing: jika tabel permissions kosong atau role admin belum memiliki permission, jalankan seeder
        if (Permission::count() === 0 || (Role::where('name', 'admin')->first() && Role::where('name', 'admin')->first()->permissions()->count() === 0)) {
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'MenuPermissionSeeder', '--force' => true]);
        }

        $roles = Role::where('guard_name', 'api')
            ->with(['menus', 'permissions', 'product'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $roles,
        ]);
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:100|unique:roles,name',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $role = Role::create([
            'name'       => Str::slug($validated['name']),
            'guard_name' => 'api',
            'product_id' => $validated['product_id'] ?? null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Role berhasil ditambahkan.',
            'data'    => $role->load(['menus', 'permissions', 'product']),
        ], 201);
    }

    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        if (in_array($role->name, ['admin', 'pimpinan'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Nama role sistem utama tidak dapat diubah.',
            ], 403);
        }

        $validated = $request->validate([
            'name'       => 'required|string|max:100|unique:roles,name,' . $id,
            'product_id' => 'nullable|exists:products,id',
        ]);

        $role->update([
            'name'       => Str::slug($validated['name']),
            'product_id' => $validated['product_id'] ?? null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Role berhasil diperbarui.',
            'data'    => $role->load(['menus', 'permissions', 'product']),
        ]);
    }

    public function destroyRole($id)
    {
        $role = Role::findOrFail($id);
        if (in_array($role->name, ['admin', 'adminbank', 'pimpinan', 'teller', 'kasir_koperasi', 'petugas_dpu'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Role sistem tidak dapat dihapus.',
            ], 403);
        }
        $role->delete();
        return response()->json([
            'status'  => 'success',
            'message' => 'Role berhasil dihapus.',
        ]);
    }

    public function syncRoleMenus(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $request->validate([
            'menu_ids'   => 'present|array',
            'menu_ids.*' => 'exists:menus,id',
        ]);

        $menuIds = $request->input('menu_ids', []);
        $parentIds = Menu::whereIn('id', $menuIds)
            ->whereNotNull('parent_id')
            ->pluck('parent_id')
            ->unique()
            ->toArray();

        $allMenuIds = array_values(array_unique(array_merge($menuIds, $parentIds)));
        $role->menus()->sync($allMenuIds);

        return response()->json([
            'status'  => 'success',
            'message' => 'Hak akses menu berhasil diperbarui.',
            'data'    => $role->fresh()->load('menus'),
        ]);
    }

    public function syncRolePermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $permissions = $request->input('permission_ids') ?? $request->input('permissions', []);

        $role->syncPermissions($permissions);
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'status'  => 'success',
            'message' => 'Permission matrix berhasil diperbarui.',
            'data'    => $role->fresh()->load('permissions'),
        ]);
    }

    // Permission CRUD
    public function getPermissions()
    {
        return response()->json(['data' => Permission::all()]);
    }
}
