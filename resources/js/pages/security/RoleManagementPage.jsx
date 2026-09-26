import React, { useState, useEffect } from 'react';
import { 
    useGetRolesQuery, 
    useGetMenusQuery, 
    useSyncRoleMenusMutation,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDestroyRoleMutation
} from '../../store/securityApi';
import { toast } from 'react-toastify';
import { 
    Shield, 
    Settings, 
    CheckCircle2, 
    ChevronRight, 
    Save, 
    Plus, 
    Edit2, 
    Trash2, 
    X,
    Lock,
    Layout,
    Check
} from 'lucide-react';
import Modal from '../../components/Modal';

const RoleManagementPage = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [checkedMenus, setCheckedMenus] = useState([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleFormData, setRoleFormData] = useState({ name: '', slug: '', description: '' });
    const [editingRole, setEditingRole] = useState(null);

    const { data: rolesRes, isLoading: rolesLoading } = useGetRolesQuery();
    const { data: menusRes, isLoading: menusLoading } = useGetMenusQuery();
    const [syncMenus, { isLoading: isSyncing }] = useSyncRoleMenusMutation();
    const [createRole] = useCreateRoleMutation();
    const [updateRole] = useUpdateRoleMutation();
    const [destroyRole] = useDestroyRoleMutation();

    const roles = rolesRes?.data || [];
    const menus = menusRes?.data || [];

    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0]);
        }
    }, [roles]);

    useEffect(() => {
        if (selectedRole) {
            const menuIds = selectedRole.menus?.map(m => m.id) || [];
            setCheckedMenus(menuIds);
        }
    }, [selectedRole]);

    const handleRoleClick = (role) => {
        setSelectedRole(role);
    };

    const handleMenuToggle = (menuId, children = []) => {
        setCheckedMenus(prev => {
            const isChecked = prev.includes(menuId);
            let next = [];
            if (isChecked) {
                const childIds = children?.map(c => c.id) || [];
                next = prev.filter(id => id !== menuId && !childIds.includes(id));
            } else {
                const childIds = children?.map(c => c.id) || [];
                next = Array.from(new Set([...prev, menuId, ...childIds]));
            }
            return next;
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            await syncMenus({ roleId: selectedRole.id, menu_ids: checkedMenus }).unwrap();
            toast.success(`Hak akses menu untuk role ${selectedRole.name} berhasil disimpan!`);
        } catch (err) {
            toast.error(err.data?.message || 'Gagal menyimpan hak akses menu');
        }
    };

    const handleOpenRoleModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setRoleFormData({ name: role.name, slug: role.slug, description: role.description || '' });
        } else {
            setEditingRole(null);
            setRoleFormData({ name: '', slug: '', description: '' });
        }
        setIsRoleModalOpen(true);
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRole({ id: editingRole.id, ...roleFormData }).unwrap();
                toast.success('Role berhasil diperbarui');
            } else {
                await createRole(roleFormData).unwrap();
                toast.success('Role baru berhasil dibuat');
            }
            setIsRoleModalOpen(false);
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan');
        }
    };

    const handleDeleteRole = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Yakin ingin menghapus role ini? Semua user dengan role ini akan kehilangan akses.')) {
            try {
                await destroyRole(id).unwrap();
                toast.success('Role berhasil dihapus');
                if (selectedRole?.id === id) setSelectedRole(roles[0] || null);
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus role');
            }
        }
    };

    if (rolesLoading || menusLoading) {
        return <div className="p-8 text-center text-xs text-gray-500">Memuat data keamanan...</div>;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Role & Hak Akses</h2>
                    <p className="text-xs text-gray-500">Atur pemetaan akses menu untuk setiap tingkatan peran pengguna</p>
                </div>
                <button 
                    onClick={() => handleOpenRoleModal()}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
                >
                    <Plus size={16} />
                    <span>Tambah Role</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Role List */}
                <div className="lg:col-span-4 space-y-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Daftar Role</span>
                    <div className="border border-gray-200 rounded-md overflow-hidden divide-y divide-gray-100">
                        {roles.map((role) => (
                            <div 
                                key={role.id}
                                onClick={() => handleRoleClick(role)}
                                className={`group flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                                    selectedRole?.id === role.id 
                                        ? 'bg-blue-50 border-l-4 border-l-blue-600 font-semibold' 
                                        : 'hover:bg-gray-50 border-l-4 border-l-transparent text-gray-700'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded ${selectedRole?.id === role.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Shield size={14} />
                                    </div>
                                    <div>
                                        <div className="font-semibold capitalize text-gray-800">{role.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{role.slug}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenRoleModal(role); }}
                                        className="border border-blue-300 text-blue-600 hover:bg-blue-50 rounded px-1.5 py-0.5 text-[11px]"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteRole(role.id, e)}
                                        className="border border-rose-300 text-rose-600 hover:bg-rose-50 rounded px-1.5 py-0.5 text-[11px]"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permissions Management */}
                <div className="lg:col-span-8 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Akses Menu Untuk: <span className="text-blue-600 font-bold">{selectedRole?.name || '-'}</span>
                        </span>
                        <button 
                            onClick={handleSavePermissions}
                            disabled={isSyncing || !selectedRole}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
                        >
                            <Save size={14} />
                            {isSyncing ? 'Menyimpan...' : 'Simpan Hak Akses'}
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-md p-3.5 min-h-[350px]">
                        {!selectedRole ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-1">
                                <Shield size={36} className="opacity-20 mb-2" />
                                <p className="text-xs">Pilih salah satu role di sebelah kiri.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {menus.map((menu) => (
                                    <div key={menu.id} className="space-y-1.5">
                                        <div 
                                            onClick={() => handleMenuToggle(menu.id, menu.children)}
                                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${
                                                checkedMenus.includes(menu.id)
                                                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                checkedMenus.includes(menu.id)
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'bg-white border-gray-300'
                                            }`}>
                                                {checkedMenus.includes(menu.id) && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className="uppercase tracking-wide text-xs">{menu.name}</span>
                                        </div>

                                        {menu.children && menu.children.length > 0 && (
                                            <div className="grid grid-cols-1 gap-1 ml-4 pl-3 border-l border-gray-200">
                                                {menu.children.map((child) => (
                                                    <div 
                                                        key={child.id}
                                                        onClick={() => handleMenuToggle(child.id)}
                                                        className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer text-xs transition-colors ${
                                                            checkedMenus.includes(child.id)
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                                            checkedMenus.includes(child.id)
                                                                ? 'bg-blue-600 border-blue-600'
                                                                : 'bg-white border-gray-300'
                                                        }`}>
                                                            {checkedMenus.includes(child.id) && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <span className="text-[11px]">{child.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Flat Role Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
            >
                <form onSubmit={handleRoleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Role</label>
                        <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Contoh: Teller Kasir"
                            value={roleFormData.name}
                            onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Slug / Kode (Opsional)</label>
                        <input
                            type="text"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="contoh: teller-kasir"
                            value={roleFormData.slug}
                            onChange={(e) => setRoleFormData({...roleFormData, slug: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Deskripsi</label>
                        <textarea
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-20"
                            placeholder="Jelaskan peran dan wewenang role..."
                            value={roleFormData.description}
                            onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                        />
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRoleModalOpen(false)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
                        >
                            {editingRole ? 'Simpan Perubahan' : 'Tambah Role'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoleManagementPage;
