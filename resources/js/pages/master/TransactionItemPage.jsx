import React, { useState, useMemo } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Loader2,
    Save,
    X,
    Hash,
    DollarSign,
    Layers,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';
import { 
    useGetTransactionItemsQuery, 
    useCreateTransactionItemMutation, 
    useUpdateTransactionItemMutation,
    useDeleteTransactionItemMutation 
} from '../../store/transactionItemApi';
import { useGetDetailAccountsQuery } from '../../store/coaApi';
import { useGetAccountsQuery } from '../../store/accountApi';
import DataTable from '../../components/DataTable';
import { toast } from 'react-toastify';

const TransactionItemPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        item_name: '',
        default_amount: 0,
        coa_code: '',
        destination_account: '',
        entry_type: 'credit',
        value_mode: 'fixed',
        description: '',
        is_active: true
    });

    const { data: itemsRes, isLoading } = useGetTransactionItemsQuery();
    const { data: coaRes } = useGetDetailAccountsQuery();
    const { data: instansiAccountsRes } = useGetAccountsQuery({ is_instansi: true, per_page: 100 });
    
    const [createItem, { isLoading: isCreating }] = useCreateTransactionItemMutation();
    const [updateItem, { isLoading: isUpdating }] = useUpdateTransactionItemMutation();
    const [deleteItem] = useDeleteTransactionItemMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'item_name',
            header: 'Nama Rincian Biaya',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{row.original.item_name}</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{row.original.description || '-'}</span>
                </div>
            )
        },
        {
            accessorKey: 'default_amount',
            header: 'Nominal Default',
            cell: ({ row }) => <span className="font-semibold text-gray-800">{formatIDR(row.original.default_amount)}</span>
        },
        {
            accessorKey: 'coa_code',
            header: 'COA Tujuan',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-600 border border-gray-200">
                        {row.original.coa_code}
                    </span>
                    <span className="text-[11px] text-gray-600 truncate max-w-[150px]">{row.original.coa?.account_name}</span>
                </div>
            )
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    row.original.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                    {row.original.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 justify-end">
                    <button 
                        onClick={() => handleEdit(row.original)}
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
    ], []);

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            item_name: item.item_name,
            default_amount: item.default_amount,
            coa_code: item.coa_code,
            destination_account: item.destination_account || '',
            entry_type: item.entry_type || 'credit',
            value_mode: item.value_mode || 'fixed',
            description: item.description || '',
            is_active: Boolean(item.is_active)
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus rincian biaya ini?')) {
            try {
                await deleteItem(id).unwrap();
                toast.success('Rincian biaya berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateItem({ id: editingItem.id, ...formData }).unwrap();
                toast.success('Rincian biaya berhasil diperbarui');
            } else {
                await createItem(formData).unwrap();
                toast.success('Rincian biaya berhasil ditambahkan');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan');
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            item_name: '',
            default_amount: 0,
            coa_code: '',
            destination_account: '',
            entry_type: 'credit',
            value_mode: 'fixed',
            description: '',
            is_active: true
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Master Rincian Transaksi</h2>
                    <p className="text-xs text-gray-500">Detail komponen biaya satuan dan pemetaan akun COA</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Rincian
                </button>
            </div>

            <DataTable 
                columns={columns}
                data={itemsRes?.data?.data || []}
                isLoading={isLoading}
                placeholder="Cari rincian biaya..."
            />

            {/* Flat Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800">{editingItem ? 'Edit Rincian Biaya' : 'Tambah Rincian Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Rincian (Komponen)</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Misal: Biaya Buka Rekening"
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Nominal Default</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                                        <input 
                                            required
                                            type="number"
                                            value={formData.default_amount}
                                            onChange={(e) => setFormData({...formData, default_amount: e.target.value})}
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Status Aktif</label>
                                    <select 
                                        value={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="true">AKTIF</option>
                                        <option value="false">NON-AKTIF</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Tipe Jurnal</label>
                                    <select 
                                        required
                                        value={formData.entry_type}
                                        onChange={(e) => setFormData({...formData, entry_type: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="debit">DEBIT (Penambahan Saldo/Biaya)</option>
                                        <option value="credit">CREDIT (Pengurangan Saldo/Pendapatan)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Tipe Nominal</label>
                                    <select 
                                        required
                                        value={formData.value_mode}
                                        onChange={(e) => setFormData({...formData, value_mode: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="total">Total Transaksi</option>
                                        <option value="fixed">Nominal Tetap</option>
                                        <option value="remainder">Sisa Bagi Hasil</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">COA Tujuan</label>
                                <select 
                                    required
                                    value={formData.coa_code}
                                    onChange={(e) => setFormData({...formData, coa_code: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                >
                                    <option value="">Pilih COA...</option>
                                    {coaRes?.data?.map(acc => (
                                        <option key={acc.coa_code} value={acc.coa_code}>{acc.coa_code} - {acc.account_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Rekening Instansi Tujuan (Opsional)</label>
                                <select 
                                    value={formData.destination_account || ''}
                                    onChange={(e) => setFormData({...formData, destination_account: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                >
                                    <option value="">-- Langsung ke COA (Tanpa Rekening Khusus) --</option>
                                    {instansiAccountsRes?.data?.data?.map(acc => (
                                        <option key={acc.account_number} value={acc.account_number}>
                                            {acc.customer_name} ({acc.account_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Keterangan Singkat</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none h-16"
                                    placeholder="Penjelasan opsional..."
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-md font-semibold text-xs text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isCreating || isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Simpan Rincian
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionItemPage;
