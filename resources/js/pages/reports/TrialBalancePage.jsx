import React, { useState } from 'react';
import { useGetTrialBalanceQuery } from '../../store/reportApi';
import { 
    Scale, 
    Calendar, 
    Download, 
    Printer,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

const TrialBalancePage = () => {
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const { data: tbRes, isLoading } = useGetTrialBalanceQuery({ end_date: endDate });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const data = tbRes?.data || [];
    const meta = tbRes?.meta || { total_debit: 0, total_credit: 0 };
    const isBalanced = Math.abs(meta.total_debit - meta.total_credit) < 1;

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Neraca Saldo (Trial Balance)</h2>
                    <p className="text-xs text-gray-500">Cek keseimbangan debit & kredit seluruh akun per tanggal tertentu</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors">
                        <Printer size={14} />
                        Cetak Laporan
                    </button>
                </div>
            </div>

            {/* Filter & Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Per Tanggal</span>
                    <input 
                        type="date" 
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 space-y-0.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Total Debit</span>
                    <p className="text-base font-bold text-gray-900">{formatIDR(meta.total_debit)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 space-y-0.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">Total Kredit</span>
                    <p className="text-base font-bold text-gray-900">{formatIDR(meta.total_credit)}</p>
                </div>
                <div className={`border rounded-md p-2.5 flex items-center justify-between ${
                    isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block">Status Neraca</span>
                        <span className="text-xs font-bold">{isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG'}</span>
                    </div>
                    {isBalanced ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                </div>
            </div>

            {/* Trial Balance Table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            <tr className="text-xs font-semibold text-gray-700">
                                <th className="px-3.5 py-2.5">Kode Akun</th>
                                <th className="px-3.5 py-2.5">Nama Akun</th>
                                <th className="px-3.5 py-2.5 text-right">Debit</th>
                                <th className="px-3.5 py-2.5 text-right">Kredit</th>
                                <th className="px-3.5 py-2.5 text-right">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-3.5 py-10 text-center text-gray-400 text-xs">Memuat data neraca saldo...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-3.5 py-10 text-center text-gray-400 text-xs">Belum ada data transaksi</td>
                                </tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.coa_code} className="hover:bg-slate-50 transition-colors text-xs text-gray-800">
                                        <td className="px-3.5 py-2 font-mono text-blue-600 font-semibold">{row.coa_code}</td>
                                        <td className="px-3.5 py-2 font-medium">{row.coa_name}</td>
                                        <td className="px-3.5 py-2 text-right">{row.debit > 0 ? formatIDR(row.debit) : '-'}</td>
                                        <td className="px-3.5 py-2 text-right">{row.credit > 0 ? formatIDR(row.credit) : '-'}</td>
                                        <td className="px-3.5 py-2 font-bold text-gray-900 text-right">{formatIDR(row.balance)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-gray-200 font-bold text-xs text-gray-900">
                            <tr>
                                <td colSpan="2" className="px-3.5 py-2.5 uppercase text-[11px] text-gray-600">Total Keseluruhan</td>
                                <td className="px-3.5 py-2.5 text-right">{formatIDR(meta.total_debit)}</td>
                                <td className="px-3.5 py-2.5 text-right">{formatIDR(meta.total_credit)}</td>
                                <td className="px-3.5 py-2.5"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrialBalancePage;
