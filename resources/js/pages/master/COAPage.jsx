import React, { useState } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    ListTree, 
    ChevronRight, 
    ChevronDown, 
    Loader2,
    Save,
    X,
    FolderOpen,
    FileText
} from 'lucide-react';
import { 
    useGetCoaTreeQuery, 
    useGetHeaderAccountsQuery,
    useCreateCoaMutation, 
    useUpdateCoaMutation, 
    useDeleteCoaMutation 
} from '../../store/coaApi';
import { toast } from 'react-toastify';

const COAPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoa, setEditingCoa] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    
    const [formData, setFormData] = useState({
        coa_code: '',
        account_name: '',
        account_type: 'ASSET',
        parent_coa_code: '',
        level: 'DETAIL',
        is_postable: true
    });

    const { data: coaTreeRes, isLoading } = useGetCoaTreeQuery();
    const { data: headerAccountsRes } = useGetHeaderAccountsQuery();
    
    const [createCoa, { isLoading: isCreating }] = useCreateCoaMutation();
    const [updateCoa, { isLoading: isUpdating }] = useUpdateCoaMutation();
    const [deleteCoa] = useDeleteCoaMutation();

    const toggleRow = (code) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(code)) newSet.delete(code);
        else newSet.add(code);
        setExpandedRows(newSet);
    };

    const getTypeColor = (type) => {
        switch(type.toUpperCase()) {
            case 'ASSET': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'LIABILITY': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'EQUITY': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'REVENUE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'EXPENSE': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const renderCoaRows = (items, depth = 0) => {
        if (!items) return null;
        
        return items.flatMap(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedRows.has(item.coa_code);
            
            const row = (
                <tr key={item.coa_code} className="hover:bg-slate-50 transition-colors text-xs text-gray-800">
                    <td className="px-3.5 py-2">
                        <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
                            {hasChildren ? (
                                <button onClick={() => toggleRow(item.coa_code)} className="p-0.5 hover:bg-gray-200 rounded text-gray-500">
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                            ) : (
                                <div className="w-4" />
                            )}
                            {item.level !== 'DETAIL' ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> : <FileText className="w-3.5 h-3.5 text-blue-500" />}
                            <span className="font-mono font-semibold text-gray-600">{item.coa_code}</span>
                        </div>
                    </td>
                    <td className="px-3.5 py-2">
                        <span className={item.level !== 'DETAIL' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}>
                            {item.account_name}
                        </span>
                    </td>
                    <td className="px-3.5 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getTypeColor(item.account_type)}`}>
                            {item.account_type}
                        </span>
                    </td>
                    <td className="px-3.5 py-2">
                        <span className="text-[10px] font-medium text-gray-500 uppercase">
                            {item.level}
                        </span>
                    </td>
                    <td className="px-3.5 py-2 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="border border-blue-400 text-blue-600 hover:bg-blue-50 rounded px-2 py-0.5 text-xs font-medium transition-colors"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(item.coa_code)}
                                className="border border-rose-300 text-rose-600 hover:bg-rose-50 rounded px-2 py-0.5 text-xs font-medium transition-colors"
                            >
                                Hapus
                            </button>
                        </div>
                    </td>
                </tr>
            );

            if (isExpanded && hasChildren) {
                return [row, ...renderCoaRows(item.children, depth + 1)];
            }
            
            return [row];
        });
    };

    const handleEdit = (coa) => {
        setEditingCoa(coa);
        setFormData({
            coa_code: coa.coa_code,
            account_name: coa.account_name,
            account_type: coa.account_type,
            parent_coa_code: coa.parent_coa_code || '',
            level: coa.level,
            is_postable: coa.is_postable
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (code) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus COA ini?')) {
            try {
                await deleteCoa(code).unwrap();
                toast.success('COA berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus COA');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCoa) {
                await updateCoa({ coa_code: editingCoa.coa_code, ...formData }).unwrap();
                toast.success('COA berhasil diperbarui');
            } else {
                await createCoa(formData).unwrap();
                toast.success('COA berhasil ditambahkan');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan');
        }
    };

    const resetForm = () => {
        setEditingCoa(null);
        setFormData({
            coa_code: '',
            account_name: '',
            account_type: 'ASSET',
            parent_coa_code: '',
            level: 'DETAIL',
            is_postable: true
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Chart of Accounts (COA)</h2>
                    <p className="text-xs text-gray-500">Struktur bagan akun akuntansi perbankan syariah santri</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Akun
                </button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            <tr className="text-xs font-semibold text-gray-700">
                                <th className="px-3.5 py-2.5">Kode Akun</th>
                                <th className="px-3.5 py-2.5">Nama Akun</th>
                                <th className="px-3.5 py-2.5">Tipe</th>
                                <th className="px-3.5 py-2.5">Level</th>
                                <th className="px-3.5 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-3.5 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                                        <p className="text-xs text-gray-400 mt-1">Memuat daftar COA...</p>
                                    </td>
                                </tr>
                            ) : (
                                renderCoaRows(coaTreeRes?.data || [])
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Flat Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800">{editingCoa ? 'Edit Akun COA' : 'Tambah Akun Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Kode Akun</label>
                                    <input 
                                        required
                                        disabled={Boolean(editingCoa)}
                                        type="text"
                                        value={formData.coa_code}
                                        onChange={(e) => setFormData({...formData, coa_code: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Level</label>
                                    <select 
                                        value={formData.level}
                                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="HEADER">HEADER</option>
                                        <option value="SUBHEADER">SUBHEADER</option>
                                        <option value="DETAIL">DETAIL</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Akun</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Tipe Akun</label>
                                    <select 
                                        value={formData.account_type}
                                        onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="ASSET">ASSET</option>
                                        <option value="LIABILITY">LIABILITY</option>
                                        <option value="EQUITY">EQUITY</option>
                                        <option value="REVENUE">REVENUE</option>
                                        <option value="EXPENSE">EXPENSE</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Parent Account</label>
                                    <select 
                                        value={formData.parent_coa_code}
                                        onChange={(e) => setFormData({...formData, parent_coa_code: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="">(Tanpa Parent / Tingkat 1)</option>
                                        {headerAccountsRes?.data?.map(acc => (
                                            <option key={acc.coa_code} value={acc.coa_code}>{acc.coa_code} - {acc.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-1">
                                <input 
                                    type="checkbox" 
                                    id="is_postable"
                                    checked={formData.is_postable}
                                    onChange={(e) => setFormData({...formData, is_postable: e.target.checked})}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_postable" className="text-xs text-gray-700 font-medium">Dapat di-posting transaksi langsung</label>
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
                                    Simpan Akun
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default COAPage;
