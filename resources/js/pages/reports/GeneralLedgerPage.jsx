import React, { useState, useMemo } from 'react';
import { useGetGeneralLedgerQuery } from '../../store/reportApi';
import { useGetCoaTreeQuery } from '../../store/coaApi';
import DataTable from '../../components/DataTable';
import { 
    BookOpen, 
    Calendar, 
    Download, 
    Printer, 
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet
} from 'lucide-react';
import { printGeneralLedgerPdf } from '../../utils/reportPdf';

const GeneralLedgerPage = () => {
    const [selectedCoa, setSelectedCoa] = useState('1101');
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const { data: coaTreeRes } = useGetCoaTreeQuery();
    const { data: ledgerRes, isLoading, isFetching } = useGetGeneralLedgerQuery({
        coa_code: selectedCoa,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
    });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    // Flatten COA accounts for selector
    const coaList = useMemo(() => {
        const list = [];
        const traverse = (items) => {
            if (!Array.isArray(items)) return;
            items.forEach((item) => {
                list.push({
                    coa_code: item.coa_code,
                    account_name: item.account_name,
                    account_type: item.account_type,
                });
                if (item.children && item.children.length > 0) {
                    traverse(item.children);
                }
            });
        };
        traverse(coaTreeRes?.data || []);
        return list;
    }, [coaTreeRes]);

    const ledgerData = ledgerRes?.data;
    const accountInfo = ledgerData?.account;
    const summary = ledgerData?.summary || {
        opening_balance: 0,
        total_debit_period: 0,
        total_credit_period: 0,
        closing_balance: 0
    };
    const entries = ledgerData?.entries || [];

    const handlePrint = () => {
        printGeneralLedgerPdf(accountInfo, entries, summary, dateRange);
    };

    const handleExportCSV = () => {
        if (!entries.length) return;
        const headers = ['Tanggal', 'No Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo'];
        const rows = entries.map(e => [
            new Date(e.date).toLocaleDateString('id-ID'),
            `"${e.reference_number || '-'}"`,
            `"${(e.description || '').replace(/"/g, '""')}"`,
            e.debit,
            e.credit,
            e.balance
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `buku_besar_${selectedCoa}_${dateRange.start_date}_${dateRange.end_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = useMemo(() => [
        {
            header: 'TANGGAL',
            accessorKey: 'date',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800">
                        {new Date(row.original.date).toLocaleDateString('id-ID')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(row.original.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                </div>
            )
        },
        {
            header: 'NO. REF',
            accessorKey: 'reference_number',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-blue-600 font-medium">
                    {row.original.reference_number || '-'}
                </span>
            )
        },
        {
            header: 'KETERANGAN',
            accessorKey: 'description',
            cell: ({ row }) => (
                <span className="text-xs text-gray-800 leading-snug">
                    {row.original.description}
                </span>
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
        },
        {
            header: 'SALDO AKUMULASI',
            accessorKey: 'balance',
            cell: ({ row }) => (
                <span className="text-xs font-bold text-gray-900">
                    {formatIDR(row.original.balance)}
                </span>
            )
        }
    ], []);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Buku Besar (General Ledger)</h2>
                    <p className="text-xs text-gray-500">Mutasi detail dan pergerakan saldo per akun perkiraan (COA)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Printer size={14} />
                        Cetak Laporan
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <Download size={14} />
                        Ekspor CSV
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gray-50 border border-gray-200 p-2.5 rounded-md text-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 min-w-[260px]">
                        <span className="text-gray-600 font-semibold uppercase text-[11px] shrink-0">Pilih Akun:</span>
                        <select
                            className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500 flex-1 font-medium"
                            value={selectedCoa}
                            onChange={(e) => setSelectedCoa(e.target.value)}
                        >
                            {coaList.map((item) => (
                                <option key={item.coa_code} value={item.coa_code}>
                                    {item.coa_code} - {item.account_name} ({item.account_type})
                                </option>
                            ))}
                        </select>
                    </div>

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
                        onClick={() => {
                            const first = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                            const today = new Date().toISOString().split('T')[0];
                            setDateRange({ start_date: first, end_date: today });
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Bulan Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const firstYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
                            const today = new Date().toISOString().split('T')[0];
                            setDateRange({ start_date: firstYear, end_date: today });
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Tahun Ini
                    </button>
                </div>
            </div>

            {/* Account Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Saldo Awal</span>
                        <Wallet size={14} className="text-gray-400" />
                    </div>
                    <p className="text-base font-bold text-gray-800">{formatIDR(summary.opening_balance)}</p>
                    <span className="text-[10px] text-gray-400">Sebelum {dateRange.start_date}</span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between text-emerald-600 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Mutasi Debit</span>
                        <ArrowUpRight size={14} />
                    </div>
                    <p className="text-base font-bold text-gray-800">{formatIDR(summary.total_debit_period)}</p>
                    <span className="text-[10px] text-emerald-600">Total debit periode ini</span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between text-rose-600 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Mutasi Kredit</span>
                        <ArrowDownLeft size={14} />
                    </div>
                    <p className="text-base font-bold text-gray-800">{formatIDR(summary.total_credit_period)}</p>
                    <span className="text-[10px] text-rose-600">Total kredit periode ini</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center justify-between text-blue-700 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Saldo Akhir</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                            {accountInfo?.normal_balance || 'Normal'}
                        </span>
                    </div>
                    <p className="text-base font-bold text-blue-900">{formatIDR(summary.closing_balance)}</p>
                    <span className="text-[10px] text-blue-600">Per tanggal {dateRange.end_date}</span>
                </div>
            </div>

            {/* Entries Table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-800">
                            Buku Pembukuan: {accountInfo?.coa_code} - {accountInfo?.account_name}
                        </span>
                        <span className="text-[11px] text-gray-500 ml-2">
                            ({entries.length} entri transaksi tercatat)
                        </span>
                    </div>
                </div>

                <DataTable 
                    columns={columns}
                    data={entries}
                    isLoading={isLoading || isFetching}
                    placeholder="Cari transaksi dalam buku besar ini..."
                    pageSizeOptions={[20, 50, 100]}
                />
            </div>
        </div>
    );
};

export default GeneralLedgerPage;
