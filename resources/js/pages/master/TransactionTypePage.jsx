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
            cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-700">{row.original.code}</span>
        },
        {
            accessorKey: 'name',
            header: 'Nama Transaksi',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.original.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{row.original.category}</span>
                </div>
            )
        },
        {
            accessorKey: 'rules',
            header: 'Aturan Jurnal',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    {row.original.rules?.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-[11px]">
                            <span className={`font-bold ${rule.entry_type === 'debit' ? 'text-blue-600' : 'text-rose-600'}`}>
                                {rule.entry_type === 'debit' ? 'DR' : 'CR'}
                            </span>
                            <span className="text-gray-700">{rule.transaction_item?.item_name || rule.coa_code}</span>
                            <span className="text-[10px] text-gray-400 lowercase">({rule.value_mode})</span>
                        </div>
                    ))}
                    {(!row.original.rules || row.original.rules.length === 0) && <span className="text-[11px] text-gray-400 italic">Belum ada aturan</span>}
                </div>
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
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Jenis Transaksi</h2>
                    <p className="text-xs text-gray-500">Konfigurasi alur pembukuan jurnal otomatis untuk setiap tipe transaksi</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Jenis
                </button>
            </div>

            <DataTable 
                columns={columns}
                data={typesRes?.data?.data || []}
                isLoading={isLoading}
                placeholder="Cari jenis transaksi..."
            />

            {/* Flat Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800">{editingType ? 'Edit Jenis Transaksi' : 'Tambah Jenis Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Kode Transaksi</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Misal: DEP-CASH"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Kategori</label>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
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
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Transaksi</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Misal: Setoran Tunai"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Rules Section */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase">Konfigurasi Alur Jurnal</h4>
                                    <button 
                                        type="button"
                                        onClick={addRule}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Tambah Baris
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Kolom DEBIT */}
                                    <div className="space-y-2">
                                        <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-700 uppercase">
                                            SUMBER / DEBIT (DARI MANA)
                                        </div>
                                        {formData.rules.filter(r => r.entry_type === 'debit' || !r.transaction_item_id).map((rule) => {
                                            const originalIdx = formData.rules.indexOf(rule);
                                            return (
                                                <div key={originalIdx} className="p-2.5 bg-gray-50 border border-gray-200 rounded space-y-1.5 relative group">
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
                                                        className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 outline-none"
                                                    >
                                                        <option value="">-- Pilih Sumber Dana --</option>
                                                        {transactionItems?.map(item => (
                                                            <option key={item.id} value={item.id}>{item.item_name}</option>
                                                        ))}
                                                    </select>
                                                    
                                                    {rule.transaction_item_id && (
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                                                            <span className="font-mono">COA: {rule.coa_code}</span>
                                                            <span className="font-semibold text-blue-600">Mode: {rule.value_mode}</span>
                                                        </div>
                                                    )}

                                                    <button 
                                                        type="button"
                                                        onClick={() => removeRule(originalIdx)}
                                                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 rounded-full shadow-sm"
                                                    >
                                                        <MinusCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Kolom KREDIT */}
                                    <div className="space-y-2">
                                        <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded text-[10px] font-bold text-rose-700 uppercase">
                                            ALOKASI / KREDIT (KE MANA)
                                        </div>
                                        {formData.rules.filter(r => r.entry_type === 'credit').map((rule) => {
                                            const originalIdx = formData.rules.indexOf(rule);
                                            return (
                                                <div key={originalIdx} className="p-2.5 bg-gray-50 border border-gray-200 rounded space-y-1.5 relative group">
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
                                                        className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 outline-none"
                                                    >
                                                        <option value="">-- Pilih Alokasi Dana --</option>
                                                        {transactionItems?.map(item => (
                                                            <option key={item.id} value={item.id}>{item.item_name}</option>
                                                        ))}
                                                    </select>
                                                    
                                                    {rule.transaction_item_id && (
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                                                            <span className="font-mono">COA: {rule.coa_code}</span>
                                                            <span className="font-semibold text-rose-600">Mode: {rule.value_mode}</span>
                                                        </div>
                                                    )}

                                                    <button 
                                                        type="button"
                                                        onClick={() => removeRule(originalIdx)}
                                                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 rounded-full shadow-sm"
                                                    >
                                                        <MinusCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
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
