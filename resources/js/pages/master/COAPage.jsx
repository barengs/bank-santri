import React, { useState, useMemo } from 'react';
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

    const renderCoaRows = (items, depth = 0) => {
        if (!items) return null;
        
        return items.flatMap(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedRows.has(item.coa_code);
            
            const row = (
                <tr key={item.coa_code} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                            {hasChildren ? (
                                <button onClick={() => toggleRow(item.coa_code)} className="p-1 hover:bg-gray-200 rounded">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            ) : (
                                <div className="w-6" />
                            )}
                            {item.level !== 'DETAIL' ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-indigo-500" />}
                            <span className="font-mono text-xs font-black text-gray-400">{item.coa_code}</span>
                        </div>
                    </td>
                    <td className="px-6 py-3">
                        <span className={`text-sm ${item.level !== 'DETAIL' ? 'font-black text-gray-900' : 'font-medium text-gray-700'}`}>
                            {item.account_name}
                        </span>
                    </td>
                    <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest ${
                            getTypeColor(item.account_type)
                        }`}>
                            {item.account_type}
                        </span>
                    </td>
                    <td className="px-6 py-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {item.level}
                        </span>
                    </td>
                    <td className="px-6 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(item.coa_code)}
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                            >
                                <Trash2 className="w-4 h-4" />
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

    const getTypeColor = (type) => {
        switch(type.toUpperCase()) {
            case 'ASSET': return 'bg-blue-50 text-blue-600';
            case 'LIABILITY': return 'bg-rose-50 text-rose-600';
            case 'EQUITY': return 'bg-amber-50 text-amber-600';
            case 'REVENUE': return 'bg-emerald-50 text-emerald-600';
            case 'EXPENSE': return 'bg-purple-50 text-purple-600';
            default: return 'bg-gray-50 text-gray-600';
        }
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts (COA)</h1>
                    <p className="text-sm text-gray-500">Struktur akun akuntansi Bank Santri.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Akun
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Kode Akun</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Nama Akun</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tipe</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : (
                                renderCoaRows(coaTreeRes?.data || [])
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 bg-indigo-600 text-white relative">
                            <h2 className="text-xl font-bold">{editingCoa ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
                            <p className="text-indigo-100 text-xs mt-1">Konfigurasi akun dalam buku besar.</p>
                            <div className="absolute top-6 right-8 opacity-20">
                                <ListTree className="w-12 h-12" />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kode Akun</label>
                                    <input 
                                        required
                                        disabled={editingCoa}
                                        type="text"
                                        value={formData.coa_code}
                                        onChange={(e) => setFormData({...formData, coa_code: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</label>
                                    <select 
                                        value={formData.level}
                                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    >
                                        <option value="HEADER">HEADER</option>
                                        <option value="SUBHEADER">SUBHEADER</option>
                                        <option value="DETAIL">DETAIL</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Akun</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Akun</label>
                                    <select 
                                        value={formData.account_type}
                                        onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    >
                                        <option value="ASSET">ASSET</option>
                                        <option value="LIABILITY">LIABILITY</option>
                                        <option value="EQUITY">EQUITY</option>
                                        <option value="REVENUE">REVENUE</option>
                                        <option value="EXPENSE">EXPENSE</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Account</label>
                                    <select 
                                        value={formData.parent_coa_code}
                                        onChange={(e) => setFormData({...formData, parent_coa_code: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    >
                                        <option value="">(No Parent)</option>
                                        {headerAccountsRes?.data?.map(acc => (
                                            <option key={acc.coa_code} value={acc.coa_code}>{acc.coa_code} - {acc.account_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox"
                                    id="is_postable"
                                    checked={formData.is_postable}
                                    onChange={(e) => setFormData({...formData, is_postable: e.target.checked})}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="is_postable" className="text-sm font-bold text-gray-700">Dapat di-posting transaksi</label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
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
