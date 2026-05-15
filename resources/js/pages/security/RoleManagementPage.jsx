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
    Layout
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
            let next = isChecked ? prev.filter(id => id !== menuId) : [...prev, menuId];
            
            // If checking a parent, check all children. If unchecking, uncheck all.
            if (children.length > 0) {
                const childIds = children.map(c => c.id);
                if (!isChecked) {
                    next = [...new Set([...next, ...childIds])];
                } else {
                    next = next.filter(id => !childIds.includes(id));
                }
            }
            return next;
        });
    };

    const handleSavePermissions = async () => {
        try {
            await syncMenus({ 
                id: selectedRole.id, 
                menu_ids: checkedMenus 
            }).unwrap();
            toast.success('Hak akses menu berhasil diperbarui');
        } catch (err) {
            toast.error('Gagal memperbarui hak akses');
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
                toast.success('Role baru berhasil ditambahkan');
            }
            setIsRoleModalOpen(false);
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan');
        }
    };

    const handleDeleteRole = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Hapus role ini? User yang memiliki role ini akan kehilangan akses.')) {
            try {
                await destroyRole(id).unwrap();
                toast.success('Role berhasil dihapus');
                if (selectedRole?.id === id) setSelectedRole(roles[0] || null);
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus role');
            }
        }
    };

    if (rolesLoading || menusLoading) return <div className="p-8 text-center text-slate-500">Memuat data keamanan...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Role & Hak Akses</h1>
                    <p className="text-slate-500">Atur pemetaan menu untuk setiap peran pengguna.</p>
                </div>
                <button 
                    onClick={() => handleOpenRoleModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={20} />
                    <span>Tambah Role</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Role List */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daftar Role</h2>
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        {roles.map((role) => (
                            <div 
                                key={role.id}
                                onClick={() => handleRoleClick(role)}
                                className={`group flex items-center justify-between p-4 cursor-pointer border-b border-slate-100 last:border-0 transition-all ${
                                    selectedRole?.id === role.id 
                                        ? 'bg-indigo-50 border-l-4 border-l-indigo-600' 
                                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${selectedRole?.id === role.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <div className={`font-bold capitalize ${selectedRole?.id === role.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            {role.name}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{role.slug}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenRoleModal(role); }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-xl"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteRole(role.id, e)}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-xl"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <ChevronRight size={20} className={selectedRole?.id === role.id ? 'text-indigo-400' : 'text-slate-300'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permissions Management */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Akses Menu Untuk: <span className="text-indigo-600">{selectedRole?.name || '-'}</span>
                        </h2>
                        <button 
                            onClick={handleSavePermissions}
                            disabled={isSyncing || !selectedRole}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Save size={18} />
                            {isSyncing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm min-h-[400px]">
                        {!selectedRole ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                <Shield size={48} className="opacity-20" />
                                <p>Pilih role untuk mengatur hak akses menu.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {menus.map((menu) => (
                                    <div key={menu.id} className="space-y-3">
                                        <div 
                                            onClick={() => handleMenuToggle(menu.id, menu.children)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                checkedMenus.includes(menu.id)
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                                checkedMenus.includes(menu.id)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'bg-white border-slate-300'
                                            }`}>
                                                {checkedMenus.includes(menu.id) && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <span className="font-bold text-sm uppercase tracking-wide">{menu.name}</span>
                                        </div>

                                        {menu.children && menu.children.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 ml-4 pl-4 border-l-2 border-slate-100">
                                                {menu.children.map((child) => (
                                                    <div 
                                                        key={child.id}
                                                        onClick={() => handleMenuToggle(child.id)}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                            checkedMenus.includes(child.id)
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                                : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 shadow-sm'
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                            checkedMenus.includes(child.id)
                                                                ? 'bg-blue-600 border-blue-600'
                                                                : 'bg-white border-slate-300'
                                                        }`}>
                                                            {checkedMenus.includes(child.id) && <CheckCircle2 size={12} className="text-white" />}
                                                        </div>
                                                        <span className="text-xs font-semibold">{child.name}</span>
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

            {/* Role Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
            >
                <form onSubmit={handleRoleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Nama Role</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Contoh: Manager Operasional"
                                    value={roleFormData.name}
                                    onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Slug / Kode (Opsional)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="contoh: manager-ops"
                                    value={roleFormData.slug}
                                    onChange={(e) => setRoleFormData({...roleFormData, slug: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                            <div className="relative">
                                <Layout className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                    placeholder="Jelaskan tanggung jawab role ini..."
                                    value={roleFormData.description}
                                    onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsRoleModalOpen(false)}
                            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/20 transition-all"
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
