import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, MoreHorizontal, AlertCircle, Edit2, Trash2, Eye, User, ShieldCheck, UserPlus, Loader2, CreditCard, Check, X, Printer } from 'lucide-react';
import { 
    useGetAccountsQuery, 
    useCreateAccountMutation, 
    useCreateInstansiAccountMutation,
    useUpdateAccountMutation,
    useLazySearchSmptStudentsQuery 
} from '../store/accountApi';
import { useGetProductsQuery } from '../store/productApi';
import DataTable from '../components/DataTable';
import RekeningKoranModal from '../components/RekeningKoranModal';
import { toast } from 'react-toastify';

const NasabahPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('santri');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal State
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedAkad, setSelectedAkad] = useState('wadiah');
    const [cardNumber, setCardNumber] = useState('');

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editCardNumber, setEditCardNumber] = useState('');
    const [editDailyLimit, setEditDailyLimit] = useState('');

    // Close Account State
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closingAccount, setClosingAccount] = useState(null);

    // Rekening Koran State
    const [koranAccount, setKoranAccount] = useState(null);

    // Product & Status filter state
    const [productFilter, setProductFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // API Hooks
    const { data: accountsRes, isLoading, isFetching } = useGetAccountsQuery({
        page,
        search,
        per_page: 10,
        is_instansi: activeTab === 'instansi' ? '1' : '0',
        product_id: productFilter || undefined,
        status: statusFilter || undefined
    });
    const [triggerSearch, { data: studentResults, isFetching: isSearchingStudents }] = useLazySearchSmptStudentsQuery();
    const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
    const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
    const { data: productsRes } = useGetProductsQuery();

    const products = productsRes?.data || [];

    // Set default product when products are loaded
    React.useEffect(() => {
        if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0].id.toString());
        }
    }, [products]);

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
                    <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
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
            accessorKey: 'product.product_name',
            header: 'Produk & Limit',
            cell: ({ row }) => {
                const customLimit = row.original.daily_withdrawal_limit;
                const productLimit = row.original.product?.daily_withdrawal_limit;
                const effectiveLimit = customLimit ?? productLimit ?? 0;
                const isCustom = customLimit !== null && customLimit !== undefined && customLimit !== '';

                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{row.original.product?.product_name || row.original.product?.name || '-'}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-gray-500">
                                Limit: <strong className={isCustom ? "text-amber-600 font-bold" : "text-gray-600"}>
                                    {effectiveLimit > 0 ? formatIDR(effectiveLimit) : 'Bebas'}
                                </strong>
                            </span>
                            {isCustom && (
                                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded font-semibold leading-none">
                                    Khusus
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'card_number',
            header: 'Nomor Kartu',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <CreditCard className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-mono font-bold text-gray-600">
                        {row.original.card_number || <span className="text-gray-300 italic font-normal">Belum ada</span>}
                    </span>
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
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/nasabah/${row.original.account_number}`);
                        }}
                        className="px-2 py-0.5 border border-blue-400 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-3 h-3" />
                        Detail
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccount(row.original);
                            setEditCardNumber(row.original.card_number || '');
                            setEditDailyLimit(row.original.daily_withdrawal_limit !== null && row.original.daily_withdrawal_limit !== undefined ? row.original.daily_withdrawal_limit : '');
                            setIsEditModalOpen(true);
                        }}
                        className="px-2 py-0.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Pengaturan Kartu & Limit Rekening"
                    >
                        <CreditCard className="w-3 h-3 text-gray-500" />
                        Edit
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setKoranAccount(row.original);
                        }}
                        className="px-2 py-0.5 border border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Cetak Rekening Koran"
                    >
                        <Printer className="w-3 h-3" />
                        Koran
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setClosingAccount(row.original);
                            setIsCloseModalOpen(true);
                        }}
                        className="px-2 py-0.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Tutup Rekening"
                    >
                        <Trash2 className="w-3 h-3" />
                        Tutup
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
                akad_type: selectedAkad,
                card_number: cardNumber
            }).unwrap();
            
            setIsModalOpen(false);
            setSelectedStudent(null);
            setStudentSearch('');
            setCardNumber('');
            toast.success('Rekening berhasil dibuka!');
        } catch (err) {
            const firstError = err.data?.message || err.data?.errors?.account_number?.[0] || 'Terjadi kesalahan pada server';
            toast.error(`Gagal membuka rekening: ${firstError}`);
        }
    };

    const handleUpdateCard = async () => {
        if (!editingAccount) return;
        
        try {
            await updateAccount({
                accountNumber: editingAccount.account_number,
                card_number: editCardNumber,
                daily_withdrawal_limit: editDailyLimit === '' ? null : Number(editDailyLimit)
            }).unwrap();
            
            setIsEditModalOpen(false);
            setEditingAccount(null);
            toast.success('Nomor kartu berhasil diperbarui!');
        } catch (err) {
            toast.error('Gagal memperbarui kartu: ' + (err.data?.message || 'Terjadi kesalahan'));
        }
    };

    const handleCloseAccount = async () => {
        if (!closingAccount) return;
        
        try {
            await updateAccount({
                accountNumber: closingAccount.account_number,
                status: 'TUTUP'
            }).unwrap();
            
            setIsCloseModalOpen(false);
            setClosingAccount(null);
            toast.success('Rekening berhasil ditutup!');
        } catch (err) {
            toast.error('Gagal menutup rekening: ' + (err.data?.message || 'Terjadi kesalahan'));
        }
    };

    // Modal Instansi State
    const [isInstansiModalOpen, setIsInstansiModalOpen] = useState(false);
    const [instansiData, setInstansiData] = useState({
        account_number: '',
        customer_name: '',
        product_id: '',
        akad_type: 'wadiah'
    });

    const [createInstansiAccount, { isLoading: isCreatingInstansi }] = useCreateInstansiAccountMutation();

    const handleCreateInstansi = async () => {
        try {
            await createInstansiAccount({
                ...instansiData,
                product_id: instansiData.product_id || selectedProduct
            }).unwrap();
            
            setIsInstansiModalOpen(false);
            setInstansiData({ account_number: '', customer_name: '', product_id: '', akad_type: 'wadiah' });
            toast.success('Rekening Instansi berhasil dibuka!');
        } catch (err) {
            toast.error('Gagal membuka rekening: ' + (err.data?.message || 'Terjadi kesalahan'));
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Card Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-100">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Informasi Rekening Santri</h1>
                    <p className="text-xs text-gray-500">Kelola rekening tabungan santri dan rekening instansi pesantren.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsInstansiModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium text-xs transition-colors"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Buka Rekening Instansi
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#007bff] hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition-colors shadow-none"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Buka Rekening Santri
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('santri'); setPage(1); setSearch(''); setProductFilter(''); setStatusFilter(''); }}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'santri'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <User className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Rekening Santri
                </button>
                <button
                    onClick={() => { setActiveTab('instansi'); setPage(1); setSearch(''); setProductFilter(''); setStatusFilter(''); }}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'instansi'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <ShieldCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Rekening Instansi
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
                onRowClick={(row) => navigate(`/nasabah/${row.account_number}`)}
                placeholder="Cari nama santri atau nomor rekening..."
                extraFilters={(
                    <div className="flex items-center gap-2">
                        <select
                            id="product-filter"
                            value={productFilter}
                            onChange={(e) => {
                                setProductFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-44 px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-gray-700 cursor-pointer"
                        >
                            <option value="">Semua Produk Bank</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.product_name}</option>
                            ))}
                        </select>

                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-32 px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-gray-700 cursor-pointer"
                        >
                            <option value="">Semua Status</option>
                            <option value="AKTIF">Aktif</option>
                            <option value="TIDAK AKTIF">Tidak Aktif</option>
                            <option value="TERBLOKIR">Terblokir</option>
                            <option value="TUTUP">Tutup</option>
                        </select>
                    </div>
                )}
            />

            {/* Buka Rekening Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isCreating && setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        {/* Modal Header */}
                        <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold">Buka Rekening Santri</h2>
                                <p className="text-blue-100 text-[11px]">Cari santri dari portal SMPT untuk membuat rekening baru</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-blue-100 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* Step 1: Search Student */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Cari Santri (NIS / Nama)</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Ketik minimal 3 karakter..."
                                        value={studentSearch}
                                        onChange={handleStudentSearch}
                                        className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs"
                                    />
                                    {isSearchingStudents && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-blue-600" />
                                    )}
                                </div>

                                {/* Results List */}
                                {studentSearch.length > 2 && studentResults?.data?.data && !selectedStudent && (
                                    <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100 bg-white">
                                        {studentResults.data.data.map((student) => (
                                            <button 
                                                key={student.id}
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setStudentSearch(`${student.nis} - ${student.first_name}`);
                                                }}
                                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-blue-50 transition-all text-left group"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800 group-hover:text-blue-600">{student.first_name} {student.last_name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">NIS: {student.nis}</p>
                                                </div>
                                                {student.has_account ? (
                                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                                        Rekening Aktif
                                                    </span>
                                                ) : (
                                                    <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Student Card */}
                                {selectedStudent && (
                                    <div className={`p-2.5 border rounded-md flex items-center justify-between ${
                                        selectedStudent.has_account 
                                            ? 'bg-amber-50 border-amber-300' 
                                            : 'bg-blue-50 border-blue-200'
                                    }`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                                                selectedStudent.has_account ? 'bg-amber-600' : 'bg-blue-600'
                                            }`}>
                                                {selectedStudent.first_name[0]}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${selectedStudent.has_account ? 'text-amber-900' : 'text-blue-900'}`}>
                                                    {selectedStudent.first_name} {selectedStudent.last_name}
                                                </p>
                                                <p className={`text-[10px] font-mono font-medium ${selectedStudent.has_account ? 'text-amber-600' : 'text-blue-600'}`}>
                                                    NIS: {selectedStudent.nis}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                                            className="text-[10px] font-medium text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                )}

                                {/* Warning if student already has account */}
                                {selectedStudent?.has_account && (
                                    <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-100 border border-amber-300 rounded-md p-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                        <span>
                                            Santri ini sudah memiliki rekening aktif (Status: {selectedStudent.account_status || 'AKTIF'}). 
                                            Proses pembukaan rekening akan gagal karena NIS sudah terdaftar di sistem Bank Santri.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Produk Tabungan</label>
                                    <select 
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="" disabled>Pilih Produk</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.product_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Jenis Akad</label>
                                    <select 
                                        value={selectedAkad}
                                        onChange={(e) => setSelectedAkad(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="wadiah">Wadiah (Titipan)</option>
                                        <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                >
                                    Tutup
                                </button>
                                <button 
                                    onClick={handleCreateAccount}
                                    disabled={!selectedStudent || selectedStudent?.has_account || isCreating}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs text-white transition-all ${
                                        selectedStudent && !selectedStudent?.has_account && !isCreating
                                            ? 'bg-blue-600 hover:bg-blue-700' 
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                    {selectedStudent?.has_account ? 'Sudah Punya Rekening' : 'Konfirmasi & Buka'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Account Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isUpdating && setIsEditModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-sm bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Pengaturan Rekening & Limit</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Nasabah</p>
                                <p className="text-xs font-bold text-slate-800">{editingAccount?.customer_name}</p>
                                <p className="text-[10px] text-blue-600 font-mono">{editingAccount?.account_number}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Nomor Kartu Baru</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Masukkan nomor kartu..."
                                        value={editCardNumber}
                                        onChange={(e) => setEditCardNumber(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs font-mono"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Limit Harian (Opsional)
                                    <span className="text-[10px] text-gray-400 font-normal ml-1">
                                        (Kosongkan = ikut limit produk: {editingAccount?.product?.daily_withdrawal_limit ? formatIDR(editingAccount.product.daily_withdrawal_limit) : 'Bebas'})
                                    </span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">Rp</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={editDailyLimit}
                                        onChange={(e) => setEditDailyLimit(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button onClick={() => setIsEditModalOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all">Batal</button>
                                <button 
                                    onClick={handleUpdateCard}
                                    disabled={isUpdating}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Buka Rekening Instansi Modal */}
            {isInstansiModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isCreatingInstansi && setIsInstansiModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="px-4 py-3 bg-[#182234] text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold">Buka Rekening Instansi</h2>
                                <p className="text-slate-300 text-[11px]">Buat rekening penampungan untuk instansi (MI, MTs, SMA, dll)</p>
                            </div>
                            <button onClick={() => setIsInstansiModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Nama Instansi</label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: Instansi SMA Plus"
                                    value={instansiData.customer_name}
                                    onChange={(e) => setInstansiData({...instansiData, customer_name: e.target.value})}
                                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Produk Tabungan</label>
                                    <select 
                                        value={instansiData.product_id}
                                        onChange={(e) => setInstansiData({...instansiData, product_id: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="" disabled>Pilih Produk</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.product_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Jenis Akad</label>
                                    <select 
                                        value={instansiData.akad_type}
                                        onChange={(e) => setInstansiData({...instansiData, akad_type: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="wadiah">Wadiah (Titipan)</option>
                                        <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsInstansiModalOpen(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleCreateInstansi}
                                    disabled={!instansiData.customer_name || isCreatingInstansi}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs text-white transition-all ${
                                        instansiData.customer_name && !isCreatingInstansi 
                                            ? 'bg-blue-600 hover:bg-blue-700' 
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {isCreatingInstansi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                    Konfirmasi & Buka
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tutup Rekening Modal */}
            {isCloseModalOpen && closingAccount && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isUpdating && setIsCloseModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-md bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        {/* Modal Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-2 text-rose-600">
                                <AlertCircle className="w-4 h-4" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Tutup Rekening</h2>
                            </div>
                            <button onClick={() => setIsCloseModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-3">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-0.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nasabah</p>
                                <p className="text-sm font-bold text-slate-800 leading-tight">{closingAccount.customer_name}</p>
                                <p className="text-xs text-blue-600 font-mono font-medium">{closingAccount.account_number}</p>
                            </div>

                            {Number(closingAccount.balance) > 0 ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-rose-800">Saldo Aktif Terdeteksi</p>
                                            <p className="text-xs text-rose-700 leading-relaxed">
                                                Rekening ini masih memiliki sisa saldo sebesar <strong className="font-bold">{formatIDR(closingAccount.balance)}</strong>. 
                                                Silakan lakukan penarikan tunai terlebih dahulu hingga saldo menjadi <strong>Rp 0</strong> sebelum menutup rekening ini.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsCloseModalOpen(false)}
                                        className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-md font-medium text-xs transition-all"
                                    >
                                        Mengerti
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-amber-800">Konfirmasi Penutupan</p>
                                            <p className="text-xs text-amber-700 leading-relaxed">
                                                Apakah Anda yakin ingin menutup rekening ini? Tindakan ini <strong>tidak dapat dibatalkan</strong>. Rekening yang telah ditutup tidak dapat digunakan kembali untuk bertransaksi.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsCloseModalOpen(false)}
                                            className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-md font-medium text-xs transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleCloseAccount}
                                            disabled={isUpdating}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium text-xs transition-all disabled:opacity-50"
                                        >
                                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            Ya, Tutup Rekening
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Rekening Koran Modal */}
            <RekeningKoranModal 
                isOpen={Boolean(koranAccount)}
                onClose={() => setKoranAccount(null)}
                accountNumber={koranAccount?.account_number}
                customerName={koranAccount?.customer_name}
            />
        </div>
    );
};

export default NasabahPage;
