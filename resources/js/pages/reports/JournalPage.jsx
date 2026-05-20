import React, { useState, useMemo } from 'react';
import { useGetJournalQuery } from '../../store/reportApi';
import DataTable from '../../components/DataTable';
import { FileText, Calendar, Filter, Download, Printer } from 'lucide-react';

const JournalPage = () => {
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const { data: journalRes, isLoading, isFetching } = useGetJournalQuery({
        page,
        ...dateRange
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
            header: 'WAKTU',
            accessorKey: 'transaction.created_at',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-800">
                        {new Date(row.original.transaction?.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {new Date(row.original.transaction?.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            header: 'KETERANGAN / REF',
            accessorKey: 'description',
            cell: ({ row }) => (
                <div className="flex flex-col max-w-xs">
                    <span className="text-xs font-bold text-slate-700 leading-tight">{row.original.description}</span>
                    <span className="text-[9px] font-mono text-indigo-400 mt-1">REF: {row.original.transaction?.reference_number}</span>
                </div>
            )
        },
        {
            header: 'AKUN (COA)',
            accessorKey: 'coa_code',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">{row.original.coa?.coa_name}</span>
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest">{row.original.coa_code}</span>
                </div>
            )
        },
        {
            header: 'DEBIT',
            accessorKey: 'debit',
            cell: ({ row }) => (
                <span className={`text-xs font-black ${row.original.debit > 0 ? 'text-slate-800' : 'text-slate-200'}`}>
                    {row.original.debit > 0 ? formatIDR(row.original.debit) : '-'}
                </span>
            )
        },
        {
            header: 'KREDIT',
            accessorKey: 'credit',
            cell: ({ row }) => (
                <span className={`text-xs font-black ${row.original.credit > 0 ? 'text-slate-800' : 'text-slate-200'}`}>
                    {row.original.credit > 0 ? formatIDR(row.original.credit) : '-'}
                </span>
            )
        }
    ], []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Jurnal Umum</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        General Journal Entries
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-all">
                        <Printer size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                        <Download size={14} />
                        EKSPOR EXCEL
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mulai Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400"
                                value={dateRange.start_date}
                                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sampai Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400"
                                value={dateRange.end_date}
                                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
                <button className="px-6 py-2 bg-slate-800 text-white rounded-md text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 h-10">
                    <Filter size={14} />
                    Filter Jurnal
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns}
                    data={journalRes?.data?.data || []}
                    isLoading={isLoading || isFetching}
                    meta={journalRes?.data}
                    onPageChange={setPage}
                    placeholder="Cari jurnal..."
                />
            </div>
        </div>
    );
};

export default JournalPage;
