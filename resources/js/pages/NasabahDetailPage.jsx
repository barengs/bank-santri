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

    // Fetch Account Info
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
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Memuat informasi nasabah...</p>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="bg-white border border-gray-200 rounded-md p-6 text-center max-w-lg mx-auto">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
                <h2 className="text-base font-bold text-gray-800">Nasabah Tidak Ditemukan</h2>
                <p className="text-xs text-gray-500 mt-1">Rekening {accountNumber} tidak terdaftar dalam sistem.</p>
                <button 
                    onClick={() => navigate('/nasabah')} 
                    className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Rekening
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Bar Card */}
            <div className="bg-white border border-gray-200 rounded-md p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/nasabah')}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-800 border border-gray-200 transition-colors"
                        title="Kembali"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Detail Rekening: {account.customer_name}</h2>
                        <p className="text-xs text-gray-500 font-mono">NIS: {account.account_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/mutasi')}
                        className="px-3 py-1.5 border border-blue-400 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors"
                    >
                        Cek Mutasi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Account Summary */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Account Card */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                                {account.customer_name?.[0] || 'S'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm text-gray-800 leading-tight truncate">{account.customer_name}</h3>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                    {account.status || 'Aktif'}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 space-y-2.5">
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Nomor Rekening</p>
                                <p className="text-sm font-mono font-bold text-gray-800">{account.account_number}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Total Saldo</p>
                                <p className="text-xl font-bold text-blue-600">{formatIDR(account.balance)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                    <p className="text-[10px] text-gray-400 uppercase">Produk</p>
                                    <p className="font-semibold text-gray-700 truncate">{account.product?.name || 'Wadiah'}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                    <p className="text-[10px] text-gray-400 uppercase">Akad</p>
                                    <p className="font-semibold text-gray-700 capitalize">{account.product?.contract_type || 'Wadiah'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-2 shadow-none">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Informasi Kartu & Tanggal</h4>
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                    <span>No. Kartu / RFID</span>
                                </div>
                                <span className="font-mono font-semibold text-gray-800">{account.card_number || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Tanggal Buka</span>
                                </div>
                                <span className="font-semibold text-gray-800">
                                    {account.created_at ? new Date(account.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3 shadow-none">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-600" />
                                Riwayat Transaksi Terbaru
                            </h3>
                            <button 
                                onClick={() => navigate('/transaksi')}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Semua Transaksi
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            {isLoadingTx ? (
                                <div className="py-12 text-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                    <span className="text-xs">Memuat transaksi...</span>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                    <p className="text-xs font-medium">Belum ada riwayat transaksi</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                                                    tx.destination_account === accountNumber ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {tx.destination_account === accountNumber ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 leading-tight">{tx.description}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(tx.created_at).toLocaleString('id-ID', { 
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-bold ${
                                                    tx.destination_account === accountNumber ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                    {tx.destination_account === accountNumber ? '+' : '-'}{formatIDR(tx.amount)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-mono">
                                                    {tx.reference_number || tx.id?.substring(0, 8)}
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
