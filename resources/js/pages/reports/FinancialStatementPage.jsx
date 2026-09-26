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
    CheckCircle,
    AlertCircle
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
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Laporan Keuangan Pesantren</h2>
                    <p className="text-xs text-gray-500">Laporan Laba Rugi dan Neraca Keuangan Konsolidasi</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors">
                        <Download size={14} />
                        Unduh PDF
                    </button>
                </div>
            </div>

            {/* Filter Bar & Tabs */}
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

                <div className="inline-flex bg-gray-200 p-0.5 rounded-md">
                    <button 
                        onClick={() => setActiveTab('pl')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            activeTab === 'pl' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Laba Rugi
                    </button>
                    <button 
                        onClick={() => setActiveTab('bs')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            activeTab === 'bs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Neraca
                    </button>
                </div>
            </div>

            {activeTab === 'pl' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Revenue */}
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                    Pendapatan / Revenue
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pl?.revenue?.map((item) => (
                                    <div key={item.coa_code} className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{item.coa_name}</span>
                                            <span className="text-[10px] font-mono text-gray-400">{item.coa_code}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{formatIDR(item.balance)}</span>
                                    </div>
                                ))}
                                {(!pl?.revenue || pl?.revenue?.length === 0) && (
                                    <div className="px-3.5 py-6 text-center text-xs text-gray-400">Tidak ada data pendapatan</div>
                                )}
                            </div>
                            <div className="px-3.5 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-800 uppercase">Total Pendapatan</span>
                                <span className="font-bold text-emerald-700">{formatIDR(pl?.total_revenue || 0)}</span>
                            </div>
                        </div>

                        {/* Expense */}
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5 text-rose-600" />
                                    Beban / Expenses
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pl?.expense?.map((item) => (
                                    <div key={item.coa_code} className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{item.coa_name}</span>
                                            <span className="text-[10px] font-mono text-gray-400">{item.coa_code}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{formatIDR(Math.abs(item.balance))}</span>
                                    </div>
                                ))}
                                {(!pl?.expense || pl?.expense?.length === 0) && (
                                    <div className="px-3.5 py-6 text-center text-xs text-gray-400">Tidak ada data beban</div>
                                )}
                            </div>
                            <div className="px-3.5 py-2 bg-rose-50 border-t border-rose-100 flex items-center justify-between text-xs">
                                <span className="font-bold text-rose-800 uppercase">Total Beban</span>
                                <span className="font-bold text-rose-700">({formatIDR(pl?.total_expense || 0)})</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3 text-center">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Laba / Rugi Bersih</span>
                            <h2 className={`text-2xl font-bold ${pl?.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatIDR(pl?.net_profit || 0)}
                            </h2>
                            <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white border border-gray-200 p-2 rounded">
                                    <span className="text-[10px] text-gray-400 block uppercase">Margin Laba</span>
                                    <span className="font-semibold text-gray-800">
                                        {pl?.total_revenue > 0 ? ((pl.net_profit / pl.total_revenue) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="bg-white border border-gray-200 p-2 rounded">
                                    <span className="text-[10px] text-gray-400 block uppercase">Efisiensi</span>
                                    <span className="font-semibold text-gray-800">
                                        {pl?.total_revenue > 0 ? (100 - (pl.total_expense / pl.total_revenue) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Assets */}
                    <div className="border border-gray-200 rounded-md overflow-hidden flex flex-col">
                        <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-200">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Aktiva (Aset)</h3>
                        </div>
                        <div className="flex-1 divide-y divide-gray-100">
                            {bs?.assets?.map((item) => (
                                <div key={item.coa_code} className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">{item.coa_name}</span>
                                        <span className="text-[10px] font-mono text-gray-400">{item.coa_code}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{formatIDR(item.balance)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-3.5 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-800 uppercase">Total Aktiva</span>
                            <span className="font-bold text-blue-700">{formatIDR(bs?.total_assets || 0)}</span>
                        </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div className="space-y-4">
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-200">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pasiva (Liabilitas & Ekuitas)</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                <div className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Liabilitas</div>
                                {bs?.liabilities?.map((item) => (
                                    <div key={item.coa_code} className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{item.coa_name}</span>
                                            <span className="text-[10px] font-mono text-gray-400">{item.coa_code}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{formatIDR(item.balance)}</span>
                                    </div>
                                ))}
                                <div className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ekuitas</div>
                                {bs?.equity?.map((item) => (
                                    <div key={item.coa_code} className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{item.coa_name}</span>
                                            <span className="text-[10px] font-mono text-gray-400">{item.coa_code}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{formatIDR(item.balance)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-3.5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-800 uppercase">Total Pasiva</span>
                                <span className="font-bold text-gray-900">{formatIDR((bs?.total_liabilities || 0) + (bs?.total_equity || 0))}</span>
                            </div>
                        </div>

                        {/* Balance Check */}
                        <div className={`p-3 rounded-md border flex items-center justify-between text-xs ${
                            Math.abs((bs?.total_assets || 0) - ((bs?.total_liabilities || 0) + (bs?.total_equity || 0))) < 1
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                            <span className="font-medium uppercase text-[11px]">Keseimbangan Neraca</span>
                            <span className="font-bold">
                                {Math.abs((bs?.total_assets || 0) - ((bs?.total_liabilities || 0) + (bs?.total_equity || 0))) < 1 ? 'BALANCE (SEIMBANG)' : 'TIDAK SEIMBANG'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialStatementPage;
