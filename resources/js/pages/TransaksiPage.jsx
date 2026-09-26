import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    Plus, 
    MoreHorizontal, 
    Eye, 
    Printer, 
    FileSpreadsheet,
    ArrowRightCircle,
    ChevronDown,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetTransactionsQuery } from '../store/transactionApi';
import DataTable from '../components/DataTable';

const TransaksiPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [channel, setChannel] = useState('');

    const { data: transRes, isLoading } = useGetTransactionsQuery({
        page,
        search,
        status,
        channel,
        per_page: perPage
    });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'created_at',
            header: 'Tanggal',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">{new Date(row.original.created_at).toLocaleDateString('id-ID')}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(row.original.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})}</span>
                </div>
            )
        },
        {
            accessorKey: 'destination_account',
            header: 'Rekening Tujuan',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-indigo-600 font-mono tracking-tighter">
                        {row.original.destination_account || '-'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {row.original.destination_account_name || 'System / Cash'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'Deskripsi',
            cell: ({ row }) => (
                <div className="flex flex-col max-w-[200px]">
                    <span className="text-xs font-bold text-gray-700 truncate">{row.original.description}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase truncate">Ref: {row.original.reference_number}</span>
                </div>
            )
        },
        {
            accessorKey: 'channel',
            header: 'Channel',
            cell: ({ row }) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm shadow-blue-50">
                    {row.original.channel}
                </span>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Jumlah',
            cell: ({ row }) => (
                <span className="text-sm font-black text-gray-900">
                    {formatIDR(row.original.amount)}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const s = row.original.status;
                const config = {
                    success: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
                    pending: { bg: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock },
                    failed: { bg: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
                    reversed: { bg: 'bg-slate-50 text-slate-600 border-slate-100', icon: AlertCircle },
                }[s] || { bg: 'bg-gray-50 text-gray-600 border-gray-100', icon: AlertCircle };

                return (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${config.bg}`}>
                        <config.icon className="w-3 h-3" />
                        {s}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <button 
                    onClick={() => navigate(`/transaksi/${row.original.id}`)}
                    className="px-2 py-0.5 border border-blue-400 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                    <Eye className="w-3 h-3" />
                    Detail
                </button>
            )
        }
    ], [navigate]);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Card Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-100">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Informasi Transaksi Bank</h1>
                    <p className="text-xs text-gray-500">Daftar riwayat seluruh transaksi perbankan dan mutasi.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-xs font-medium transition-colors">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        Ekspor Excel
                    </button>
                    <button 
                        onClick={() => navigate('/topup')}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#007bff] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-none transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Transaksi
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Cari deskripsi, nominal, atau referensi..." 
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                    />
                </div>

                <div className="w-36">
                    <select 
                        value={channel}
                        onChange={(e) => {
                            setChannel(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 cursor-pointer"
                    >
                        <option value="">Semua Channel</option>
                        <option value="teller">Teller</option>
                        <option value="system">Sistem</option>
                        <option value="api">API External</option>
                    </select>
                </div>

                <div className="w-36">
                    <select 
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 cursor-pointer"
                    >
                        <option value="">Semua Status</option>
                        <option value="success">Success</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <DataTable 
                columns={columns}
                data={transRes?.data?.data || []}
                isLoading={isLoading}
                meta={transRes?.data}
                onPageChange={setPage}
                onRowClick={(row) => navigate(`/transaksi/${row.id}`)}
                hideSearch={true}
                perPage={perPage}
                onPerPageChange={(newSize) => {
                    setPerPage(newSize);
                    setPage(1);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
            />
        </div>
    );
};

export default TransaksiPage;
