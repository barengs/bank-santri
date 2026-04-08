import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Download, 
    Printer, 
    Loader2, 
    ArrowUpRight, 
    ArrowDownLeft,
    FileText,
    Calendar,
    Filter,
    Info
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../store/accountApi';
import { useGetAccountTransactionsQuery } from '../store/transactionApi';
import DataTable from '../components/DataTable';

const MutasiPage = () => {
    const [accountNumber, setAccountNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    // API Hooks
    const [fetchAccount, { data: accountRes, isFetching: isFetchingAccount }] = useLazyGetAccountDetailQuery();
    const { data: transRes, isFetching: isFetchingTrans } = useGetAccountTransactionsQuery({
        accountNumber,
        page,
        per_page: 10
    }, {
        skip: !accountNumber
    });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.length >= 4) {
            setAccountNumber(searchQuery);
            fetchAccount(searchQuery);
        }
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'created_at',
            header: 'Waktu',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-900">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {new Date(row.original.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })} WIB
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'Keterangan Transaksi',
            cell: ({ row }) => (
                <div className="flex flex-col max-w-xs">
                    <span className="text-xs font-bold text-gray-700 leading-tight">{row.original.description}</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tight">Ref: {row.original.reference_number || row.original.transaction_id?.substring(0, 12)}</span>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Mutasi',
            cell: ({ row }) => (
                <div className={`flex items-center gap-1 font-black text-sm ${row.original.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.original.type === 'credit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {formatIDR(row.original.amount)}
                </div>
            )
        },
        {
            accessorKey: 'balance_after',
            header: 'Saldo Akhir',
            cell: ({ row }) => (
                <span className="font-black text-gray-900 text-sm">
                    {formatIDR(row.original.balance_after)}
                </span>
            )
        }
    ], []);

    const account = accountRes?.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mutasi Rekening</h1>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Transaction Statement</p>
                </div>
                {account && (
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 shadow-sm transition-all tracking-widest">
                            <Download className="w-4 h-4" />
                            Ekspor PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all tracking-widest">
                            <Printer className="w-4 h-4" />
                            Cetak
                        </button>
                    </div>
                )}
            </div>

            {/* Search Card */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Masukkan nomor rekening santri (NIS)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-lg font-black placeholder:text-gray-300"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isFetchingAccount}
                        className="px-8 py-3 bg-gray-900 text-white rounded-lg font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                    >
                        {isFetchingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Cek Mutasi
                    </button>
                </form>
            </div>

            {account ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {/* Account Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-6 text-center">
                            <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-100 rotate-3 group hover:rotate-0 transition-transform duration-300">
                                <span className="text-3xl font-black">{account.customer_name[0]}</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight uppercase">{account.customer_name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">{account.account_number}</p>
                            </div>
                            
                            <div className="pt-6 border-t border-gray-50 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Saldo Saat Ini</p>
                                    <p className="text-xl font-black text-indigo-600">{formatIDR(account.balance)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-tighter">
                                    <div className="bg-gray-50 p-2 rounded-md">
                                        <p className="text-gray-400 mb-1">Produk</p>
                                        <p className="text-gray-700">{account.product?.name || 'TABUNGAN'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-md">
                                        <p className="text-gray-400 mb-1">Status</p>
                                        <p className="text-emerald-600">{account.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                Mutasi menampilkan semua riwayat debit (belanja/tarik) dan kredit (setor/transfer) yang pernah dilakukan di rekening ini.
                            </p>
                        </div>
                    </div>

                    {/* Mutation Table */}
                    <div className="lg:col-span-3">
                        <DataTable 
                            columns={columns}
                            data={transRes?.data?.data || []}
                            isLoading={isFetchingTrans}
                            meta={transRes?.data}
                            onPageChange={setPage}
                            placeholder="Cari keterangan transaksi..."
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-24 text-center space-y-6">
                    <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-100">
                        <FileText className="w-12 h-12" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Cek Mutasi Tabungan</h3>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-loose">Masukkan nomor NIS atau Scan kartu santri untuk melihat riwayat mutasi saldo.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MutasiPage;
