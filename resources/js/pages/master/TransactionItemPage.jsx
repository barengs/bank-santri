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
                    <span className="font-black text-indigo-600">{row.original.item_name}</span>
                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[200px]">{row.original.description || '-'}</span>
                </div>
            )
        },
        {
            accessorKey: 'default_amount',
            header: 'Nominal Default',
            cell: ({ row }) => <span className="font-bold text-slate-700">{formatIDR(row.original.default_amount)}</span>
        },
        {
            accessorKey: 'coa_code',
            header: 'COA Tujuan',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-black text-slate-500 border border-slate-200">
                        {row.original.coa_code}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{row.original.coa?.account_name}</span>
                </div>
            )
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    row.original.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                    {row.original.is_active ? 'Aktif' : 'Non-Aktif'}
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button 
                        onClick={() => handleEdit(row.original)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                    >
                        <Trash2 className="w-4 h-4" />
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
            is_active: !!item.is_active
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Rincian Transaksi</h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Detail Biaya & Komponen Transaksi
                    </p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-md font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Rincian
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns}
                    data={itemsRes?.data?.data || []}
                    isLoading={isLoading}
                    placeholder="Cari rincian biaya..."
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 bg-indigo-600 text-white relative">
                            <h2 className="text-xl font-black tracking-tight">{editingItem ? 'Edit Rincian Biaya' : 'Tambah Rincian Baru'}</h2>
                            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Definisikan komponen biaya satuan.</p>
                            <div className="absolute top-6 right-8 opacity-20">
                                <DollarSign className="w-12 h-12" />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nama Rincian (Komponen)</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Misal: Biaya Buka Rekening"
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nominal Default</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                                        <input 
                                            required
                                            type="number"
                                            value={formData.default_amount}
                                            onChange={(e) => setFormData({...formData, default_amount: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-black focus:border-indigo-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status Aktif</label>
                                    <select 
                                        value={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                                    >
                                        <option value="true">AKTIF</option>
                                        <option value="false">NON-AKTIF</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipe Jurnal</label>
                                    <select 
                                        required
                                        value={formData.entry_type}
                                        onChange={(e) => setFormData({...formData, entry_type: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                                    >
                                        <option value="debit">DEBIT (Penambahan Saldo/Biaya)</option>
                                        <option value="credit">CREDIT (Pengurangan Saldo/Pendapatan)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tipe Nominal</label>
                                    <select 
                                        required
                                        value={formData.value_mode}
                                        onChange={(e) => setFormData({...formData, value_mode: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                                    >
                                        <option value="total">Total Transaksi (Sesuai Input)</option>
                                        <option value="fixed">Nominal Tetap (Sesuai Master)</option>
                                        <option value="remainder">Sisa (Sisa Bagi Hasil)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">COA Tujuan</label>
                                <select 
                                    required
                                    value={formData.coa_code}
                                    onChange={(e) => setFormData({...formData, coa_code: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                                >
                                    <option value="">Pilih COA...</option>
                                    {coaRes?.data?.map(acc => (
                                        <option key={acc.coa_code} value={acc.coa_code}>{acc.coa_code} - {acc.account_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center justify-between">
                                    <span>Rekening Instansi Tujuan (Opsional)</span>
                                    <span className="text-[9px] text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded">Auto-Settlement</span>
                                </label>
                                <select 
                                    value={formData.destination_account || ''}
                                    onChange={(e) => setFormData({...formData, destination_account: e.target.value})}
                                    className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-lg text-sm font-bold focus:border-indigo-600"
                                >
                                    <option value="">-- Tidak Menggunakan Rekening Instansi (Masuk ke COA Langsung) --</option>
                                    {instansiAccountsRes?.data?.data?.map(acc => (
                                        <option key={acc.account_number} value={acc.account_number}>
                                            {acc.customer_name} ({acc.account_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Keterangan Singkat</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold h-20 focus:border-indigo-600"
                                    placeholder="Penjelasan opsional..."
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 text-xs font-black text-slate-400 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                    <X className="w-4 h-4" />
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 rounded-lg font-black text-xs text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase tracking-widest"
                                >
                                    {isCreating || isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
