import React, { useState, useMemo } from 'react';
import {
    FileSpreadsheet,
    Printer,
    Search,
    Wallet,
    Users,
    Building2,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useGetAccountBalancesQuery, useLazyGetAccountBalancesQuery } from '../../store/reportApi';
import { useGetProductsQuery } from '../../store/productApi';
import { printAccountBalancesPdf } from '../../utils/reportPdf';
import { toast } from 'react-toastify';

const AccountBalancesPage = () => {
    const [search, setSearch] = useState('');
    const [productId, setProductId] = useState('');
    const [accountType, setAccountType] = useState('all');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    const { data: productsRes } = useGetProductsQuery();
    const products = useMemo(() => {
        const raw = productsRes?.data?.data || productsRes?.data || [];
        return Array.isArray(raw) ? raw : [];
    }, [productsRes]);

    const { data: res, isLoading, isFetching } = useGetAccountBalancesQuery({
        page,
        per_page: 25,
        search: search.trim() || undefined,
        product_id: productId || undefined,
        account_type: accountType !== 'all' ? accountType : undefined,
        status: status || undefined,
    });
    const [fetchAllBalances, { isFetching: isGeneratingPdf }] = useLazyGetAccountBalancesQuery();

    const accounts = res?.data?.data || [];
    const meta = res?.data || {};
    const summary = res?.summary || {
        total_accounts: 0,
        total_balance: 0,
        santri_count: 0,
        santri_balance: 0,
        instansi_count: 0,
        instansi_balance: 0,
    };

    const formatIDR = (val) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);

    const formatDateTime = (val) => {
        if (!val) return '-';
        const d = new Date(val.replace(' ', 'T'));
        if (Number.isNaN(d.getTime())) return val;
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    };

    const buildExportUrl = (endpoint) => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (token) params.append('token', token);
        if (search.trim()) params.append('search', search.trim());
        if (productId) params.append('product_id', productId);
        if (accountType !== 'all') params.append('account_type', accountType);
        if (status) params.append('status', status);
        return `/api/reports/account-balances/${endpoint}?${params.toString()}`;
    };

    const handleDownloadExcel = () => {
        window.open(buildExportUrl('export'), '_blank');
    };

    const handlePrintPdf = async () => {
        try {
            const allRes = await fetchAllBalances({
                all: 1,
                search: search.trim() || undefined,
                product_id: productId || undefined,
                account_type: accountType !== 'all' ? accountType : undefined,
                status: status || undefined,
            }).unwrap();

            const allAccounts = Array.isArray(allRes?.data) ? allRes.data : (allRes?.data?.data || []);
            const selectedProd = products.find((p) => String(p.id) === String(productId));

            printAccountBalancesPdf(allAccounts, allRes?.summary || summary, {
                productName: selectedProd?.product_name,
                accountTypeLabel:
                    accountType === 'santri'
                        ? 'Rekening Santri'
                        : accountType === 'instansi'
                        ? 'Rekening Instansi'
                        : 'Semua Rekening',
                status,
            });
        } catch (err) {
            toast.error('Gagal membuat PDF: ' + (err?.data?.message || err?.message || 'Terjadi kesalahan'));
        }
    };

    const startNumber = ((meta.current_page || 1) - 1) * (meta.per_page || 25);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Laporan Saldo Terkini Semua Rekening</h2>
                    <p className="text-xs text-gray-500">
                        Daftar saldo terkini seluruh rekening santri &amp; instansi beserta tanggal transaksi terakhir sebagai acuan mitigasi
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadExcel}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors"
                    >
                        <FileSpreadsheet size={14} />
                        Export Excel
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintPdf}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors"
                    >
                        {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                        {isGeneratingPdf ? 'Membuat PDF...' : 'Cetak PDF'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase">
                        <span>Total Rekening</span>
                        <Wallet className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-lg font-bold text-gray-800 mt-1">
                        {summary.total_accounts.toLocaleString('id-ID')}
                    </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 uppercase">
                        <span>Total Saldo Keseluruhan</span>
                        <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-blue-800 mt-1">
                        {formatIDR(summary.total_balance)}
                    </div>
                </div>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-md">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-sky-700 uppercase">
                        <span>Saldo Santri ({summary.santri_count})</span>
                        <Users className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="text-lg font-bold text-sky-800 mt-1">
                        {formatIDR(summary.santri_balance)}
                    </div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 uppercase">
                        <span>Saldo Instansi ({summary.instansi_count})</span>
                        <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-800 mt-1">
                        {formatIDR(summary.instansi_balance)}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari No. Rekening / Nama..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <select
                    value={productId}
                    onChange={(e) => {
                        setProductId(e.target.value);
                        setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                    <option value="">Semua Produk Bank</option>
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.product_name}
                        </option>
                    ))}
                </select>
                <select
                    value={accountType}
                    onChange={(e) => {
                        setAccountType(e.target.value);
                        setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                    <option value="all">Semua Jenis Rekening</option>
                    <option value="santri">Rekening Santri</option>
                    <option value="instansi">Rekening Instansi</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                    <option value="">Semua Status</option>
                    <option value="AKTIF">AKTIF</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                    <option value="TUTUP">TUTUP</option>
                </select>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px]">
                        <tr>
                            <th className="px-3 py-2.5 text-center w-12">No</th>
                            <th className="px-3 py-2.5">No. Rekening / NIS</th>
                            <th className="px-3 py-2.5">Nama Pemilik Rekening</th>
                            <th className="px-3 py-2.5 text-center">Jenis</th>
                            <th className="px-3 py-2.5">Produk Bank</th>
                            <th className="px-3 py-2.5 text-center">Status</th>
                            <th className="px-3 py-2.5 text-right">Saldo Terkini</th>
                            <th className="px-3 py-2.5 text-center">Tgl Transaksi Terakhir</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-blue-600" />
                                    Memuat data saldo rekening...
                                </td>
                            </tr>
                        ) : accounts.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                                    Tidak ada data rekening yang ditemukan.
                                </td>
                            </tr>
                        ) : (
                            accounts.map((acc, idx) => {
                                const isInstansi = Number(acc.customer_id) === 0;
                                return (
                                    <tr key={acc.account_number} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-center text-gray-500">
                                            {startNumber + idx + 1}
                                        </td>
                                        <td className="px-3 py-2 font-mono font-semibold text-gray-800">
                                            {acc.account_number}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-gray-800">
                                            {acc.customer_name || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                    isInstansi
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                {isInstansi ? 'Instansi' : 'Santri'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                            {acc.product_name || acc.product?.product_name || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                    acc.status === 'AKTIF'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {acc.status || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                            {formatIDR(acc.balance)}
                                        </td>
                                        <td className="px-3 py-2 text-center font-mono text-gray-600">
                                            {formatDateTime(acc.last_transaction_at)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                    <div>
                        Halaman <span className="font-semibold">{meta.current_page}</span> dari{' '}
                        <span className="font-semibold">{meta.last_page}</span> ({meta.total} rekening)
                        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2 text-blue-600" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Sebelumnya
                        </button>
                        <button
                            type="button"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                        >
                            Berikutnya
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountBalancesPage;
