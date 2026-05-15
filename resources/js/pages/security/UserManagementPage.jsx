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
import { UserPlus, Edit, Trash2, Shield, Mail, Lock, User as UserIcon, X } from 'lucide-react';

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
            toast.error(err.data?.message || 'Terjadi kesalahan');
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
        setFormData(prev => ({
            ...prev,
            role_ids: prev.role_ids.includes(roleId)
                ? prev.role_ids.filter(id => id !== roleId)
                : [...prev.role_ids, roleId]
        }));
    };

    const columns = [
        {
            header: 'NAMA LENGKAP',
            accessorKey: 'name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-800">{row.original.name}</div>
                        <div className="text-xs text-slate-500">{row.original.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'ROLE / AKSES',
            accessorKey: 'roles',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.roles?.length > 0 ? row.original.roles.map(role => (
                        <span key={role.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase border border-indigo-100">
                            {role.name}
                        </span>
                    )) : (
                        <span className="text-slate-400 text-xs italic">No Role</span>
                    )}
                </div>
            )
        },
        {
            header: 'TERDAFTAR',
            accessorKey: 'created_at',
            cell: ({ row }) => <span className="text-slate-600 text-sm">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
        },
        {
            header: 'AKSI',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleOpenModal(row.original)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>
                    <p className="text-slate-500">Kelola akun staff dan hak akses sistem.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-md font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                    <UserPlus size={20} />
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Masukkan nama lengkap..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="nama@banksantri.id"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Password {selectedUser && '(Kosongkan jika tidak diubah)'}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required={!selectedUser}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Pilih Role / Hak Akses</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map((role) => (
                                    <div 
                                        key={role.id}
                                        onClick={() => toggleRole(role.id)}
                                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                                            formData.role_ids.includes(role.id)
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                            formData.role_ids.includes(role.id)
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'bg-white border-slate-300'
                                        }`}>
                                            {formData.role_ids.includes(role.id) && <X size={14} className="text-white rotate-45" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold capitalize">{role.name}</span>
                                            <span className="text-[10px] opacity-70 uppercase tracking-wider">{role.slug}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-md font-semibold transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-all shadow-lg shadow-indigo-600/20"
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
