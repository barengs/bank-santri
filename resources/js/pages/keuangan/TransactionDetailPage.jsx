import React from 'react';
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
    Banknote
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetTransactionDetailQuery } from '../../store/transactionApi';

const TransactionDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: transRes, isLoading } = useGetTransactionDetailQuery(id);
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
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak
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
