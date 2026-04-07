import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    UserPlus, 
    Loader2, 
    ChevronRight, 
    Filter,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { 
    useGetAccountsQuery, 
    useCreateAccountMutation, 
    useLazySearchSmptStudentsQuery 
} from '../store/accountApi';

const NasabahPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal State
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('1'); // Default to first product
    const [selectedAkad, setSelectedAkad] = useState('wadiah');

    // API Hooks
    const { data: accountsRes, isLoading: isLoadingAccounts } = useGetAccountsQuery({ search: searchTerm });
    const [triggerSearch, { data: studentResults, isFetching: isSearchingStudents }] = useLazySearchSmptStudentsQuery();
    const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleStudentSearch = (e) => {
        const val = e.target.value;
        setStudentSearch(val);
        if (val.length > 2) {
            triggerSearch(val);
        }
    };

    const handleCreateAccount = async () => {
        if (!selectedStudent) return;
        
        try {
            await createAccount({
                account_number: selectedStudent.nis, // NIS as account number
                customer_id: selectedStudent.id,
                customer_name: `${selectedStudent.first_name} ${selectedStudent.last_name || ''}`,
                product_id: selectedProduct,
                akad_type: selectedAkad
            }).unwrap();
            
            setIsModalOpen(false);
            setSelectedStudent(null);
            setStudentSearch('');
            alert('Rekening berhasil dibuka!');
        } catch (err) {
            alert('Gagal membuka rekening: ' + (err.data?.message || 'Terjadi kesalahan'));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Nasabah</h1>
                    <p className="text-sm text-gray-500">Kelola dan buka rekening tabungan santri.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    Buka Rekening Baru
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Cari nomor rekening atau nama nasabah..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Account Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Nasabah</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">No. Rekening</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Produk</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Saldo</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoadingAccounts ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Data...</span>
                                    </td>
                                </tr>
                            ) : accountsRes?.data?.data?.length > 0 ? (
                                accountsRes.data.data.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {account.customer_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{account.customer_name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Santri</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                                {account.account_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">{account.product?.name || 'Tabungan'}</span>
                                                <span className="text-[10px] text-gray-400 capitalize">{account.akad_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-gray-900">{formatIDR(account.balance)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                                                account.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                {account.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-bold">Data tidak ditemukan</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Placeholder */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Showing {accountsRes?.data?.data?.length || 0} of {accountsRes?.data?.total || 0} Nasabah
                    </p>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1 text-xs font-bold text-gray-400 bg-white border border-gray-200 rounded-lg opacity-50">Prev</button>
                        <button disabled className="px-3 py-1 text-xs font-bold text-gray-400 bg-white border border-gray-200 rounded-lg opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Buka Rekening Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isCreating && setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="px-8 py-6 bg-indigo-600 text-white relative">
                            <h2 className="text-xl font-bold">Buka Rekening Santri</h2>
                            <p className="text-indigo-100 text-xs mt-1">Cari santri dari portal SMPT untuk membuat rekening baru.</p>
                            <div className="absolute top-6 right-8 opacity-20">
                                <ShieldCheck className="w-12 h-12" />
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Step 1: Search Student */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Cari Santri (NIS / Nama)</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Ketik minimal 3 karakter..."
                                        value={studentSearch}
                                        onChange={handleStudentSearch}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
                                    />
                                    {isSearchingStudents && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />
                                    )}
                                </div>

                                {/* Results List */}
                                {studentSearch.length > 2 && studentResults?.data?.data && !selectedStudent && (
                                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-inner bg-gray-50/50">
                                        {studentResults.data.data.map((student) => (
                                            <button 
                                                key={student.id}
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setStudentSearch(`${student.nis} - ${student.first_name}`);
                                                }}
                                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white transition-all text-left group"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">{student.first_name} {student.last_name}</p>
                                                    <p className="text-[10px] text-gray-500">NIS: {student.nis}</p>
                                                </div>
                                                <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Student Card */}
                                {selectedStudent && (
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                                                {selectedStudent.first_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-indigo-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{selectedStudent.nis}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                                            className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Produk Tabungan</label>
                                    <select 
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                                    >
                                        <option value="1">Simpanan Wajib</option>
                                        <option value="2">Simpanan Sukarela</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Jenis Akad</label>
                                    <select 
                                        value={selectedAkad}
                                        onChange={(e) => setSelectedAkad(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                                    >
                                        <option value="wadiah">Wadiah (Titipan)</option>
                                        <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Tutup
                                </button>
                                <button 
                                    onClick={handleCreateAccount}
                                    disabled={!selectedStudent || isCreating}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
                                        selectedStudent && !isCreating 
                                            ? 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700' 
                                            : 'bg-gray-300 shadow-none cursor-not-allowed'
                                    }`}
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Konfirmasi & Buka
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NasabahPage;
