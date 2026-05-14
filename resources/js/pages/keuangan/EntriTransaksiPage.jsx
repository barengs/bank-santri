import React, { useState, useMemo, useEffect } from 'react';
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
    Printer,
    ArrowDownCircle,
    ArrowUpCircle,
    Plus,
    X,
    ShieldCheck,
    FileText,
    Wallet,
    ArrowRightLeft,
    Settings2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetTransactionTypesQuery } from '../../store/transactionTypeApi';
import { useCreateTransactionMutation } from '../../store/transactionApi';
import { useGetAccountsQuery } from '../../store/accountApi';
import { toast } from 'react-toastify';

const EntriTransaksiPage = () => {
    const navigate = useNavigate();
    
    // State
    const [searchAccount, setSearchAccount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [createdTransaction, setCreatedTransaction] = useState(null);

    // API Hooks
    const { data: accountsRes, isFetching: isFetchingAccounts } = useGetAccountsQuery({ search: searchAccount }, { skip: searchAccount.length < 3 });
    const { data: typesRes, isLoading: isLoadingTypes } = useGetTransactionTypesQuery();
    const [createTransaction, { isLoading: isSubmitting }] = useCreateTransactionMutation();

    // Derived Data
    const transactionTypes = useMemo(() => typesRes?.data?.data || [], [typesRes]);
    const selectedType = useMemo(() => transactionTypes.find(t => t.id.toString() === selectedTypeId), [transactionTypes, selectedTypeId]);
    
    // Auto-calculate total from rules if available
    useEffect(() => {
        if (selectedType && selectedType.rules) {
            const fixedTotal = selectedType.rules
                .filter(r => r.value_mode === 'fixed')
                .reduce((acc, curr) => acc + parseFloat(curr.fixed_amount), 0);
            
            if (fixedTotal > 0) {
                setAmount(fixedTotal);
            }
            setDescription(selectedType.name);
        }
    }, [selectedType]);

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleAccountSelect = (account) => {
        setSelectedAccount(account);
        setSearchAccount(`${account.account_number} - ${account.customer_name}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedAccount && !selectedType?.code.includes('CASH')) {
            toast.error("Silakan pilih rekening nasabah");
            return;
        }

        if (!selectedTypeId) {
            toast.error("Silakan pilih jenis transaksi");
            return;
        }

        if (amount <= 0) {
            toast.error("Nominal harus lebih dari 0");
            return;
        }

        try {
            const res = await createTransaction({
                transaction_type_id: selectedTypeId,
                source_account: selectedAccount?.account_number,
                amount: amount,
                description: description,
                channel: 'teller'
            }).unwrap();

            setCreatedTransaction(res.data);
            setIsConfirmed(true);
            toast.success("Transaksi berhasil diproses!");
        } catch (err) {
            toast.error(err?.data?.message || "Gagal memproses transaksi");
        }
    };

    if (isConfirmed && createdTransaction) {
        return (
            <div className="max-w-xl mx-auto py-12 animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl shadow-emerald-500/10 overflow-hidden text-center p-12 space-y-8">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40 animate-bounce">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Transaksi Sukses!</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Referensi: {createdTransaction.reference_number}</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-3xl p-8 text-left space-y-4 border border-slate-100">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nasabah</span>
                            <span className="font-black text-slate-800">{createdTransaction.source_account || 'CASH'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Jenis</span>
                            <span className="font-black text-indigo-600">{selectedType?.name}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                            <span className="text-emerald-600 font-black uppercase tracking-widest text-xs">Total Nominal</span>
                            <span className="text-2xl font-black text-emerald-600">{formatIDR(createdTransaction.amount)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button 
                            onClick={() => navigate(`/transaksi/${createdTransaction.id}`)}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <FileText className="w-5 h-5" />
                            Detail Transaksi
                        </button>
                        <button 
                            onClick={() => {
                                setIsConfirmed(false);
                                setCreatedTransaction(null);
                                setSelectedAccount(null);
                                setSearchAccount('');
                                setSelectedTypeId('');
                                setAmount(0);
                            }}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Input Transaksi Baru
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Entri Transaksi</h1>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-indigo-500" />
                        Input Transaksi Berbasis Template
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* Account Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">1. Pilih Rekening Nasabah</label>
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari NIS atau Nama Nasabah..." 
                                        value={searchAccount}
                                        onChange={(e) => {
                                            setSearchAccount(e.target.value);
                                            if (selectedAccount) setSelectedAccount(null);
                                        }}
                                        className="w-full pl-14 pr-10 py-5 text-lg bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-black placeholder:text-slate-300 placeholder:font-bold"
                                    />
                                    {isFetchingAccounts && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-500" />}
                                    {!isFetchingAccounts && searchAccount.length >= 3 && !selectedAccount && accountsRes?.data?.data?.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto no-scrollbar">
                                            {accountsRes.data.data.map(acc => (
                                                <button 
                                                    key={acc.id}
                                                    type="button"
                                                    onClick={() => handleAccountSelect(acc)}
                                                    className="w-full p-4 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{acc.customer_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 font-mono">{acc.account_number}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedAccount && (
                                    <div className="flex items-center gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in zoom-in duration-300">
                                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">{selectedAccount.customer_name}</p>
                                            <p className="text-sm font-bold text-indigo-600">Saldo: {formatIDR(selectedAccount.balance)}</p>
                                        </div>
                                        <button onClick={() => {setSelectedAccount(null); setSearchAccount('')}} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-400">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Transaction Type Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">2. Pilih Jenis Transaksi</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {transactionTypes.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setSelectedTypeId(type.id.toString())}
                                            className={`p-4 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                                selectedTypeId === type.id.toString()
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                                : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTypeId === type.id.toString() ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                    <Hash className={`w-4 h-4 ${selectedTypeId === type.id.toString() ? 'text-white' : 'text-slate-400'}`} />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black uppercase tracking-widest ${selectedTypeId === type.id.toString() ? 'text-white' : 'text-slate-800'}`}>{type.name}</p>
                                                    <p className={`text-[9px] font-bold opacity-60 ${selectedTypeId === type.id.toString() ? 'text-indigo-100' : 'text-slate-400'}`}>{type.code}</p>
                                                </div>
                                            </div>
                                            {selectedTypeId === type.id.toString() && <CheckCircle2 className="w-5 h-5 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-emerald-500" />
                                        Nominal Transaksi
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 group-focus-within:text-emerald-600">Rp</span>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                                            className="w-full pl-14 pr-6 py-5 text-2xl bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-black text-slate-800"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        Keterangan
                                    </label>
                                    <input 
                                        type="text" 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tambahkan catatan jika perlu..."
                                        className="w-full px-6 py-5 text-sm bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting || !selectedTypeId || amount <= 0}
                                className="w-full py-5 bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[1.5rem] text-lg font-black shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Proses Transaksi Sekarang
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Info Section / Rules Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Settings2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Rincian Template</h3>
                        </div>

                        {!selectedType ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <AlertCircle className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Silakan pilih jenis transaksi</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-3">
                                    {selectedType.rules?.map((rule, idx) => (
                                        <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${rule.entry_type === 'debit' ? 'bg-blue-500' : 'bg-rose-500'}`}></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rule.description || 'Komponen'}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${rule.entry_type === 'debit' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {rule.entry_type}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-mono font-bold text-slate-500">{rule.coa_code}</p>
                                                <p className="text-xs font-black text-slate-800">
                                                    {rule.value_mode === 'fixed' ? formatIDR(rule.fixed_amount) : (rule.value_mode === 'total' ? '100% Total' : 'Sisa')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedType.rules || selectedType.rules.length === 0) && (
                                        <p className="text-xs text-slate-400 italic">Tidak ada aturan penjurnalan khusus.</p>
                                    )}
                                </div>

                                <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                                    <div className="flex justify-between items-center opacity-70 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Estimasi Total</span>
                                        <Info className="w-3 h-3" />
                                    </div>
                                    <p className="text-xl font-black tracking-tight">{formatIDR(amount)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-wider">
                            PENTING: Pastikan saldo nasabah mencukupi jika transaksi bersifat debit (pengurangan saldo). Transaksi yang sudah diproses tidak dapat dibatalkan kecuali dengan fitur Reversal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntriTransaksiPage;
