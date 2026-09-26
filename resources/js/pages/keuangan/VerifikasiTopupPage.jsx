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
        per_page: 15
    });

    const [verify, { isLoading: isVerifying }] = useVerifyTopUpMutation();
    const [reject, { isLoading: isRejecting }] = useRejectTopUpMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleVerify = async (id) => {
        if (window.confirm('Verifikasi dan tambahkan saldo ke rekening santri ini?')) {
            try {
                await verify({ id }).unwrap();
                toast.success('Top-up berhasil diverifikasi!');
            } catch (err) {
                toast.error('Gagal verifikasi: ' + (err.data?.message || 'Terjadi kesalahan'));
            }
        }
    };

    const handleReject = async (id) => {
        const notes = window.prompt('Alasan penolakan?');
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
                    <span className="font-semibold text-gray-800 text-xs">{row.original.account?.customer_name || 'N/A'}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{row.original.account_number}</span>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Nominal',
            cell: ({ row }) => (
                <span className="font-bold text-gray-900 text-xs">
                    {formatIDR(row.original.amount)}
                </span>
            )
        },
        {
            accessorKey: 'payment_proof',
            header: 'Bukti Transfer',
            cell: ({ row }) => row.original.payment_proof ? (
                <a 
                    href={`/storage/${row.original.payment_proof}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                    <div className="w-8 h-8 bg-gray-50 rounded border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                            src={`/storage/${row.original.payment_proof}`} 
                            alt="Bukti" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span>Lihat</span>
                </a>
            ) : <span className="text-gray-400 text-xs">-</span>
        },
        {
            accessorKey: 'created_at',
            header: 'Waktu Pengajuan',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs text-gray-700">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
                    <span className="text-[10px] text-gray-400">{new Date(row.original.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} WIB</span>
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Aksi Verifikasi',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    {row.original.status === 'waiting_verification' ? (
                        <>
                            <button 
                                onClick={() => handleVerify(row.original.id)}
                                disabled={isVerifying}
                                className="border border-emerald-400 text-emerald-700 hover:bg-emerald-50 rounded px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                {isVerifying ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Setujui'}
                            </button>
                            <button 
                                onClick={() => handleReject(row.original.id)}
                                disabled={isRejecting}
                                className="border border-rose-300 text-rose-700 hover:bg-rose-50 rounded px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                {isRejecting ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Tolak'}
                            </button>
                        </>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            row.original.status === 'success' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {row.original.status}
                        </span>
                    )}
                </div>
            )
        }
    ], [isVerifying, isRejecting]);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header & Status Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Verifikasi Top-Up Saldo</h2>
                    <p className="text-xs text-gray-500">Persetujuan pengajuan setoran transfer bank dari wali santri</p>
                </div>
                
                <div className="inline-flex bg-gray-100 p-0.5 rounded-md text-xs">
                    <button 
                        onClick={() => setStatus('waiting_verification')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            status === 'waiting_verification' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Menunggu Verifikasi
                    </button>
                    <button 
                        onClick={() => setStatus('success')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            status === 'success' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Selesai Diverifikasi
                    </button>
                </div>
            </div>

            {/* Notice */}
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-md flex items-start gap-2 text-xs text-amber-800">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                    Pastikan dana transfer telah masuk ke rekening giro/bank penampungan pesantren sebelum menyetujui (Approve) transaksi top-up.
                </p>
            </div>

            {/* Table */}
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
