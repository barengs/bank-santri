import React, { useState } from 'react';
import { useGetProfitLossQuery, useGetBalanceSheetQuery } from '../../store/reportApi';
import { 
    FileText, 
    Calendar, 
    Download, 
    Printer,
    TrendingUp,
    Briefcase,
    PieChart,
    ChevronRight
} from 'lucide-react';

const FinancialStatementPage = () => {
    const [activeTab, setActiveTab] = useState('pl'); // pl or bs
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const { data: plRes, isLoading: isLoadingPL } = useGetProfitLossQuery(dateRange);
    const { data: bsRes, isLoading: isLoadingBS } = useGetBalanceSheetQuery({ end_date: dateRange.end_date });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const pl = plRes?.data;
    const bs = bsRes?.data;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Keuangan</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-indigo-600" />
                        Financial Statements & Performance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
                        <Download size={14} />
                        DOWNLOAD PDF
                    </button>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periode Awal</label>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periode Akhir</label>
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
                <div className="flex bg-slate-100 p-1 rounded-lg h-10">
                    <button 
                        onClick={() => setActiveTab('pl')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pl' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Laba Rugi
                    </button>
                    <button 
                        onClick={() => setActiveTab('bs')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Neraca
                    </button>
                </div>
            </div>

            {activeTab === 'pl' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Revenue */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    Pendapatan / Revenue
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {pl?.revenue?.map((item) => (
                                    <div key={item.coa_code} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{item.coa_name}</span>
                                            <span className="text-[9px] font-mono text-slate-400">{item.coa_code}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800">{formatIDR(item.balance)}</span>
                                    </div>
                                ))}
                                {pl?.revenue?.length === 0 && (
                                    <div className="px-6 py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada data pendapatan</div>
                                )}
                            </div>
                            <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Total Pendapatan</span>
                                <span className="text-sm font-black text-emerald-600">{formatIDR(pl?.total_revenue || 0)}</span>
                            </div>
                        </div>

                        {/* Expense */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-rose-500" />
                                    Beban / Expenses
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {pl?.expense?.map((item) => (
                                    <div key={item.coa_code} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{item.coa_name}</span>
                                            <span className="text-[9px] font-mono text-slate-400">{item.coa_code}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800">{formatIDR(Math.abs(item.balance))}</span>
                                    </div>
                                ))}
                                {pl?.expense?.length === 0 && (
                                    <div className="px-6 py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada data beban</div>
                                )}
                            </div>
                            <div className="px-6 py-4 bg-rose-50 border-t border-rose-100 flex items-center justify-between">
                                <span className="text-xs font-black text-rose-800 uppercase tracking-widest">Total Beban</span>
                                <span className="text-sm font-black text-rose-600">({formatIDR(pl?.total_expense || 0)})</span>
                            </div>
                        </div>
                    </div>

                    {/* P&L Summary Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 rounded-2xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <TrendingUp className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Laba / Rugi Bersih</p>
                                <h2 className={`text-3xl font-black ${pl?.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatIDR(pl?.net_profit || 0)}
                                </h2>
                            </div>
                            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Margin Laba</p>
                                    <p className="text-xs font-black text-white">
                                        {pl?.total_revenue > 0 ? ((pl.net_profit / pl.total_revenue) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efisiensi</p>
                                    <p className="text-xs font-black text-white">
                                        {pl?.total_revenue > 0 ? (100 - (pl.total_expense / pl.total_revenue) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Assets */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aktiva (Aset)</h3>
                        </div>
                        <div className="flex-1 divide-y divide-slate-50">
                            {bs?.assets?.map((item) => (
                                <div key={item.coa_code} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{item.coa_name}</span>
                                        <span className="text-[9px] font-mono text-slate-400">{item.coa_code}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-800">{formatIDR(item.balance)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-800 uppercase tracking-widest">Total Aktiva</span>
                            <span className="text-sm font-black text-indigo-600">{formatIDR(bs?.total_assets || 0)}</span>
                        </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pasiva (Liabilitas & Ekuitas)</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                <div className="px-4 py-2 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Liabilitas</div>
                                {bs?.liabilities?.map((item) => (
                                    <div key={item.coa_code} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{item.coa_name}</span>
                                            <span className="text-[9px] font-mono text-slate-400">{item.coa_code}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800">{formatIDR(item.balance)}</span>
                                    </div>
                                ))}
                                <div className="px-4 py-2 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ekuitas</div>
                                {bs?.equity?.map((item) => (
                                    <div key={item.coa_code} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{item.coa_name}</span>
                                            <span className="text-[9px] font-mono text-slate-400">{item.coa_code}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800">{formatIDR(item.balance)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 bg-indigo-900 border-t border-indigo-950 flex items-center justify-between text-white">
                                <span className="text-xs font-black uppercase tracking-widest">Total Pasiva</span>
                                <span className="text-sm font-black">{formatIDR((bs?.total_liabilities || 0) + (bs?.total_equity || 0))}</span>
                            </div>
                        </div>

                        {/* Balance Check */}
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${
                            Math.abs((bs?.total_assets || 0) - ((bs?.total_liabilities || 0) + (bs?.total_equity || 0))) < 1
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : 'bg-rose-50 border-rose-100 text-rose-800'
                        }`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">Status Keseimbangan Neraca</span>
                            <span className="text-xs font-black">
                                {Math.abs((bs?.total_assets || 0) - ((bs?.total_liabilities || 0) + (bs?.total_equity || 0))) < 1 ? 'BALANCE / SEIMBANG' : 'TIDAK SEIMBANG'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialStatementPage;
