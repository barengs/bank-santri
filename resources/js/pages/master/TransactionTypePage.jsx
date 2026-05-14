import React, { useState, useMemo } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Settings2, 
    CheckCircle2, 
    XCircle, 
    Loader2,
    Save,
    X,
    ArrowRightLeft,
    PlusCircle,
    MinusCircle,
    DollarSign
} from 'lucide-react';
import { 
    useGetTransactionTypesQuery, 
    useCreateTransactionTypeMutation, 
    useUpdateTransactionTypeMutation, 
    useDeleteTransactionTypeMutation 
} from '../../store/transactionTypeApi';
import { useGetTransactionItemsQuery } from '../../store/transactionItemApi';
import { useGetDetailAccountsQuery } from '../../store/coaApi';
import DataTable from '../../components/DataTable';
import { toast } from 'react-toastify';

const TransactionTypePage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: 'cash_operation',
        rules: []
    });

    const { data: typesRes, isLoading } = useGetTransactionTypesQuery();
    const { data: detailAccountsRes } = useGetDetailAccountsQuery();
    const { data: itemsRes } = useGetTransactionItemsQuery();
    
    const transactionItems = useMemo(() => itemsRes?.data?.data || [], [itemsRes]);

    const [createType, { isLoading: isCreating }] = useCreateTransactionTypeMutation();
    const [updateType, { isLoading: isUpdating }] = useUpdateTransactionTypeMutation();
    const [deleteType] = useDeleteTransactionTypeMutation();

    const columns = useMemo(() => [
        {
            accessorKey: 'code',
            header: 'Kode',
            cell: ({ row }) => <span className="font-mono text-xs font-black text-gray-400">{row.original.code}</span>
        },
        {
            accessorKey: 'name',
            header: 'Nama Transaksi',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-indigo-600">{row.original.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.original.category}</span>
                </div>
            )
        },
        {
            accessorKey: 'rules',
            header: 'Aturan Jurnal',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    {row.original.rules?.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-[10px] font-bold">
                            <span className={`text-[10px] font-black uppercase ${rule.entry_type === 'debit' ? 'text-blue-600' : 'text-rose-600'}`}>
                                {rule.entry_type === 'debit' ? 'DR' : 'CR'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">{rule.transaction_item?.item_name || rule.coa_code}</span>
                            <span className="text-[9px] text-slate-400 font-medium lowercase">({rule.value_mode})</span>
                        </div>
                    ))}
                    {(!row.original.rules || row.original.rules.length === 0) && <span className="text-[10px] text-gray-300 italic">Belum ada aturan</span>}
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

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            code: type.code,
            name: type.name,
            category: type.category,
            rules: type.rules ? type.rules.map(r => ({
                coa_code: r.coa_code,
                entry_type: r.entry_type,
                value_mode: r.value_mode,
                fixed_amount: r.fixed_amount || 0,
                transaction_item_id: r.transaction_item_id || null
            })) : []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus tipe transaksi ini?')) {
            try {
                await deleteType(id).unwrap();
                toast.success('Tipe transaksi berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus tipe transaksi');
            }
        }
    };

    const addRule = () => {
        setFormData({
            ...formData,
            rules: [...formData.rules, { coa_code: '', entry_type: 'debit', value_mode: 'total', fixed_amount: 0 }]
        });
    };

    const removeRule = (idx) => {
        const newRules = [...formData.rules];
        newRules.splice(idx, 1);
        setFormData({ ...formData, rules: newRules });
    };

    const updateRule = (idx, field, value) => {
        const newRules = [...formData.rules];
        newRules[idx] = { ...newRules[idx], [field]: value };
        setFormData({ ...formData, rules: newRules });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await updateType({ id: editingType.id, ...formData }).unwrap();
                toast.success('Tipe transaksi berhasil diperbarui');
            } else {
                await createType(formData).unwrap();
                toast.success('Tipe transaksi berhasil ditambahkan');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan');
        }
    };

    const resetForm = () => {
        setEditingType(null);
        setFormData({
            code: '',
            name: '',
            category: 'cash_operation',
            rules: []
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jenis Transaksi</h1>
                    <p className="text-sm text-gray-500">Konfigurasi alur akuntansi untuk setiap jenis transaksi.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Jenis
                </button>
            </div>

            <DataTable 
                columns={columns}
                data={typesRes?.data?.data || []}
                isLoading={isLoading}
                placeholder="Cari jenis transaksi..."
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 bg-indigo-600 text-white relative">
                            <h2 className="text-xl font-bold">{editingType ? 'Edit Jenis Transaksi' : 'Tambah Jenis Baru'}</h2>
                            <p className="text-indigo-100 text-xs mt-1">Atur kode transaksi dan aturan penjurnalan otomatis.</p>
                            <div className="absolute top-6 right-8 opacity-20">
                                <ArrowRightLeft className="w-12 h-12" />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kode Transaksi</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Misal: DEP-CASH"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    >
                                        <option value="transfer">Transfer</option>
                                        <option value="payment">Pembayaran</option>
                                        <option value="cash_operation">Operasi Kas</option>
                                        <option value="fee">Biaya/Admin</option>
                                        <option value="topup">Top-up</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Transaksi</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Misal: Setoran Tunai"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                />
                            </div>

                            {/* Rules Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Konfigurasi Alur Jurnal</h3>
                                    <button 
                                        type="button"
                                        onClick={addRule}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Tambah Baris
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Kolom DEBIT (Sumber/Masuk) */}
                                    <div className="space-y-3">
                                        <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-md flex justify-between items-center">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">SUMBER / DEBIT (DARI MANA)</span>
                                        </div>
                                        {formData.rules.filter(r => r.entry_type === 'debit' || !r.transaction_item_id).map((rule) => {
                                            const originalIdx = formData.rules.indexOf(rule);
                                            return (
                                                <div key={originalIdx} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm space-y-3 relative group">
                                                    <select 
                                                        required
                                                        value={rule.transaction_item_id || ''}
                                                        onChange={(e) => {
                                                            const item = transactionItems?.find(i => i.id.toString() === e.target.value);
                                                            if (item) {
                                                                updateRule(originalIdx, 'transaction_item_id', item.id);
                                                                updateRule(originalIdx, 'coa_code', item.coa_code);
                                                                updateRule(originalIdx, 'entry_type', item.entry_type);
                                                                updateRule(originalIdx, 'value_mode', item.value_mode);
                                                                updateRule(originalIdx, 'fixed_amount', item.default_amount);
                                                            }
                                                        }}
                                                        className="w-full text-xs font-black text-slate-800 border-none p-0 focus:ring-0 bg-transparent"
                                                    >
                                                        <option value="">-- Pilih Sumber Dana --</option>
                                                        {transactionItems?.map(item => (
                                                            <option key={item.id} value={item.id}>{item.item_name}</option>
                                                        ))}
                                                    </select>
                                                    
                                                    {rule.transaction_item_id && (
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                                            <span className="text-[9px] font-mono font-bold text-slate-400">COA: {rule.coa_code}</span>
                                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Mode: {rule.value_mode}</span>
                                                        </div>
                                                    )}

                                                    <button 
                                                        type="button"
                                                        onClick={() => removeRule(originalIdx)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <MinusCircle className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Kolom KREDIT (Alokasi/Keluar) */}
                                    <div className="space-y-3">
                                        <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-md flex justify-between items-center">
                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">ALOKASI / KREDIT (KE MANA)</span>
                                        </div>
                                        {formData.rules.filter(r => r.entry_type === 'credit').map((rule) => {
                                            const originalIdx = formData.rules.indexOf(rule);
                                            return (
                                                <div key={originalIdx} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm space-y-3 relative group">
                                                    <select 
                                                        required
                                                        value={rule.transaction_item_id || ''}
                                                        onChange={(e) => {
                                                            const item = transactionItems?.find(i => i.id.toString() === e.target.value);
                                                            if (item) {
                                                                updateRule(originalIdx, 'transaction_item_id', item.id);
                                                                updateRule(originalIdx, 'coa_code', item.coa_code);
                                                                updateRule(originalIdx, 'entry_type', item.entry_type);
                                                                updateRule(originalIdx, 'value_mode', item.value_mode);
                                                                updateRule(originalIdx, 'fixed_amount', item.default_amount);
                                                            }
                                                        }}
                                                        className="w-full text-xs font-black text-slate-800 border-none p-0 focus:ring-0 bg-transparent"
                                                    >
                                                        <option value="">-- Pilih Alokasi Dana --</option>
                                                        {transactionItems?.map(item => (
                                                            <option key={item.id} value={item.id}>{item.item_name}</option>
                                                        ))}
                                                    </select>
                                                    
                                                    {rule.transaction_item_id && (
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                                            <span className="text-[9px] font-mono font-bold text-slate-400">COA: {rule.coa_code}</span>
                                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Mode: {rule.value_mode}</span>
                                                        </div>
                                                    )}

                                                    <button 
                                                        type="button"
                                                        onClick={() => removeRule(originalIdx)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <MinusCircle className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-all flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-md font-bold text-sm text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                                >
                                    {isCreating || isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Jenis
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionTypePage;
