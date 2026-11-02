import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { 
    useGetUsersQuery, 
    useCreateUserMutation, 
    useUpdateUserMutation, 
    useDeleteUserMutation 
} from '../../store/userApi';
import { useGetRolesQuery } from '../../store/securityApi';
import { toast } from 'react-toastify';
import { UserPlus, Edit, Trash2, Shield, Mail, Lock, User as UserIcon, X, Check } from 'lucide-react';

const UserManagementPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role_ids: []
    });

    const { data: usersRes, isLoading, isFetching } = useGetUsersQuery({ page, search });
    const { data: rolesRes } = useGetRolesQuery();
    const [createUser] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();

    const roles = rolesRes?.data || [];

    const handleOpenModal = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role_ids: user.roles?.map(r => r.id) || []
            });
        } else {
            setSelectedUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role_ids: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await updateUser({ id: selectedUser.id, ...formData }).unwrap();
                toast.success('User berhasil diperbarui');
            } else {
                await createUser(formData).unwrap();
                toast.success('User berhasil ditambahkan');
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan sistem');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            try {
                await deleteUser(id).unwrap();
                toast.success('User berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus user');
            }
        }
    };

    const toggleRole = (roleId) => {
        setFormData(prev => {
            const exists = prev.role_ids.includes(roleId);
            if (exists) {
                return { ...prev, role_ids: prev.role_ids.filter(id => id !== roleId) };
            } else {
                return { ...prev, role_ids: [...prev.role_ids, roleId] };
            }
        });
    };

    const columns = [
        {
            header: 'USER / EMAIL',
            accessorKey: 'name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {row.original.name?.[0] || 'U'}
                    </div>
                    <div>
                        <span className="font-semibold text-gray-900 block text-xs">{row.original.name}</span>
                        <span className="text-[11px] text-gray-400">{row.original.email}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'ROLES / HAK AKSES',
            accessorKey: 'roles',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.roles?.length > 0 ? row.original.roles.map(role => {
                        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        let prodBadge = null;

                        if (role.product_id === 1 || role.name?.includes('tibyan')) {
                            badgeColor = 'bg-sky-50 text-sky-800 border-sky-300';
                            prodBadge = 'Tibyan';
                        } else if (role.product_id === 2 || role.name?.includes('kubar')) {
                            badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                            prodBadge = 'Kubar';
                        }

                        return (
                            <span key={role.id} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border uppercase ${badgeColor}`}>
                                <span>{role.name}</span>
                                {prodBadge && (
                                    <span className="text-[8px] font-bold px-1 py-0.2 bg-white/80 rounded border border-black/10">
                                        {prodBadge}
                                    </span>
                                )}
                            </span>
                        );
                    }) : (
                        <span className="text-gray-400 text-xs italic">Tanpa Role</span>
                    )}
                </div>
            )
        },
        {
            header: 'TERDAFTAR',
            accessorKey: 'created_at',
            cell: ({ row }) => <span className="text-gray-600 text-xs">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
        },
        {
            header: 'AKSI',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 justify-end">
                    <button 
                        onClick={() => handleOpenModal(row.original)}
                        className="border border-blue-400 text-blue-600 hover:bg-blue-50 rounded px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="border border-rose-300 text-rose-600 hover:bg-rose-50 rounded px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                        Hapus
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Manajemen User & Staff</h2>
                    <p className="text-xs text-gray-500">Kelola akun staf, petugas teller, dan hak akses otorisasi</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
                >
                    <UserPlus size={16} />
                    <span>Tambah Staff</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={usersRes?.data?.data || []}
                isLoading={isLoading || isFetching}
                meta={usersRes?.data}
                onPageChange={setPage}
                onSearchChange={setSearch}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Edit Staff' : 'Tambah Staff Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Lengkap</label>
                        <div className="relative">
                            <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                required
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Masukkan nama lengkap..."
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="email"
                                required
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="nama@banksantri.id"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Password {selectedUser && '(Kosongkan jika tidak diubah)'}</label>
                        <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="password"
                                required={!selectedUser}
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Pilih Role / Hak Akses</label>
                        <div className="grid grid-cols-2 gap-2">
                            {roles.map((role) => (
                                <div 
                                    key={role.id}
                                    onClick={() => toggleRole(role.id)}
                                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors text-xs ${
                                        formData.role_ids.includes(role.id)
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                        formData.role_ids.includes(role.id)
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-gray-300'
                                    }`}>
                                        {formData.role_ids.includes(role.id) && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold uppercase text-xs">{role.name}</span>
                                            {role.product_id === 1 ? (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                                    Tibyan
                                                </span>
                                            ) : role.product_id === 2 ? (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                    Kubar
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
                        >
                            {selectedUser ? 'Simpan Perubahan' : 'Simpan User'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagementPage;
