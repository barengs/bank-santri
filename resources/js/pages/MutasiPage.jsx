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
        per_page: 15
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
        if (searchQuery.trim().length >= 4) {
            setAccountNumber(searchQuery.trim());
            fetchAccount(searchQuery.trim());
        }
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'created_at',
            header: 'Waktu',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(row.original.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })} WIB
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'Keterangan Transaksi',
            cell: ({ row }) => (
                <div className="flex flex-col max-w-sm">
                    <span className="text-xs text-gray-800 leading-snug">{row.original.description}</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5">
                        Ref: {row.original.reference_number || row.original.transaction_id?.substring(0, 12)}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Mutasi',
            cell: ({ row }) => (
                <div className={`flex items-center gap-1 font-semibold text-xs ${row.original.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.original.type === 'credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    {formatIDR(row.original.amount)}
                </div>
            )
        },
        {
            accessorKey: 'balance_after',
            header: 'Saldo Akhir',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 text-xs">
                    {formatIDR(row.original.balance_after)}
                </span>
            )
        }
    ], []);

    const account = accountRes?.data;

    return (
        <div className="space-y-4">
            {/* Search and Action Bar */}
            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-none space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-gray-800">Mutasi Rekening Santri</h2>
                        <p className="text-xs text-gray-500">Cari dan cetak riwayat mutasi berdasarkan Nomor Rekening / NIS</p>
                    </div>
                    {account && (
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                                Ekspor PDF
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors">
                                <Printer className="w-3.5 h-3.5" />
                                Cetak
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Masukkan nomor rekening santri (NIS)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-gray-800 placeholder-gray-400"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isFetchingAccount}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        {isFetchingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Cari Rekening
                    </button>
                </form>
            </div>

            {account ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Account Info Sidebar */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-none space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-base shrink-0">
                                    {account.customer_name?.[0] || 'S'}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-gray-800 truncate">{account.customer_name}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{account.account_number}</p>
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t border-gray-100 space-y-2.5">
                                <div>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Total Saldo</p>
                                    <p className="text-xl font-bold text-blue-600">{formatIDR(account.balance)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                        <p className="text-[10px] text-gray-400 uppercase">Produk</p>
                                        <p className="font-semibold text-gray-700 truncate">{account.product?.name || 'TABUNGAN'}</p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                        <p className="text-[10px] text-gray-400 uppercase">Status</p>
                                        <p className="font-semibold text-emerald-600 capitalize">{account.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Mutasi menampilkan seluruh pergerakan debit (tarik/koperasi) dan kredit (top-up/transfer).
                            </p>
                        </div>
                    </div>

                    {/* Mutation Table Card */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 rounded-md p-4 shadow-none">
                        <DataTable 
                            columns={columns}
                            data={transRes?.data?.data || []}
                            isLoading={isFetchingTrans}
                            meta={transRes?.data}
                            onPageChange={setPage}
                            placeholder="Cari transaksi..."
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-md p-6 text-center space-y-2">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-sm font-bold text-gray-800">Cek Mutasi Tabungan</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Ketik nomor NIS atau Scan kartu santri di kolom pencarian di atas untuk melihat riwayat mutasi saldo.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MutasiPage;
