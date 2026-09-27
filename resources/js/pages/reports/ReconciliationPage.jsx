import React from 'react';
import { useGetReconciliationQuery } from '../../store/reportApi';
import { 
    CheckCircle2, 
    AlertTriangle, 
    RefreshCw, 
    Users, 
    BookOpen, 
    Scale,
    ShieldCheck,
    Printer,
    FileText
} from 'lucide-react';

const ReconciliationPage = () => {
    const { data: reconRes, isLoading, isFetching, refetch } = useGetReconciliationQuery();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const data = reconRes?.data;
    const subLedger = data?.sub_ledger;
    const gl = data?.general_ledger;
    const recon = data?.reconciliation;
    const isBalanced = recon?.is_balanced;

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Rekonsiliasi Tabungan Santri</h2>
                    <p className="text-xs text-gray-500">Pencocokan saldo rekening nasabah (Sub-Ledger) dengan akun buku besar GL 2100</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => refetch()}
                        disabled={isLoading || isFetching}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                        Sinkronkan Ulang
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <Printer size={14} />
                        Cetak Berita Acara
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-md border flex items-center justify-between ${
                isBalanced 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
                <div className="flex items-center gap-3">
                    {isBalanced ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0" />
                    )}
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider block">
                            {isBalanced ? 'STATUS: SINKRON & SEIMBANG (100% MATCH)' : 'STATUS: DITEMUKAN SELISIH PEMBUKUAN'}
                        </span>
                        <p className="text-xs mt-0.5 opacity-90">
                            {isBalanced 
                                ? 'Total uang tabungan santri yang ada di data rekening perbankan sama persis dengan pencatatan akuntansi di buku besar.' 
                                : 'Terdapat perbedaan antara akumulasi tabungan pada akun santri dengan saldo kewajiban di buku besar. Diperlukan audit transaksi.'}
                        </p>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Selisih Saldo</span>
                    <span className={`text-base font-bold ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatIDR(recon?.difference || 0)}
                    </span>
                </div>
            </div>

            {/* Comparative Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sub-Ledger Card */}
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 text-blue-700 rounded">
                                <Users size={16} />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Sub-Ledger Nasabah (Rekening)</h3>
                                <p className="text-[10px] text-gray-500">Akumulasi saldo fisik dari seluruh tabungan santri</p>
                            </div>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                            Tabel Accounts
                        </span>
                    </div>

                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600">Total Rekening Santri Aktif:</span>
                            <span className="font-semibold text-gray-900">{subLedger?.total_accounts || 0} Rekening</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600">Waktu Audit Sistem:</span>
                            <span className="font-mono text-gray-600 text-[11px]">{subLedger?.last_updated || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="font-bold text-gray-700 uppercase text-[11px]">Total Saldo Tabungan:</span>
                            <span className="text-base font-bold text-gray-900">{formatIDR(subLedger?.total_balance)}</span>
                        </div>
                    </div>
                </div>

                {/* General Ledger Card */}
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded">
                                <BookOpen size={16} />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Buku Besar Akuntansi (GL)</h3>
                                <p className="text-[10px] text-gray-500">Saldo akun kewajiban 2100 (Tabungan Santri)</p>
                            </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                            COA 2100
                        </span>
                    </div>

                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600">Total Kredit (Dana Masuk/Setor):</span>
                            <span className="font-semibold text-emerald-700">{formatIDR(gl?.total_credit)}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600">Total Debit (Dana Keluar/Tarik):</span>
                            <span className="font-semibold text-rose-700">({formatIDR(gl?.total_debit)})</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="font-bold text-gray-700 uppercase text-[11px]">Saldo Akhir Kewajiban:</span>
                            <span className="text-base font-bold text-gray-900">{formatIDR(gl?.total_balance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Notes & Guidelines */}
            <div className="p-3.5 bg-slate-50 border border-gray-200 rounded-md space-y-2 text-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5 uppercase text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Panduan Audit Keuangan Santri
                </span>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-[11px] leading-relaxed">
                    <li>Akun <strong>2100 (Tabungan Santri)</strong> merupakan liabilitas/titipan wadiah pesantren kepada santri yang harus bernilai sama persis dengan total saldo tabungan di buku tabungan masing-masing santri.</li>
                    <li>Jika terjadi selisih, pastikan seluruh transaksi di kasir teller maupun potongan belanja koperasi telah menghasilkan jurnal entri otomatis di buku besar.</li>
                    <li>Laporan rekonsiliasi ini wajib dicetak secara berkala saat tutup buku bulanan sebagai berita acara verifikasi kas & tabungan.</li>
                </ul>
            </div>
        </div>
    );
};

export default ReconciliationPage;
