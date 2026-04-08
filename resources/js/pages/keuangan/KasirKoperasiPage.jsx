import React, { useState, useMemo } from 'react';
import { 
    ShoppingCart, 
    Search, 
    User, 
    Wallet, 
    History, 
    CheckCircle2, 
    Loader2, 
    AlertCircle,
    ArrowRightCircle,
    Store
} from 'lucide-react';
import { 
    useLazyCheckKoperasiAccountQuery, 
    useProcessKoperasiDebitMutation,
    useGetKoperasiTransactionsQuery
} from '../../store/koperasiApi';
import DataTable from '../../components/DataTable';

const KasirKoperasiPage = () => {
    const [nis, setNis] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [page, setPage] = useState(1);

    // API Hooks
    const [checkAccount, { data: accountRes, isFetching: isChecking }] = useLazyCheckKoperasiAccountQuery();
    const [processDebit, { isLoading: isProcessing }] = useProcessKoperasiDebitMutation();
    const { data: trxRes, isLoading: isLoadingTrx } = useGetKoperasiTransactionsQuery({ page, per_page: 5 });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleCheck = (e) => {
        e.preventDefault();
        if (nis.length >= 4) {
            checkAccount(nis);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!accountRes?.data || !amount) return;

        try {
            await processDebit({
                account_number: accountRes.data.account_number,
                amount: Number(amount),
                item_description: description
            }).unwrap();
            
            alert('Transaksi Berhasil!');
            setNis('');
            setAmount('');
            setDescription('');
            // Reset account state (implicitly handled by NIS reset if we use NIS as key for UI or manually clear)
        } catch (err) {
            alert('Gagal: ' + (err.data?.message || 'Terjadi kesalahan'));
        }
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'created_at',
            header: 'Waktu',
            cell: ({ row }) => (
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {new Date(row.original.created_at).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit' })}
                </div>
            )
        },
        {
            accessorKey: 'account.customer_name',
            header: 'Santri',
            cell: ({ row }) => <span className="text-xs font-black text-gray-700">{row.original.account?.customer_name}</span>
        },
        {
            accessorKey: 'item_description',
            header: 'Keterangan',
            cell: ({ row }) => <span className="text-xs text-gray-500 font-medium">{row.original.item_description || 'Pembelian'}</span>
        },
        {
            accessorKey: 'amount',
            header: 'Total',
            cell: ({ row }) => <span className="text-xs font-black text-rose-600">{formatIDR(row.original.amount)}</span>
        }
    ], []);

    const account = accountRes?.data;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Kasir Koperasi</h1>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Store className="w-4 h-4 text-orange-500" />
                        Cooperative Point of Sale
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: POS Input */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-8">
                        {/* Account Check */}
                        <form onSubmit={handleCheck} className="space-y-4">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Scan / Input NIS Santri</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Tempelkan kartu atau ketik nomor NIS..."
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-xl font-black placeholder:text-gray-300"
                                />
                                {isChecking && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />}
                            </div>
                        </form>

                        {/* Transaction Details */}
                        {account ? (
                            <form onSubmit={handleTransaction} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nominal Belanja</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</div>
                                            <input 
                                                type="number" 
                                                required
                                                placeholder="0"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-2xl font-black text-orange-600"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Keterangan Item</label>
                                        <input 
                                            type="text" 
                                            placeholder="Contoh: Snack, Alat Tulis..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isProcessing || account.balance < Number(amount)}
                                    className="w-full py-5 bg-gray-900 text-white rounded-lg font-black text-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRightCircle className="w-6 h-6" />}
                                    KONFIRMASI PEMBAYARAN
                                </button>
                                
                                {account.balance < Number(amount) && (
                                    <p className="text-center text-xs text-rose-600 font-black uppercase tracking-widest bg-rose-50 py-2 rounded-md">
                                        Saldo Tidak Mencukupi!
                                    </p>
                                )}
                            </form>
                        ) : (
                            <div className="py-20 text-center space-y-4 text-gray-300">
                                <ShoppingCart className="w-16 h-16 mx-auto opacity-20" />
                                <p className="text-sm font-bold">Menunggu pemindaian kartu...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Student Info & History */}
                <div className="space-y-6">
                    {/* Student Card */}
                    <div className="bg-indigo-600 p-6 rounded-lg text-white shadow-xl space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Store className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-md flex items-center justify-center font-black text-xl">
                                {account?.student?.name?.[0] || <User className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black leading-tight">{account?.customer_name || 'NAMA SANTRI'}</h4>
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{account?.account_number || 'NIS••••••••'}</p>
                            </div>
                        </div>
                        <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black opacity-40 uppercase mb-1">Saldo Tersedia</p>
                                <h2 className="text-2xl font-black">{formatIDR(account?.balance || 0)}</h2>
                            </div>
                            {account?.status === 'AKTIF' && (
                                <div className="bg-emerald-400 text-emerald-900 px-2 py-1 rounded text-[10px] font-black uppercase">Aktif</div>
                            )}
                        </div>
                    </div>

                    {/* Quick History */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            <History className="w-4 h-4" />
                            Aktivitas Terakhir
                        </div>
                        <div className="space-y-4">
                           <DataTable 
                                columns={columns}
                                data={trxRes?.data?.data || []}
                                isLoading={isLoadingTrx}
                                // Hide pagination for sidebar history
                           />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KasirKoperasiPage;
