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
        return response()->json(['data' => Role::with('menus', 'permissions')->get()]);
    }

    public function storeRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:roles,slug',
            'description' => 'nullable|string'
        ]);

        $role = Role::create([
            'name' => $request->name,
            'slug' => $request->slug ?? Str::slug($request->name),
            'description' => $request->description
        ]);

        return response()->json(['message' => 'Role berhasil ditambahkan.', 'data' => $role]);
    }

    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:roles,slug,' . $id,
            'description' => 'nullable|string'
        ]);

        $role->update($request->all());
        return response()->json(['message' => 'Role berhasil diperbarui.', 'data' => $role]);
    }

    public function destroyRole($id)
    {
        $role = Role::findOrFail($id);
        if (in_array($role->slug, ['admin', 'teller'])) {
            return response()->json(['message' => 'Role sistem tidak dapat dihapus.'], 403);
        }
        $role->delete();
        return response()->json(['message' => 'Role berhasil dihapus.']);
    }

    public function syncRoleMenus(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $role->menus()->sync($request->menu_ids);
        return response()->json(['message' => 'Hak akses menu berhasil diperbarui.']);
    }

    // Permission CRUD
    public function getPermissions()
    {
        return response()->json(['data' => Permission::all()]);
    }
}
