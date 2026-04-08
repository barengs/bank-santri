import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Download, MoreHorizontal, AlertCircle, Edit2, Trash2, Eye, User, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { 
    useGetAccountsQuery, 
    useCreateAccountMutation, 
    useLazySearchSmptStudentsQuery 
} from '../store/accountApi';
import DataTable from '../components/DataTable';

const NasabahPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal State
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('1');
    const [selectedAkad, setSelectedAkad] = useState('wadiah');

    // API Hooks
    const { data: accountsRes, isLoading, isFetching } = useGetAccountsQuery({
        page,
        search,
        per_page: 10
    });
    const [triggerSearch, { data: studentResults, isFetching: isSearchingStudents }] = useLazySearchSmptStudentsQuery();
    const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'customer_name',
            header: 'Nama Santri',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                        {row.original.customer_name[0]}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 leading-tight">{row.original.customer_name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.original.account_number}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'product.name',
            header: 'Produk',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700">{row.original.product?.name || '-'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{row.original.akad_type}</span>
                </div>
            )
        },
        {
            accessorKey: 'balance',
            header: 'Saldo',
            cell: ({ row }) => (
                <span className="font-black text-indigo-600">
                    {formatIDR(row.original.balance)}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    row.original.status === 'AKTIF' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                    {row.original.status}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], []);

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
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    Buka Rekening Baru
                </button>
            </div>

            {/* Table Area */}
            <DataTable 
                columns={columns}
                data={accountsRes?.data?.data || []}
                isLoading={isLoading}
                meta={accountsRes?.data}
                onPageChange={setPage}
                onSearchChange={setSearch}
                placeholder="Cari nama santri atau nomor rekening..."
            />

            {/* Buka Rekening Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isCreating && setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
                                    />
                                    {isSearchingStudents && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />
                                    )}
                                </div>

                                {/* Results List */}
                                {studentSearch.length > 2 && studentResults?.data?.data && !selectedStudent && (
                                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50 shadow-inner bg-gray-50/50">
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
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
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
                                            className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md"
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
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-600"
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
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-600"
                                    >
                                        <option value="wadiah">Wadiah (Titipan)</option>
                                        <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-all"
                                >
                                    Tutup
                                </button>
                                <button 
                                    onClick={handleCreateAccount}
                                    disabled={!selectedStudent || isCreating}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-sm text-white shadow-lg transition-all ${
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
