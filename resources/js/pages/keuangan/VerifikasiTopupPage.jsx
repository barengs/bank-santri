import React, { useMemo, useState } from 'react';
import { 
    ShieldCheck, 
    Clock, 
    CheckCircle, 
    XCircle, 
    ExternalLink, 
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import { 
    useGetTopUpRequestsQuery, 
    useVerifyTopUpMutation, 
    useRejectTopUpMutation 
} from '../../store/topUpApi';
import DataTable from '../../components/DataTable';
import { toast } from 'react-toastify';

const VerifikasiTopupPage = () => {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('waiting_verification');

    const { data: topUpRes, isLoading } = useGetTopUpRequestsQuery({
        page,
        status,
        per_page: 10
    });

    const [verify, { isLoading: isVerifying }] = useVerifyTopUpMutation();
    const [reject, { isLoading: isRejecting }] = useRejectTopUpMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleVerify = async (id) => {
        if (confirm('Verifikasi dan tambahkan saldo ke rekening santri ini?')) {
            try {
                await verify({ id }).unwrap();
                toast.success('Top-up berhasil diverifikasi!');
            } catch (err) {
                toast.error('Gagal verifikasi: ' + (err.data?.message || 'Terjadi kesalahan'));
            }
        }
    };

    const handleReject = async (id) => {
        const notes = prompt('Alasan penolakan?');
        if (notes !== null) {
            try {
                await reject({ id, notes }).unwrap();
                toast.success('Top-up berhasil ditolak.');
            } catch (err) {
                toast.error('Gagal menolak: ' + (err.data?.message || 'Terjadi kesalahan'));
            }
        }
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'account.customer_name',
            header: 'Nasabah',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-gray-900">{row.original.account?.customer_name || 'N/A'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.original.account_number}</span>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Nominal',
            cell: ({ row }) => (
                <span className="font-black text-indigo-600">
                    {formatIDR(row.original.amount)}
                </span>
            )
        },
        {
            accessorKey: 'payment_proof',
            header: 'Bukti',
            cell: ({ row }) => (
                <a 
                    href={`/storage/${row.original.payment_proof}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 font-bold transition-all"
                >
                    <div className="w-10 h-10 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center overflow-hidden">
                        <img 
                            src={`/storage/${row.original.payment_proof}`} 
                            alt="Bukti" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <ImageIcon className="w-4 h-4 text-gray-300 absolute" />
                    </div>
                    <span className="text-[10px] uppercase tracking-tighter">View</span>
                </a>
            )
        },
        {
            accessorKey: 'created_at',
            header: 'Waktu Pengajuan',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(row.original.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} WIB</span>
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Aksi Verifikasi',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleVerify(row.original.id)}
                        disabled={isVerifying || row.original.status !== 'waiting_verification'}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase hover:bg-emerald-100 transition-all disabled:opacity-30"
                    >
                        {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve
                    </button>
                    <button 
                        onClick={() => handleReject(row.original.id)}
                        disabled={isRejecting || row.original.status !== 'waiting_verification'}
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black uppercase hover:bg-rose-100 transition-all disabled:opacity-30"
                    >
                        {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Tolak
                    </button>
                </div>
            )
        }
    ], [isVerifying, isRejecting]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Verifikasi Top-up</h1>
                    <p className="text-sm text-gray-400 font-medium font-bold uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Verification Workflow
                    </p>
                </div>
                
                {/* Status Filter */}
                <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
                    <button 
                        onClick={() => setStatus('waiting_verification')}
                        className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all ${status === 'waiting_verification' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                    >
                        Menunggu
                    </button>
                    <button 
                        onClick={() => setStatus('success')}
                        className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all ${status === 'success' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                    >
                        Selesai
                    </button>
                </div>
            </div>

            {/* Warning for Admin */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-bold leading-relaxed">
                    Mohon teliti dalam memeriksa bukti transfer sebelum melakukan persetujuan. Pastikan saldo sudah masuk ke rekening penampungan bank pesantren sebelum menekan tombol Approve.
                </p>
            </div>

            {/* Main Table */}
            <DataTable 
                columns={columns}
                data={topUpRes?.data?.data || []}
                isLoading={isLoading}
                meta={topUpRes?.data}
                onPageChange={setPage}
                placeholder="Cari berdasarkan nama nasabah..."
            />
        </div>
    );
};

export default VerifikasiTopupPage;
