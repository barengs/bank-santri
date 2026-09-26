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
import { toast } from 'react-toastify';

const ProsesPembayaranPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const refFromUrl = searchParams.get('ref') || '';
    
    const [searchRef, setSearchRef] = useState(refFromUrl);
    const [nominalBayar, setNominalBayar] = useState('');
    const [confirmedTransaction, setConfirmedTransaction] = useState(null);

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
            toast.error('Nominal pembayaran kurang!');
            return;
        }

        try {
            const res = await activateTransaction({
                reference_number: transaction.reference_number,
                channel: 'teller'
            }).unwrap();

            toast.success('Pembayaran berhasil diproses!');
            setConfirmedTransaction({
                ...transaction,
                paid_amount: nominalBayar,
                change_amount: kembalian,
                paid_at: new Date().toISOString()
            });
        } catch (err) {
            toast.error(err?.data?.message || 'Gagal memproses pembayaran');
        }
    };

    if (confirmedTransaction) {
        return (
            <div className="bg-white border border-gray-200 rounded-md p-6 max-w-lg mx-auto text-center space-y-4 shadow-none">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <div>
                    <h2 className="text-base font-bold text-gray-800">Pembayaran Berhasil!</h2>
                    <p className="text-xs text-gray-500">Transaksi telah diverifikasi dan lunas</p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                        <span className="text-gray-500">No. Referensi:</span>
                        <span className="font-mono font-semibold">{confirmedTransaction.reference_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Deskripsi:</span>
                        <span className="font-medium">{confirmedTransaction.description}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Total Tagihan:</span>
                        <span className="font-bold text-gray-900">{formatIDR(confirmedTransaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Nominal Dibayar:</span>
                        <span className="font-semibold">{formatIDR(confirmedTransaction.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-500">Kembalian:</span>
                        <span className="font-bold text-emerald-700">{formatIDR(confirmedTransaction.change_amount)}</span>
                    </div>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                    <button 
                        onClick={() => window.print()}
                        className="px-3.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5"
                    >
                        <Printer size={14} />
                        Cetak Struk
                    </button>
                    <button 
                        onClick={() => {
                            setConfirmedTransaction(null);
                            setNominalBayar('');
                            setSearchRef('');
                            setSearchParams({});
                        }}
                        className="px-3.5 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Transaksi Baru
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Page Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Proses Pembayaran Kasir</h2>
                <p className="text-xs text-gray-500">Penyelesaian pelunasan tagihan non-tunai, registrasi, dan paket santri</p>
            </div>

            {/* Search Section */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        name="ref"
                        type="text" 
                        placeholder="Ketik Nomor Referensi Tagihan (Contoh: REG2026001)..." 
                        defaultValue={searchRef}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <button 
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    <Search className="w-3.5 h-3.5" />
                    Cek Tagihan
                </button>
            </form>

            {isFetching && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Mencari data tagihan...</span>
                </div>
            )}

            {searchRef && !isFetching && !transaction && (
                <div className="flex items-center gap-2.5 p-3 bg-rose-50 rounded-md border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Tagihan tidak ditemukan atau sudah lunas. Pastikan nomor referensi benar.</span>
                </div>
            )}

            {transaction && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Detail Card */}
                    <div className="border border-gray-200 rounded-md p-3.5 space-y-2.5 bg-gray-50 text-xs">
                        <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-200 pb-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span>Informasi Tagihan</span>
                        </div>
                        <div className="space-y-1.5 text-gray-700">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Deskripsi:</span>
                                <span className="font-semibold text-gray-800">{transaction.description}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Channel:</span>
                                    <span className="font-medium uppercase">{transaction.channel}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Tanggal:</span>
                                    <span>{new Date(transaction.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                            <div className="pt-1 border-t border-gray-200">
                                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Nasabah:</span>
                                <span className="font-semibold text-gray-800">{transaction.source_account?.customer_name || 'Non-Member'}</span>
                                <span className="font-mono text-gray-400 text-[10px] block">{transaction.source_account?.account_number || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Input Section */}
                    <div className="border border-gray-200 rounded-md p-3.5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                                <span className="text-xs font-semibold text-blue-800">Total Tagihan:</span>
                                <span className="text-lg font-bold text-blue-700">{formatIDR(transaction.amount)}</span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Nominal Yang Dibayar (IDR)</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                    <input 
                                        type="number" 
                                        value={nominalBayar}
                                        onChange={(e) => setNominalBayar(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-base font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            {nominalBayar && (
                                <div className="p-2 rounded bg-gray-50 border border-gray-200 flex justify-between items-center text-xs">
                                    <span className="text-gray-600 font-medium">Kembalian:</span>
                                    <span className={`font-bold ${kembalian < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {kembalian < 0 ? 'Nominal Kurang' : formatIDR(kembalian)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleProcessPayment}
                            disabled={!nominalBayar || kembalian < 0 || isActivating}
                            className="w-full py-2 bg-blue-600 disabled:opacity-50 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                            {isActivating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Konfirmasi Pembayaran
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProsesPembayaranPage;
