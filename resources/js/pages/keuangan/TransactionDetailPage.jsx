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
        if (!account) return <p className="text-sm font-black text-slate-800">{fallback}</p>;
        
        if (typeof account === 'object') {
            return (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 tracking-tighter">{account.account_number}</span>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{account.customer_name}</span>
                </div>
            );
        }
        
        return <p className="text-sm font-black text-slate-800">{account}</p>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 space-y-4">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto opacity-20" />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Transaksi Tidak Ditemukan</h3>
                <button onClick={() => navigate('/transaksi')} className="text-indigo-600 font-bold text-sm">Kembali ke Daftar</button>
            </div>
        );
    }

    const statusConfig = {
        success: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
        pending: { bg: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock },
        failed: { bg: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
        reversed: { bg: 'bg-slate-50 text-slate-600 border-slate-100', icon: AlertCircle },
    }[data.status] || { bg: 'bg-gray-50 text-gray-600 border-gray-100', icon: AlertCircle };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/transaksi')}
                        className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Detail Transaksi</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            {data.reference_number || 'Internal Reference'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-black text-gray-600 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>
                    {data.status === 'pending' && (
                        <button 
                            onClick={() => navigate(`/pembayaran/proses?ref=${data.reference_number}`)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <CreditCard className="w-4 h-4" />
                            Bayar di Kasir
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
                        <Printer className="w-4 h-4" />
                        Cetak
                    </button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left Side: Basic Info */}
                        <div className="space-y-6">
                            <DetailRow label="ID Transaksi" value={data.id} isMono />
                            <DetailRow label="No. Referensi" value={data.reference_number || '-'} isBold />
                            <DetailRow 
                                label="Tipe Transaksi" 
                                value={
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                        {data.transaction_type?.name || 'Manual Adjustment'}
                                    </span>
                                } 
                            />
                            <DetailRow label="Deskripsi" value={data.description} />
                            <DetailRow 
                                label="Jumlah" 
                                value={<span className="text-xl font-black text-indigo-600">{formatIDR(data.amount)}</span>} 
                            />
                            <DetailRow 
                                label="Status" 
                                value={
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusConfig.bg}`}>
                                        <statusConfig.icon className="w-3 h-3" />
                                        {data.status}
                                    </div>
                                } 
                            />
                        </div>

                        {/* Right Side: Account & Technical */}
                        <div className="space-y-6">
                            <DetailRow label="Channel" value={data.channel} isUpper />
                            
                            <div className="space-y-4 pt-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Informasi Rekening</label>
                                
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sumber</p>
                                                {renderAccountInfo(data.source_account, 'Pihak Luar / Cash')}
                                            </div>
                                        </div>
                                        {data.source_account && (
                                            <ArrowRightCircle className="w-6 h-6 text-indigo-200" />
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                                                <Banknote className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tujuan</p>
                                                {renderAccountInfo(data.destination_account, 'System / Fee')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DetailRow 
                                label="Tanggal Dibuat" 
                                value={new Date(data.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB'} 
                            />
                            <DetailRow 
                                label="Terakhir Diperbarui" 
                                value={new Date(data.updated_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB'} 
                            />
                        </div>
                    </div>

                    {/* Ledger Entries / Technical Info Section */}
                    {data.ledger_entries && data.ledger_entries.length > 0 && (
                        <div className="pt-10 border-t border-gray-50 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                <ShieldCheck className="w-4 h-4" />
                                Audit Proof Verified
                            </div>
                            <div className="w-full h-8 bg-gradient-to-r from-transparent via-gray-50 to-transparent"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, isMono, isBold, isUpper }) => (
    <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <div className={`text-sm tracking-tight ${isMono ? 'font-mono text-indigo-600 bg-slate-50 px-2 py-1 rounded w-fit' : isBold ? 'font-black text-slate-800' : isUpper ? 'uppercase font-black text-slate-700' : 'font-medium text-slate-600'}`}>
            {value}
        </div>
    </div>
);

export default TransactionDetailPage;
