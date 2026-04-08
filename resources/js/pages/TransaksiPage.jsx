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
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [channel, setChannel] = useState('');

    const { data: transRes, isLoading } = useGetTransactionsQuery({
        page,
        search,
        status,
        channel,
        per_page: 10
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
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all group"
                >
                    <MoreHorizontal className="w-4 h-4 group-hover:scale-110" />
                </button>
            )
        }
    ], [navigate]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Transaksi</h1>
                <p className="text-sm text-gray-400 font-medium">Kelola semua transaksi di bank santri.</p>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cari Data</label>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari deskripsi, nominal, atau referensi..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By Tipe</label>
                    <div className="relative">
                        <select 
                            value={channel}
                            onChange={(e) => setChannel(e.target.value)}
                            className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-600 appearance-none font-bold"
                        >
                            <option value="">Semua Channel</option>
                            <option value="teller">Teller</option>
                            <option value="system">Sistem</option>
                            <option value="api">API External</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By Status</label>
                    <div className="relative">
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-600 appearance-none font-bold"
                        >
                            <option value="">Semua Status</option>
                            <option value="success">Success</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-md text-sm font-black text-gray-600 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </button>
                    <button 
                        onClick={() => navigate('/topup')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Data
                    </button>
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
                placeholder="Data transaksi tidak ditemukan..."
            />
        </div>
    );
};

export default TransaksiPage;
