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
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [createdTransaction, setCreatedTransaction] = useState(null);

    // API Hooks
    const { data: accountsRes, isFetching: isFetchingAccounts } = useGetAccountsQuery(
        { search: searchAccount }, 
        { skip: searchAccount.length < 3 || !!selectedAccount }
    );
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
                setAmount(new Intl.NumberFormat('id-ID').format(fixedTotal));
            } else {
                setAmount('');
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

        const rawAmount = Number(amount.toString().replace(/\./g, ''));

        if (rawAmount <= 0) {
            toast.error("Nominal harus lebih dari 0");
            return;
        }

        const isTopUp = selectedType?.category === 'topup' || selectedType?.code.startsWith('TOPUP');

        try {
            const res = await createTransaction({
                transaction_type_id: selectedTypeId,
                source_account: isTopUp ? null : selectedAccount?.account_number,
                destination_account: isTopUp ? selectedAccount?.account_number : null,
                amount: rawAmount,
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
            <div className="max-w-md mx-auto py-6">
                <div className="bg-white rounded-md border border-gray-200 text-center p-6 space-y-5 shadow-none">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-base font-bold text-gray-900">Transaksi Sukses!</h2>
                        <p className="text-gray-400 font-mono text-xs">Referensi: {createdTransaction.reference_number}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 text-left space-y-2 border border-gray-200 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Nasabah</span>
                            <span className="font-semibold text-gray-800">{createdTransaction.source_account || createdTransaction.destination_account || 'CASH'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Jenis</span>
                            <span className="font-semibold text-blue-600">{selectedType?.name}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-gray-700 font-bold">Total Nominal</span>
                            <span className="text-base font-bold text-emerald-600">{formatIDR(createdTransaction.amount)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button 
                            onClick={() => navigate(`/transaksi/${createdTransaction.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            Detail Transaksi
                        </button>
                        <button 
                            onClick={() => {
                                setIsConfirmed(false);
                                setCreatedTransaction(null);
                                setSelectedAccount(null);
                                setSearchAccount('');
                                setSelectedTypeId('');
                                setAmount('');
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-all"
                        >
                            Input Baru
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Entri Transaksi</h1>
                    <p className="text-xs text-gray-500">Input transaksi berbasis template aturan jurnal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Form Section */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Account Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 block">1. Pilih Rekening Nasabah</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cari NIS atau Nama Nasabah..." 
                                    value={searchAccount}
                                    onChange={(e) => {
                                        setSearchAccount(e.target.value);
                                        if (selectedAccount) setSelectedAccount(null);
                                    }}
                                    className="w-full pl-9 pr-8 h-9 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                                />
                                {isFetchingAccounts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                                {!isFetchingAccounts && searchAccount.length >= 3 && !selectedAccount && accountsRes?.data?.data?.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden z-50 max-h-56 overflow-y-auto">
                                        {accountsRes.data.data.map(acc => (
                                            <button 
                                                key={acc.id}
                                                type="button"
                                                onClick={() => handleAccountSelect(acc)}
                                                className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group border-b border-gray-100 last:border-0"
                                            >
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-800">{acc.customer_name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{acc.account_number}</p>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedAccount && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-md flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{selectedAccount.customer_name}</p>
                                        <p className="text-[11px] text-blue-700 font-medium">Saldo: {formatIDR(selectedAccount.balance)} • <span className="font-mono text-gray-500">{selectedAccount.account_number}</span></p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {setSelectedAccount(null); setSearchAccount('')}} 
                                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Transaction Type Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 block">2. Pilih Jenis Transaksi</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {transactionTypes.map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setSelectedTypeId(type.id.toString())}
                                        className={`p-2.5 text-left rounded-md border transition-all flex items-center justify-between text-xs ${
                                            selectedTypeId === type.id.toString()
                                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium'
                                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center ${selectedTypeId === type.id.toString() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                <Hash className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{type.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{type.code}</p>
                                            </div>
                                        </div>
                                        {selectedTypeId === type.id.toString() && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount & Description */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                                    Nominal Transaksi
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                    <input 
                                        type="text" 
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                            if (rawValue === '') {
                                                setAmount('');
                                                return;
                                            }
                                            const formattedValue = new Intl.NumberFormat('id-ID').format(Number(rawValue));
                                            setAmount(formattedValue);
                                        }}
                                        className="w-full pl-9 pr-3 h-9 text-xs font-semibold bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    Keterangan
                                </label>
                                <input 
                                    type="text" 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tambahkan catatan jika perlu..."
                                    className="w-full px-3 h-9 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting || !selectedTypeId || !amount || Number(amount.toString().replace(/\./g, '')) <= 0}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Proses Transaksi Sekarang
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info Section / Rules Summary */}
                <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3 shadow-none">
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
                            <Settings2 className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Rincian Template</h3>
                        </div>

                        {!selectedType ? (
                            <div className="py-8 text-center space-y-2">
                                <AlertCircle className="w-6 h-6 text-gray-300 mx-auto" />
                                <p className="text-xs text-gray-400">Silakan pilih jenis transaksi</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    {selectedType.rules?.map((rule, idx) => (
                                        <div key={idx} className="p-2.5 bg-gray-50 rounded-md border border-gray-200 relative text-xs space-y-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-gray-700">{rule.description || 'Komponen'}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${rule.entry_type === 'debit' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {rule.entry_type}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-mono text-gray-500">{rule.coa_code}</p>
                                                <p className="font-semibold text-gray-900">
                                                    {rule.value_mode === 'fixed' ? formatIDR(rule.fixed_amount) : (rule.value_mode === 'total' ? '100% Total' : 'Sisa')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedType.rules || selectedType.rules.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">Tidak ada aturan penjurnalan khusus.</p>
                                    )}
                                </div>

                                <div className="p-3 bg-blue-600 text-white rounded-md">
                                    <div className="flex justify-between items-center opacity-80 text-[10px] mb-0.5">
                                        <span>Estimasi Total</span>
                                        <Info className="w-3 h-3" />
                                    </div>
                                    <p className="text-base font-bold">{formatIDR(Number(amount.toString().replace(/\./g, '')))}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            Pastikan saldo nasabah mencukupi jika transaksi bersifat debit. Transaksi yang sudah diproses hanya dapat dibatalkan melalui fitur Reversal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntriTransaksiPage;
