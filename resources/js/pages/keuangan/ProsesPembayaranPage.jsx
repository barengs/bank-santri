import React, { useState, useEffect } from 'react';
import { 
    Search, 
    CreditCard, 
    Banknote, 
    CheckCircle2, 
    AlertCircle, 
    Hash, 
    User, 
    Info, 
    ArrowRight,
    Loader2,
    Calendar,
    Printer
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGetTransactionsQuery, useActivateTransactionMutation } from '../../store/transactionApi';
import { toast } from 'react-hot-toast';

const ProsesPembayaranPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const refFromUrl = searchParams.get('ref') || '';
    
    const [searchRef, setSearchRef] = useState(refFromUrl);
    const [nominalBayar, setNominalBayar] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Fetch transaction by reference number using the index endpoint with filter
    const { data: transRes, isFetching, isError } = useGetTransactionsQuery(
        { reference_number: searchRef, status: 'pending' },
        { skip: !searchRef }
    );

    const [activateTransaction, { isLoading: isActivating }] = useActivateTransactionMutation();

    const transaction = transRes?.data?.data?.[0];

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const kembalian = transaction ? (parseFloat(nominalBayar || 0) - parseFloat(transaction.amount)) : 0;

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const value = e.target.elements?.ref?.value || searchRef;
        if (value) {
            setSearchParams({ ref: value });
        }
    };

    const handleProcessPayment = async () => {
        if (!transaction) return;
        
        if (parseFloat(nominalBayar) < parseFloat(transaction.amount)) {
            toast.error("Nominal bayar kurang dari total tagihan");
            return;
        }

        try {
            await activateTransaction({ id: transaction.id }).unwrap();
            toast.success("Pembayaran berhasil dikonfirmasi!");
            setIsConfirmed(true);
        } catch (err) {
            toast.error(err?.data?.message || "Gagal memproses pembayaran");
        }
    };

    if (isConfirmed) {
        return (
            <div className="max-w-xl mx-auto py-12 animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl shadow-emerald-500/10 overflow-hidden text-center p-12 space-y-6">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-800">Pembayaran Sukses!</h2>
                        <p className="text-slate-400 font-medium">Tagihan {transaction.reference_number} telah berhasil dilunasi.</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3 border border-slate-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Tagihan</span>
                            <span className="font-black text-slate-800">{formatIDR(transaction.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nominal Bayar</span>
                            <span className="font-black text-slate-800">{formatIDR(nominalBayar)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg border-t-2 border-dashed border-slate-200 pt-3">
                            <span className="text-emerald-600 font-black uppercase tracking-widest text-xs">Kembalian</span>
                            <span className="font-black text-emerald-600">{formatIDR(kembalian)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                        <button 
                            onClick={() => navigate(`/transaksi/${transaction.id}`)}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Info className="w-5 h-5" />
                            Lihat Detail Transaksi
                        </button>
                        <button 
                            onClick={() => {
                                setIsConfirmed(false);
                                setNominalBayar('');
                                setSearchRef('');
                                setSearchParams({});
                            }}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Proses Tagihan Lain
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Proses Pembayaran</h1>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        Settlement Tagihan Non-Tunai
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Cari Tagihan Berdasarkan Nomor Referensi</label>
                    <div className="relative group">
                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            name="ref"
                            type="text" 
                            placeholder="Contoh: REG2026001..." 
                            defaultValue={searchRef}
                            className="w-full pl-14 pr-32 py-5 text-lg bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-black placeholder:text-slate-300 placeholder:font-bold"
                        />
                        <button 
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Search className="w-4 h-4" />
                            Cek Tagihan
                        </button>
                    </div>
                </form>

                {isFetching && (
                    <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Mencari data tagihan...</p>
                    </div>
                )}

                {searchRef && !isFetching && !transaction && (
                    <div className="flex items-center gap-4 p-8 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-widest text-xs">Tagihan Tidak Ditemukan</p>
                            <p className="text-sm font-bold opacity-80">Pastikan nomor referensi benar dan status masih 'Pending'.</p>
                        </div>
                    </div>
                )}

                {transaction && (
                    <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-8 mt-10">
                        {/* Transaction Detail Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="bg-white rounded-[1.8rem] p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Tagihan</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</label>
                                        <p className="text-sm font-bold text-slate-600">{transaction.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</label>
                                            <p className="text-sm font-black text-slate-800 uppercase">{transaction.channel}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                                            <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-slate-300" />
                                                {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pihak Terkait</label>
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <User className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{transaction.source_account?.customer_name || 'Non-Member'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 font-mono italic">{transaction.source_account?.account_number || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</label>
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">Belum Lunas</span>
                                    </div>
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {formatIDR(transaction.amount)}
                                    </div>
                                </div>

                                {/* Payment Input Section */}
                                <div className="space-y-6 pt-6 border-t border-slate-200/50">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                            <Banknote className="w-4 h-4" />
                                            Nominal Yang Dibayar
                                        </label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 group-focus-within:text-indigo-600">Rp</span>
                                            <input 
                                                type="number" 
                                                value={nominalBayar}
                                                onChange={(e) => setNominalBayar(e.target.value)}
                                                placeholder="0"
                                                className="w-full pl-14 pr-6 py-5 text-2xl bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 transition-all font-black"
                                            />
                                        </div>
                                    </div>

                                    {nominalBayar && (
                                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Kembalian</span>
                                                <span className={`text-xl font-black ${kembalian < 0 ? 'text-rose-500' : 'text-emerald-700'}`}>
                                                    {kembalian < 0 ? 'Nominal Kurang' : formatIDR(kembalian)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleProcessPayment}
                                        disabled={!nominalBayar || kembalian < 0 || isActivating}
                                        className="w-full py-5 bg-indigo-600 disabled:bg-slate-200 disabled:shadow-none text-white rounded-2xl text-lg font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {isActivating ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-6 h-6" />
                                                Konfirmasi Pembayaran
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProsesPembayaranPage;
