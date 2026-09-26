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
import { toast } from 'react-toastify';

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
        }).format(amount || 0);
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
            
            toast.success('Transaksi Koperasi Berhasil!');
            setNis('');
            setAmount('');
            setDescription('');
        } catch (err) {
            toast.error('Gagal: ' + (err.data?.message || 'Terjadi kesalahan'));
        }
    };

    const account = accountRes?.data;

    const columns = useMemo(() => [
        {
            accessorKey: 'account.customer_name',
            header: 'Santri',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-xs">{row.original.account?.customer_name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{row.original.account_number}</span>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-bold text-gray-900 text-xs">
                    {formatIDR(row.original.amount)}
                </span>
            )
        },
        {
            accessorKey: 'created_at',
            header: 'Waktu',
            cell: ({ row }) => (
                <span className="text-[10px] text-gray-500">
                    {new Date(row.original.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} WIB
                </span>
            )
        }
    ], []);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Kasir Koperasi & Toko Santri</h2>
                <p className="text-xs text-gray-500">Point of Sales belanja non-tunai berbasis kartu santri / NIS</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: POS Terminal (7 Cols) */}
                <div className="lg:col-span-7 border border-gray-200 rounded-md p-3.5 space-y-3">
                    <form onSubmit={handleCheck} className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Nomor Rekening / Scan Kartu (NIS)</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Tempelkan kartu RFID atau ketik NIS..."
                                value={nis}
                                onChange={(e) => setNis(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {isChecking && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                        </div>
                    </form>

                    {account ? (
                        <form onSubmit={handleTransaction} className="space-y-3 pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Nominal Belanja (IDR)</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                        <input 
                                            type="number" 
                                            required
                                            placeholder="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-base font-bold text-orange-600 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Keterangan Item</label>
                                    <input 
                                        type="text" 
                                        placeholder="Contoh: Snack, Alat Tulis..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isProcessing || account.balance < Number(amount)}
                                className="w-full py-2 bg-blue-600 text-white rounded-md font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
                                Konfirmasi Pembayaran Belanja
                            </button>
                            
                            {account.balance < Number(amount) && (
                                <p className="text-center text-xs text-rose-600 font-semibold bg-rose-50 py-1 rounded border border-rose-200">
                                    Saldo Tidak Mencukupi!
                                </p>
                            )}
                        </form>
                    ) : (
                        <div className="py-10 text-center space-y-1 text-gray-400">
                            <ShoppingCart className="w-8 h-8 mx-auto opacity-30 mb-1" />
                            <p className="text-xs font-medium">Menunggu pemindaian kartu santri...</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Student Info & History (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                    {/* Student Card */}
                    <div className="border border-gray-200 rounded-md p-3.5 space-y-2.5 bg-gray-50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-sm shrink-0">
                                {account?.customer_name?.[0] || 'S'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-gray-800 truncate">{account?.customer_name || 'NAMA SANTRI'}</h4>
                                <p className="text-[10px] text-gray-400 font-mono">{account?.account_number || 'NIS••••••••'}</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase block">Saldo Tersedia</span>
                                <span className="text-lg font-bold text-blue-700">{formatIDR(account?.balance || 0)}</span>
                            </div>
                            {account && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                                    {account.status}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quick History */}
                    <div className="border border-gray-200 rounded-md p-3 space-y-2">
                        <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-blue-600" />
                            Aktivitas Belanja Terakhir
                        </span>
                        <DataTable 
                            columns={columns}
                            data={trxRes?.data?.data || []}
                            isLoading={isLoadingTrx}
                            hideSearch
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KasirKoperasiPage;
