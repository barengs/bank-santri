import React, { useState, useEffect, useMemo } from 'react';
import { useGetRekapitulasiQuery } from '../../store/reportApi';
import { useGetProductsQuery } from '../../store/productApi';
import { useGetTransactionItemsQuery } from '../../store/transactionItemApi';
import { 
    FileText, 
    Calendar, 
    Printer, 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Layers,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const RekapitulasiPage = () => {
    const now = new Date();
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedTransactionItem, setSelectedTransactionItem] = useState('');
    const [category, setCategory] = useState('all');
    const [dateRange, setDateRange] = useState({
        start_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    // Kembali ke halaman 1 setiap kali filter berubah
    useEffect(() => {
        setPage(1);
    }, [selectedProduct, selectedTransactionItem, category, dateRange.start_date, dateRange.end_date]);

    const { data: productsRes } = useGetProductsQuery();
    const productsList = productsRes?.data || [];
    
    const { data: trxItemsRes } = useGetTransactionItemsQuery({ per_page: 100 });
    const rawTrxItems = trxItemsRes?.data?.data || trxItemsRes?.data || [];
    const transactionItemsList = [...rawTrxItems].sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));

    const { data: rekapRes, isLoading, isFetching } = useGetRekapitulasiQuery({
        product_id: selectedProduct || undefined,
        transaction_item_id: selectedTransactionItem || undefined,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        category: category !== 'all' ? category : undefined,
        page,
        per_page: perPage
    });

    const rekapData = rekapRes?.data;
    const summary = rekapData?.summary || {
        total_accounts: 0,
        total_balance: 0,
        total_masuk: 0,
        total_keluar: 0,
        net_change: 0
    };
    const products = rekapData?.products || [];
    const trxPag = rekapData?.transactions;
    const transactions = trxPag?.data || [];

    // Meta pagination backend (Laravel paginator)
    const trxMeta = useMemo(() => ({
        current_page: trxPag?.current_page || 1,
        last_page: trxPag?.last_page || 1,
        per_page: trxPag?.per_page || perPage,
        from: trxPag?.from || 0,
        to: trxPag?.to || 0,
        total: trxPag?.total || 0,
    }), [trxPag, perPage]);

    const handleChangePage = (newPage) => {
        if (newPage < 1 || newPage > trxMeta.last_page) return;
        setPage(newPage);
        // Scroll mulus ke tabel rincian transaksi
        document.getElementById('rincian-transaksi-tabel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const handlePrintPdf = () => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (token) params.append('token', token);
        if (selectedProduct) params.append('product_id', selectedProduct);
        if (dateRange.start_date) params.append('start_date', dateRange.start_date);
        if (dateRange.end_date) params.append('end_date', dateRange.end_date);
        if (category && category !== 'all') params.append('category', category);
        if (selectedTransactionItem) params.append('transaction_item_id', selectedTransactionItem);

        const url = `/api/reports/rekapitulasi/print?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-5 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Rekapitulasi Produk Bank & Transaksi</h2>
                    <p className="text-xs text-gray-500">Laporan rekapitulasi dana nasabah per produk bank dan rincian transaksi</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handlePrintPdf}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-none transition-colors"
                        title="Cetak Laporan Rekapitulasi ke format PDF resmi beserta kolom tanda tangan"
                    >
                        <Printer size={14} />
                        Cetak PDF
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>Filter Laporan Rekapitulasi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Produk Bank */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">Produk Bank</label>
                        <select 
                            value={selectedProduct}
                            onChange={(e) => { setSelectedProduct(e.target.value); setPage(1); }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 cursor-pointer"
                        >
                            <option value="">Semua Produk Bank</option>
                            {productsList.map(p => (
                                <option key={p.id} value={p.id}>{p.product_name} ({p.product_code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Rincian Transaksi */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">Rincian Transaksi</label>
                        <select 
                            value={selectedTransactionItem}
                            onChange={(e) => { setSelectedTransactionItem(e.target.value); setPage(1); }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 cursor-pointer"
                        >
                            <option value="">Semua Rincian Transaksi</option>
                            {transactionItemsList.map(item => (
                                <option key={item.id} value={item.id}>{item.item_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Rentang Tanggal Mulai */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">Dari Tanggal</label>
                        <input 
                            type="date"
                            value={dateRange.start_date}
                            onChange={(e) => { setDateRange(prev => ({ ...prev, start_date: e.target.value })); setPage(1); }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
                        />
                    </div>

                    {/* Rentang Tanggal Selesai */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">Sampai Tanggal</label>
                        <input 
                            type="date"
                            value={dateRange.end_date}
                            onChange={(e) => { setDateRange(prev => ({ ...prev, end_date: e.target.value })); setPage(1); }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
                        />
                    </div>

                    {/* Arus Kas / Kategori Transaksi */}
                    <div>
                        <label className="text-[11px] font-semibold text-gray-600 block mb-1">Arus Transaksi</label>
                        <select 
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 cursor-pointer"
                        >
                            <option value="all">Semua Arus Transaksi</option>
                            <option value="credit">Dana Masuk (Kredit)</option>
                            <option value="debit">Dana Keluar (Debit)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Saldo */}
                <div className="border border-blue-200 rounded-md p-3 bg-blue-50/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Total Simpanan</span>
                        <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-base font-black text-blue-900 mt-1">{formatIDR(summary.total_balance)}</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">{summary.total_accounts} Rekening Aktif</p>
                </div>

                {/* Dana Masuk */}
                <div className="border border-emerald-200 rounded-md p-3 bg-emerald-50/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Total Dana Masuk</span>
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-base font-black text-emerald-700 mt-1">{formatIDR(summary.total_masuk)}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Setoran & Top-up periode ini</p>
                </div>

                {/* Dana Keluar */}
                <div className="border border-rose-200 rounded-md p-3 bg-rose-50/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Total Dana Keluar</span>
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-base font-black text-rose-700 mt-1">{formatIDR(summary.total_keluar)}</p>
                    <p className="text-[10px] text-rose-600 mt-0.5">Penarikan & Belanja santri</p>
                </div>

                {/* Net Change */}
                <div className="border border-indigo-200 rounded-md p-3 bg-indigo-50/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Perubahan Bersih</span>
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className={`text-base font-black mt-1 ${summary.net_change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {summary.net_change >= 0 ? '+' : ''}{formatIDR(summary.net_change)}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">Arus kas bersih periode ini</p>
                </div>
            </div>

            {/* Section 1: Rekapitulasi per Produk Bank */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        I. Rekapitulasi Dana per Produk Bank
                    </h3>
                </div>

                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-center w-12">No</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">Kode</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">Nama Produk Bank</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-center">Rekening</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-right">Dana Masuk</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-right">Dana Keluar</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-right">Saldo Saat Ini</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-6 text-gray-400">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                                            Memuat data rekapitulasi...
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-6 text-gray-400">
                                            Tidak ada data produk bank yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {products.map((p, idx) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 text-center text-gray-500 font-medium">{idx + 1}</td>
                                                <td className="px-3 py-2 font-mono font-bold text-gray-700">{p.product_code}</td>
                                                <td className="px-3 py-2 font-semibold text-gray-900">{p.product_name}</td>
                                                <td className="px-3 py-2 text-center font-mono font-medium text-gray-700">{p.total_accounts}</td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">{formatIDR(p.total_credit)}</td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-rose-600">{formatIDR(p.total_debit)}</td>
                                                <td className="px-3 py-2 text-right font-mono font-black text-gray-900">{formatIDR(p.total_balance)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-100 font-bold border-t border-gray-300">
                                            <td colSpan="3" className="px-3 py-2 text-right uppercase text-gray-700">Total:</td>
                                            <td className="px-3 py-2 text-center font-mono text-gray-900">{summary.total_accounts}</td>
                                            <td className="px-3 py-2 text-right font-mono text-emerald-700">{formatIDR(summary.total_masuk)}</td>
                                            <td className="px-3 py-2 text-right font-mono text-rose-700">{formatIDR(summary.total_keluar)}</td>
                                            <td className="px-3 py-2 text-right font-mono text-gray-900">{formatIDR(summary.total_balance)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Section 2: Rincian Transaksi */}
            <div id="rincian-transaksi-tabel" className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        II. Rincian Transaksi & Mutasi (Periode Terpilih)
                        {isFetching && !isLoading && (
                            <span className="flex items-center gap-1 text-[11px] font-normal normal-case text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Memperbarui data...
                            </span>
                        )}
                    </h3>
                    <div className="text-[11px] text-gray-500 font-medium">
                        Total {trxMeta.total.toLocaleString('id-ID')} transaksi ditemukan
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-md overflow-hidden relative">
                    <div className={`overflow-x-auto transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-center w-12">No</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">Waktu</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">No. Referensi</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">Rekening / Santri</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">Produk</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-center">Arus</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase text-right">Nominal</th>
                                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8 text-gray-400">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                                            Memuat rincian transaksi...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-6 text-gray-400">
                                            Tidak ada rincian transaksi pada periode yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((trx, idx) => {
                                        const itemIndex = ((trxMeta.current_page - 1) * trxMeta.per_page) + idx + 1;
                                        return (
                                            <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 text-center text-gray-500 font-medium">{itemIndex}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                                                    {new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-blue-600 font-medium">{trx.reference_number || '-'}</td>
                                                <td className="px-3 py-2">
                                                    <span className="font-bold text-gray-900 block">{trx.customer_name}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{trx.account_number}</span>
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">{trx.product_name}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {trx.type === 'credit' ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            MASUK
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                                            KELUAR
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-bold">
                                                    <span className={trx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {trx.type === 'credit' ? '+' : '-'}{formatIDR(trx.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-gray-600 text-[11px] max-w-xs truncate" title={trx.description}>
                                                    {trx.description || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="px-3.5 py-2.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="text-xs text-gray-500">
                                Menampilkan {trxMeta.total > 0 ? trxMeta.from : 0} - {trxMeta.to} dari {trxMeta.total} entri
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>Tampilkan:</span>
                                <select 
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    {[10, 25, 50, 100].map((size) => (
                                        <option key={size} value={size}>{size} / hal</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleChangePage(trxMeta.current_page - 1)}
                                disabled={trxMeta.current_page <= 1 || isLoading || isFetching}
                                className="p-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                title="Halaman sebelumnya"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex items-center gap-1 mx-1.5 text-xs">
                                 <span className="font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                                    {trxMeta.current_page}
                                 </span>
                                 <span className="text-gray-400">/</span>
                                 <span className="text-gray-600">
                                    {trxMeta.last_page}
                                 </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleChangePage(trxMeta.current_page + 1)}
                                disabled={trxMeta.current_page >= trxMeta.last_page || isLoading || isFetching}
                                className="p-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                title="Halaman berikutnya"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RekapitulasiPage;
