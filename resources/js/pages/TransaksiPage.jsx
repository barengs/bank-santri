import React, { useState } from 'react';
import { 
    Download, 
    Upload, 
    ArrowRightLeft, 
    Search, 
    Loader2, 
    CheckCircle2, 
    Wallet,
    AlertTriangle,
    Printer,
    ArrowDownCircle,
    ArrowUpCircle
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../store/accountApi';
import { 
    useCashDepositMutation, 
    useCashWithdrawalMutation, 
    useFundTransferMutation 
} from '../store/transactionApi';

const TransaksiPage = () => {
    const [activeTab, setActiveTab] = useState('deposit');
    const [accountNumber, setAccountNumber] = useState('');
    const [destAccountNumber, setDestAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [receipt, setReceipt] = useState(null);

    // API Hooks
    const [fetchAccount, { data: accountRes, isFetching: isFetchingAccount }] = useLazyGetAccountDetailQuery();
    const [fetchDestAccount, { data: destAccountRes, isFetching: isFetchingDest }] = useLazyGetAccountDetailQuery();
    
    const [deposit, { isLoading: isDepositing }] = useCashDepositMutation();
    const [withdraw, { isLoading: isWithdrawing }] = useCashWithdrawalMutation();
    const [transfer, { isLoading: isTransferring }] = useFundTransferMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleAccountCheck = (val) => {
        setAccountNumber(val);
        if (val.length >= 4) {
            fetchAccount(val);
        }
    };

    const handleDestAccountCheck = (val) => {
        setDestAccountNumber(val);
        if (val.length >= 4) {
            fetchDestAccount(val);
        }
    };

    const resetForm = () => {
        setAccountNumber('');
        setDestAccountNumber('');
        setAmount('');
        setDescription('');
        setReceipt(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (activeTab === 'deposit') {
                res = await deposit({ account_number: accountNumber, amount: Number(amount), description }).unwrap();
            } else if (activeTab === 'withdraw') {
                res = await withdraw({ account_number: accountNumber, amount: Number(amount), description }).unwrap();
            } else if (activeTab === 'transfer') {
                res = await transfer({ 
                    source_account: accountNumber, 
                    destination_account: destAccountNumber, 
                    amount: Number(amount), 
                    description 
                }).unwrap();
            }

            setReceipt(res.data);
            alert('Transaksi Berhasil!');
        } catch (err) {
            alert('Gagal: ' + (err.data?.message || 'Terjadi kesalahan sistem'));
        }
    };

    const tabs = [
        { id: 'deposit', label: 'Setoran Tunai', icon: ArrowDownCircle, color: 'emerald' },
        { id: 'withdraw', label: 'Penarikan Tunai', icon: ArrowUpCircle, color: 'rose' },
        { id: 'transfer', label: 'Transfer Antar Santri', icon: ArrowRightLeft, color: 'indigo' },
    ];

    const currentAccount = accountRes?.data;
    const currentDestAccount = destAccountRes?.data;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Olah Transaksi</h1>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Teller Counter POS</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-gray-100 rounded-2xl gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); resetForm(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                            activeTab === tab.id 
                            ? `bg-white text-${tab.color}-600 shadow-sm shadow-gray-200` 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Form Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: Inputs */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Account Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                    {activeTab === 'transfer' ? 'Rekening Sumber' : 'Rekening Santri'}
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Masukkan nomor rekening (NIS)..."
                                        value={accountNumber}
                                        onChange={(e) => handleAccountCheck(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-lg font-bold placeholder:font-medium tracking-tight"
                                        required
                                    />
                                    {isFetchingAccount && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
                                    )}
                                </div>
                            </div>

                            {activeTab === 'transfer' && (
                                <div className="space-y-2 slide-in-bottom">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Rekening Tujuan</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="text"
                                            placeholder="Masukkan nomor rekening tujuan..."
                                            value={destAccountNumber}
                                            onChange={(e) => handleDestAccountCheck(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-lg font-bold placeholder:font-medium tracking-tight"
                                            required
                                        />
                                        {isFetchingDest && (
                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
                                        )}
                                    </div>
                                    {currentDestAccount && (
                                        <div className="p-3 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                                            <span className="text-xs font-bold text-indigo-700">{currentDestAccount.customer_name}</span>
                                            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Nominal Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nominal Transaksi</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</div>
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-2xl font-black text-indigo-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Keterangan (Opsional)</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Catatan tambahan..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-sm font-medium"
                                ></textarea>
                            </div>

                            <button 
                                type="submit"
                                disabled={!currentAccount || (activeTab === 'transfer' && !currentDestAccount) || isDepositing || isWithdrawing || isTransferring}
                                className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                    currentAccount 
                                    ? 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {(isDepositing || isWithdrawing || isTransferring) ? <Loader2 className="w-6 h-6 animate-spin" /> : <Printer className="w-5 h-5" />}
                                KONFIRMASI & PROSES
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Side: Account Card Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Bank Santri Card</p>
                                    <h4 className="text-xl font-black">{currentAccount?.customer_name || 'NAMA NASABAH'}</h4>
                                </div>
                                <ShieldCheck className="w-6 h-6 opacity-60" />
                            </div>
                            
                            <div>
                                <p className="text-[10px] font-black opacity-40 uppercase mb-1">Nomor Rekening</p>
                                <p className="text-lg font-mono font-bold tracking-[0.2em]">{currentAccount?.account_number || '•••• •••• ••••'}</p>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-[10px] font-black opacity-40 uppercase mb-1">Saldo Tersedia</p>
                                <h2 className="text-2xl font-black">{formatIDR(currentAccount?.balance || 0)}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Alert for Status */}
                    {currentAccount?.status !== 'AKTIF' && currentAccount && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                            <div>
                                <p className="text-sm font-black text-rose-700 uppercase">Perhatian!</p>
                                <p className="text-xs text-rose-600 font-medium">Rekening ini berstatus <span className="font-bold underline">{currentAccount.status}</span>. Beberapa transaksi mungkin tidak diizinkan.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            {receipt && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setReceipt(null)}></div>
                    <div className="relative w-full max-w-sm bg-white p-8 rounded-[3rem] shadow-2xl space-y-6 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">Transaksi Berhasil</h2>
                        <div className="space-y-4 py-6 border-y border-dashed border-gray-200">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Referensi</span>
                                <span className="text-gray-900 font-black font-mono uppercase">{receipt.data?.reference_number || 'REF' + Date.now()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Tanggal</span>
                                <span className="text-gray-900 font-black">{new Date().toLocaleString('id-ID')}</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Jumlah</p>
                                <p className="text-3xl font-black text-indigo-600">{formatIDR(receipt.data?.amount || amount)}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setReceipt(null); resetForm(); }}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95"
                        >
                            SELESAI & TUTUP
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ShieldCheck = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);

export default TransaksiPage;
