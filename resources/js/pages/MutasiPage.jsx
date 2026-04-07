import React, { useState } from 'react';
import { 
    Search, 
    Download, 
    Printer, 
    Loader2, 
    ArrowUpRight, 
    ArrowDownLeft,
    FileText,
    Calendar,
    Filter
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../store/accountApi';
import { useGetAccountTransactionsQuery } from '../store/transactionApi';

const MutasiPage = () => {
    const [accountNumber, setAccountNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // API Hooks
    const [fetchAccount, { data: accountRes, isFetching: isFetchingAccount }] = useLazyGetAccountDetailQuery();
    const { data: transRes, isFetching: isFetchingTrans } = useGetAccountTransactionsQuery(accountNumber, {
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

    const movements = transRes?.data?.data || [];
    const account = accountRes?.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mutasi Rekening</h1>
                    <p className="text-sm text-gray-500">Lihat riwayat transaksi lengkap nasabah.</p>
                </div>
                {account && (
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                            <Download className="w-4 h-4" />
                            Ekspor PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
                            <Printer className="w-4 h-4" />
                            Cetak
                        </button>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Masukkan nomor rekening santri (NIS)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isFetchingAccount}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {isFetchingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek Mutasi'}
                    </button>
                </form>
            </div>

            {account ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Account Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-xl">
                                {account.customer_name[0]}
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{account.customer_name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{account.account_number}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold">Produk</span>
                                    <span className="text-gray-900 font-black">{account.product?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold">Akad</span>
                                    <span className="text-gray-900 font-black uppercase">{account.akad_type}</span>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Saldo Saat Ini</p>
                                    <p className="text-lg font-black text-indigo-600">{formatIDR(account.balance)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mutation Table */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Riwayat Transaksi</h3>
                                <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:bg-white hover:text-indigo-600 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                        <Calendar className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:bg-white hover:text-indigo-600 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-50">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Mutasi</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {isFetchingTrans ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                                                </td>
                                            </tr>
                                        ) : movements.length > 0 ? (
                                            movements.map((move) => (
                                                <tr key={move.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs font-bold text-gray-900">{new Date(move.created_at).toLocaleDateString('id-ID')}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase">{new Date(move.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} WIB</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-bold text-gray-700 leading-tight">{move.description}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{move.transaction_id?.substring(0, 8)}</p>
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-black text-sm ${move.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            {move.type === 'credit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                            {formatIDR(move.amount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-black text-gray-900">{formatIDR(move.balance_after)}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                                    <p className="text-sm font-bold">Belum ada aktivitas transaksi</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-16 text-center space-y-6">
                    <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-12 h-12" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Cek Mutasi Tabungan</h3>
                        <p className="text-sm text-gray-400 font-medium">Masukkan nomor rekening santri di atas untuk melihat detail mutasi saldo secara lengkap.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MutasiPage;
