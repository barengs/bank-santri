import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, CreditCard, User, ShieldCheck, 
    History, TrendingUp, TrendingDown, Clock,
    Loader2, AlertCircle
} from 'lucide-react';
import { useGetTransactionsQuery } from '../store/transactionApi';
import { useGetAccountsQuery } from '../store/accountApi';

const NasabahDetailPage = () => {
    const { accountNumber } = useParams();
    const navigate = useNavigate();

    // Fetch Account Info (using existing hook, might need specific by-number hook if available)
    const { data: accountsRes, isLoading: isLoadingAccount } = useGetAccountsQuery({ search: accountNumber });
    const account = accountsRes?.data?.data?.find(acc => acc.account_number === accountNumber);

    // Fetch Transactions
    const { data: transactionsRes, isLoading: isLoadingTx } = useGetTransactionsQuery({ account_number: accountNumber });
    const transactions = transactionsRes?.data?.data || [];

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoadingAccount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Memuat informasi nasabah...</p>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
                <h2 className="text-xl font-bold text-slate-800">Nasabah Tidak Ditemukan</h2>
                <p>Rekening {accountNumber} tidak terdaftar dalam sistem.</p>
                <button onClick={() => navigate('/nasabah')} className="mt-6 text-blue-600 font-bold flex items-center gap-2 hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/nasabah')}
                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-800 transition-all border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Detail Nasabah</h1>
                    <p className="text-sm text-slate-500">Kelola informasi dan riwayat transaksi {account.customer_name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Account Summary */}
                <div className="lg:col-span-1 space-y-6">
                    {/* ID Card Style */}
                    <div className="relative bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute right-6 top-6 opacity-20">
                            <ShieldCheck className="w-16 h-16" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
                                    {account.customer_name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{account.customer_name}</h3>
                                    <p className="text-xs text-indigo-100 uppercase tracking-widest font-bold">Nasabah Aktif</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">Nomor Rekening</p>
                                <p className="text-2xl font-mono font-bold tracking-wider">{account.account_number}</p>
                            </div>

                            <div className="pt-4 flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">Total Saldo</p>
                                    <p className="text-2xl font-black">{formatIDR(account.balance)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">Produk</p>
                                    <p className="text-sm font-bold uppercase">{account.product?.name || 'Wadiah'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informasi Lainnya</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">No. Kartu</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-800">{account.card_number || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">Bergabung Sejak</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                    {new Date(account.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                Riwayat Transaksi Terbaru
                            </h3>
                            <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {isLoadingTx ? (
                                <div className="p-20 text-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    Memuat transaksi...
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Belum ada riwayat transaksi</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                    tx.entry_type === 'DEBIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {tx.entry_type === 'DEBIT' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 leading-tight">{tx.description}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                        {new Date(tx.created_at).toLocaleString('id-ID', { 
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${
                                                    tx.entry_type === 'DEBIT' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                    {tx.entry_type === 'DEBIT' ? '+' : '-'}{formatIDR(tx.amount)}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    Ref: {tx.reference_number || tx.id}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NasabahDetailPage;
