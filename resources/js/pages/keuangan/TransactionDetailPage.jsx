import React, { useState } from 'react';
import { 
    ArrowLeft, 
    Printer, 
    Calendar, 
    Hash, 
    CreditCard, 
    AlertCircle, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ShieldCheck, 
    Info,
    ArrowRightCircle,
    User,
    Banknote,
    RotateCcw,
    Loader2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetTransactionDetailQuery, useReverseTransactionMutation } from '../../store/transactionApi';
import { printReceiptPdf } from '../../utils/reportPdf';
import { toast } from 'react-toastify';

const TransactionDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: transRes, isLoading, refetch } = useGetTransactionDetailQuery(id);
    const [reverseTransaction, { isLoading: isReversing }] = useReverseTransactionMutation();
    
    // Reversal Modal State
    const [showReverseModal, setShowReverseModal] = useState(false);
    const [reverseReason, setReverseReason] = useState('');
    const [reverseError, setReverseError] = useState('');

    const data = transRes?.data;

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const renderAccountInfo = (account, fallback) => {
        if (!account) return <p className="text-xs font-semibold text-gray-800">{fallback}</p>;
        
        if (typeof account === 'object') {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-gray-800">{account.account_number}</span>
                    <span className="text-[11px] text-gray-500">{account.customer_name}</span>
                </div>
            );
        }
        
        return <p className="text-xs font-semibold text-gray-800">{account}</p>;
    };

    const handleReverse = async () => {
        if (!reverseReason.trim()) {
            setReverseError('Alasan reversal wajib diisi');
            return;
        }

        try {
            await reverseTransaction({ 
                id, 
                reason: reverseReason.trim() 
            }).unwrap();
            
            toast.success('Transaksi berhasil di-reverse');
            setShowReverseModal(false);
            setReverseReason('');
            setReverseError('');
            refetch();
        } catch (err) {
            const msg = err?.data?.message || 'Gagal melakukan reversal';
            setReverseError(msg);
            toast.error(msg);
        }
    };

    const openReverseModal = () => {
        setReverseReason('');
        setReverseError('');
        setShowReverseModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white border border-gray-200 rounded-md p-6 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="text-sm font-bold text-gray-800">Transaksi Tidak Ditemukan</h3>
                <button onClick={() => navigate('/transaksi')} className="text-blue-600 font-semibold text-xs hover:underline">
                    Kembali ke Daftar Transaksi
                </button>
            </div>
        );
    }

    const statusConfig = {
        success: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        failed: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
        reversed: { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle },
    }[data.status] || { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle };

    const canReverse = data.status === 'success';

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/transaksi')}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 border border-gray-200 transition-colors"
                        title="Kembali"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-base font-bold text-gray-800">Detail Transaksi</h2>
                        <p className="text-xs text-gray-500 font-mono">Ref: {data.reference_number || data.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/transaksi')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Kembali
                    </button>
                    {canReverse && (
                        <button 
                            onClick={openReverseModal}
                            disabled={isReversing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 disabled:bg-rose-400"
                        >
                            {isReversing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            Reverse
                        </button>
                    )}
                    {data.status === 'pending' && (
                        <button 
                            onClick={() => navigate(`/proses-pembayaran?ref=${data.reference_number}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            Bayar di Kasir
                        </button>
                    )}
                    <button 
                        onClick={() => printReceiptPdf(data, 'BUKTI TRANSAKSI')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak PDF
                    </button>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-2.5 bg-gray-50">
                    <DetailRow label="ID Transaksi" value={data.id} isMono />
                    <DetailRow label="Nomor Referensi" value={data.reference_number || '-'} isBold />
                    <DetailRow 
                        label="Tipe Transaksi" 
                        value={
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-200 uppercase">
                                {data.transaction_type?.name || 'Manual'}
                            </span>
                        } 
                    />
                    <DetailRow label="Deskripsi" value={data.description} />
                    <DetailRow 
                        label="Jumlah Nominal" 
                        value={<span className="text-base font-bold text-blue-700">{formatIDR(data.amount)}</span>} 
                    />
                    <DetailRow 
                        label="Status" 
                        value={
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${statusConfig.bg}`}>
                                <statusConfig.icon className="w-3 h-3" />
                                {data.status}
                            </div>
                        } 
                    />
                </div>

                {/* Right Side */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-2.5 bg-gray-50">
                    <DetailRow label="Channel Pembayaran" value={data.channel} isUpper />
                    
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Informasi Rekening</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white border border-gray-200 p-2 rounded">
                                <span className="text-[10px] text-gray-400 block uppercase">Sumber</span>
                                {renderAccountInfo(data.source_account, 'Pihak Luar / Kas')}
                            </div>
                            <div className="bg-white border border-gray-200 p-2 rounded">
                                <span className="text-[10px] text-gray-400 block uppercase">Tujuan</span>
                                {renderAccountInfo(data.destination_account, 'System / Fee')}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 space-y-2">
                        <DetailRow 
                            label="Tanggal Transaksi" 
                            value={new Date(data.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'} 
                        />
                        <DetailRow 
                            label="Terakhir Diperbarui" 
                            value={new Date(data.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'} 
                        />
                    </div>
                </div>
            </div>

            {/* Reversal Info Banner */}
            {data.status === 'reversed' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                        Transaksi ini telah di-reverse (dibatalkan). Saldo telah dikembalikan dan jurnal telah dibalik.
                    </p>
                </div>
            )}

            {/* Reverse Modal */}
            {showReverseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                                <RotateCcw className="w-4 h-4" />
                                <span>Reverse Transaksi</span>
                            </div>
                            <button 
                                onClick={() => setShowReverseModal(false)} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Tindakan ini akan membatalkan transaksi, mengembalikan saldo, dan membalik jurnal. 
                                    Transaksi yang sudah di-reverse tidak dapat dikembalikan lagi.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700 block">
                                    Alasan Reversal <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={reverseReason}
                                    onChange={(e) => setReverseReason(e.target.value)}
                                    placeholder="Contoh: Kesalahan input nominal oleh teller, seharusnya Rp 800.000..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all text-gray-900 resize-none"
                                />
                                {reverseError && (
                                    <p className="text-[11px] text-rose-600 font-medium">{reverseError}</p>
                                )}
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nominal yang akan direverse</span>
                                    <span className="font-bold text-gray-800">{formatIDR(data.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nomor Referensi</span>
                                    <span className="font-mono text-gray-600">{data.reference_number || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => setShowReverseModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReverse}
                                disabled={isReversing || !reverseReason.trim()}
                                className="px-4 py-2 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isReversing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Ya, Reverse Transaksi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value, isMono, isBold, isUpper }) => (
    <div className="flex flex-col gap-0.5 border-b border-gray-200/60 pb-1.5 last:border-0 last:pb-0">
        <span className="text-[10px] font-semibold text-gray-400 uppercase">{label}</span>
        <div className={`text-xs ${isMono ? 'font-mono text-blue-700' : isBold ? 'font-bold text-gray-800' : isUpper ? 'uppercase font-semibold text-gray-700' : 'text-gray-700'}`}>
            {value}
        </div>
    </div>
);

export default TransactionDetailPage;
