import React, { useState } from 'react';
import { useGetTrialBalanceQuery } from '../../store/reportApi';
import { 
    Scale, 
    Calendar, 
    Download, 
    Printer,
    ArrowRightCircle,
    Info
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

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Neraca Saldo</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        Trial Balance Report
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
                        <Printer size={14} />
                        CETAK LAPORAN
                    </button>
                </div>
            </div>

            {/* Filter & Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-start gap-3">
                        <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                            Neraca saldo menampilkan ringkasan total debit, kredit, dan saldo akhir dari setiap akun COA untuk memastikan keseimbangan pembukuan.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 flex flex-col justify-center gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="grid grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Debit</p>
                            <p className="text-2xl font-black text-white">{formatIDR(meta.total_debit)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Kredit</p>
                            <p className="text-2xl font-black text-white">{formatIDR(meta.total_credit)}</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800 relative z-10">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            Math.abs(meta.total_debit - meta.total_credit) < 1 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                            <ArrowRightCircle size={12} />
                            {Math.abs(meta.total_debit - meta.total_credit) < 1 ? 'BALANCE / SEIMBANG' : 'UNBALANCED / TIDAK SEIMBANG'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trial Balance Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kode Akun</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Akun</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Debit</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Kredit</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Saldo Akhir</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Memuat data...</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Belum ada data transaksi</td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.coa_code} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-mono font-bold text-indigo-600">{row.coa_code}</td>
                                    <td className="px-6 py-4 text-xs font-black text-slate-700">{row.coa_name}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600 text-right">{row.debit > 0 ? formatIDR(row.debit) : '-'}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600 text-right">{row.credit > 0 ? formatIDR(row.credit) : '-'}</td>
                                    <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatIDR(row.balance)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black">
                        <tr>
                            <td colSpan="2" className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500">TOTAL KESELURUHAN</td>
                            <td className="px-6 py-4 text-xs text-slate-900 text-right">{formatIDR(meta.total_debit)}</td>
                            <td className="px-6 py-4 text-xs text-slate-900 text-right">{formatIDR(meta.total_credit)}</td>
                            <td className="px-6 py-4"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default TrialBalancePage;
