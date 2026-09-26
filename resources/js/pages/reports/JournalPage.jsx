import React, { useState, useMemo } from 'react';
import { useGetJournalQuery } from '../../store/reportApi';
import DataTable from '../../components/DataTable';
import { FileText, Calendar, Download, Printer } from 'lucide-react';

const JournalPage = () => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const { data: journalRes, isLoading, isFetching } = useGetJournalQuery({
        page,
        per_page: perPage,
        ...(search ? { search } : {}),
        ...(dateRange.start_date ? { start_date: dateRange.start_date } : {}),
        ...(dateRange.end_date ? { end_date: dateRange.end_date } : {})
    });

    const setFilterToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setDateRange({ start_date: today, end_date: today });
        setPage(1);
    };

    const setFilterThisMonth = () => {
        const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        setDateRange({ start_date: firstDay, end_date: today });
        setPage(1);
    };

    const setFilterAll = () => {
        setDateRange({ start_date: '', end_date: '' });
        setPage(1);
    };

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
                    <span className="text-xs font-semibold text-gray-800">
                        {new Date(row.original.transaction?.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(row.original.transaction?.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                </div>
            )
        },
        {
            header: 'KETERANGAN / REF',
            accessorKey: 'description',
            cell: ({ row }) => (
                <div className="flex flex-col max-w-sm">
                    <span className="text-xs text-gray-800 leading-snug">{row.original.description}</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5">REF: {row.original.transaction?.reference_number}</span>
                </div>
            )
        },
        {
            header: 'AKUN (COA)',
            accessorKey: 'coa_code',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800">{row.original.coa?.account_name || row.original.coa?.coa_name || row.original.coa_code}</span>
                    <span className="text-[10px] font-mono text-gray-400">{row.original.coa_code}</span>
                </div>
            )
        },
        {
            header: 'DEBIT',
            accessorKey: 'debit',
            cell: ({ row }) => (
                <span className={`text-xs font-semibold ${row.original.debit > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                    {row.original.debit > 0 ? formatIDR(row.original.debit) : '-'}
                </span>
            )
        },
        {
            header: 'KREDIT',
            accessorKey: 'credit',
            cell: ({ row }) => (
                <span className={`text-xs font-semibold ${row.original.credit > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                    {row.original.credit > 0 ? formatIDR(row.original.credit) : '-'}
                </span>
            )
        }
    ], []);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header & Filter Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Jurnal Umum</h2>
                    <p className="text-xs text-gray-500">Pencatatan riwayat transaksi keuangan dan pembukuan akuntansi</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Printer size={14} />
                        Cetak
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors">
                        <Download size={14} />
                        Ekspor Excel
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 border border-gray-200 p-2.5 rounded-md text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium">Dari:</span>
                        <input 
                            type="date" 
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                            value={dateRange.start_date}
                            onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium">Sampai:</span>
                        <input 
                            type="date" 
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                            value={dateRange.end_date}
                            onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={setFilterThisMonth}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Bulan Ini
                    </button>
                    <button
                        type="button"
                        onClick={setFilterToday}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Hari Ini
                    </button>
                    <button
                        type="button"
                        onClick={setFilterAll}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Semua
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable 
                columns={columns}
                data={journalRes?.data?.data || []}
                isLoading={isLoading || isFetching}
                meta={journalRes?.data}
                onPageChange={setPage}
                perPage={perPage}
                onPerPageChange={(newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                }}
                onSearchChange={(q) => {
                    setSearch(q);
                    setPage(1);
                }}
                placeholder="Cari transaksi, ref, atau akun..."
            />
        </div>
    );
};

export default JournalPage;
