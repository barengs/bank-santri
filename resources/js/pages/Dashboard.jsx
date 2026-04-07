import React from 'react';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { useGetSummaryQuery } from '../store/dashboardApi';

const Dashboard = () => {
    const { data: summaryRes, isLoading, error } = useGetSummaryQuery();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const summary = summaryRes?.data;

    const stats = [
        { 
            label: 'Nasabah Aktif', 
            value: summary?.rekening?.total_aktif || 0, 
            trend: 'Total Rekening', 
            isUp: true, 
            icon: Users, 
            color: 'indigo' 
        },
        { 
            label: 'Total Saldo Tabungan', 
            value: formatIDR(summary?.rekening?.total_saldo || 0), 
            trend: 'Dana Terkelola', 
            isUp: true, 
            icon: Wallet, 
            color: 'emerald' 
        },
        { 
            label: 'Top-up Hari Ini', 
            value: formatIDR(summary?.topup?.today_amount || 0), 
            trend: `${summary?.topup?.pending_count || 0} Pending`, 
            isUp: summary?.topup?.pending_count === 0, 
            icon: TrendingUp, 
            color: 'sky' 
        },
        { 
            label: 'Pembayaran Bulan Ini', 
            value: formatIDR(summary?.payment?.month_amount || 0), 
            trend: 'Laporan Bulanan', 
            isUp: true, 
            icon: TrendingDown, 
            color: 'rose' 
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Perbankan</h1>
                    <p className="text-sm text-gray-500">Ringkasan aktivitas bank santri secara real-time.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    SISTEM ONLINE
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                        <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
                        <div className={`mt-4 flex items-center gap-1 text-[11px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Grafik Transaksi 7 Hari Terakhir</h3>
                    <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        {summary?.chart_7days?.length > 0 ? (
                            <div className="w-full h-full p-4 flex items-end justify-between gap-2">
                                {summary.chart_7days.map((day, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full flex flex-col-reverse gap-1">
                                            <div 
                                                className="w-full bg-indigo-500 rounded-t-md transition-all duration-500 hover:bg-indigo-600"
                                                style={{ height: `${Math.min(day.total_credit / 10000, 150)}px` }}
                                            ></div>
                                            <div 
                                                className="w-full bg-rose-400 rounded-t-md transition-all duration-500 hover:bg-rose-500"
                                                style={{ height: `${Math.min(day.total_debit / 10000, 150)}px` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 rotate-45 mt-2">{day.date.split('-').slice(1).reverse().join('/')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Belum ada data mutasi mingguan</p>
                        )}
                    </div>
                    <div className="mt-6 flex justify-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Kredit (Masuk)
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <span className="w-3 h-3 bg-rose-400 rounded-sm"></span> Debit (Keluar)
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Top-up Terbaru</h3>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">Live</span>
                    </div>
                    <div className="space-y-4">
                        {summary?.recent_topups?.length > 0 ? (
                            summary.recent_topups.map((topup) => (
                                <div key={topup.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black ${
                                        topup.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {topup.payment_method === 'cash' ? 'CASH' : 'TRF'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                            {topup.account?.customer_name || 'Nasabah'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            {new Date(topup.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{formatIDR(topup.amount)}</p>
                                        <p className={`text-[9px] font-bold uppercase ${
                                            topup.status === 'success' ? 'text-emerald-500' : 'text-amber-500'
                                        }`}>
                                            {topup.status.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-sm text-gray-400">Belum ada top-up terbaru</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
