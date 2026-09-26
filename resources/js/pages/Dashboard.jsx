import React, { useMemo } from 'react';
import { 
    Users, 
    Wallet, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Package, 
    Receipt, 
    ShieldCheck, 
    ShoppingCart, 
    Settings, 
    CreditCard,
    TrendingUp,
    TrendingDown,
    Banknote,
    Clock,
    Plus,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { useGetDashboardSummaryQuery } from '../store/dashboardApi';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const { data: summaryRes, isLoading } = useGetDashboardSummaryQuery();
    const stats = summaryRes?.data;

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const quickAccess = [
        { name: 'PROSES PEMBAYARAN', path: '/proses-pembayaran', icon: Receipt, color: 'bg-blue-600' },
        { name: 'KASIR KOPERASI', path: '/koperasi', icon: ShoppingCart, color: 'bg-indigo-600' },
        { name: 'PAKET PEMBAYARAN', path: '/paket-pembayaran', icon: Package, color: 'bg-emerald-600' },
        { name: 'VERIFIKASI TOP-UP', path: '/verifikasi-topup', icon: TrendingUp, color: 'bg-amber-600' },
        { name: 'DAFTAR REKENING', path: '/nasabah', icon: Users, color: 'bg-slate-700' },
        { name: 'PENGATURAN SISTEM', path: '/konfigurasi', icon: Settings, color: 'bg-rose-600' },
    ];

    const chartData = useMemo(() => {
        if (!stats?.chart_7days) return [];
        return stats.chart_7days.map(item => ({
            date: new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            Masuk: Number(item.total_credit),
            Keluar: Number(item.total_debit)
        }));
    }, [stats]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                <StatCard 
                    title="Total Rekening Aktif"
                    value={stats?.rekening?.total_aktif || 0}
                    subtext="Rekening santri terdaftar"
                    icon={Users}
                    variant="indigo"
                />
                <StatCard 
                    title="Total Saldo Mengendap"
                    value={formatIDR(stats?.rekening?.total_saldo)}
                    subtext={`${stats?.topup?.pending_count || 0} menunggu verifikasi`}
                    icon={Wallet}
                    variant="purple"
                    isCurrency
                />
                <StatCard 
                    title="Pembayaran Bulan Ini"
                    value={formatIDR(stats?.payment?.month_amount)}
                    subtext="Pendaftaran & paket rutin"
                    icon={Receipt}
                    variant="orange"
                    isCurrency
                />
                <StatCard 
                    title="Transaksi Koperasi"
                    value={formatIDR(stats?.koperasi?.today_amount)}
                    subtext={`${stats?.koperasi?.today_count || 0} transaksi hari ini`}
                    icon={ShoppingCart}
                    variant="pink"
                    isCurrency
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-4 rounded-md border border-gray-200 shadow-none space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">Tren Transaksi (7 Hari Terakhir)</h3>
                            <p className="text-xs text-gray-500">Perbandingan aliran dana masuk (Top-up) dan keluar (Debit/Koperasi)</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
                                <span>Masuk</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                                <span>Keluar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 11, fill: '#64748b'}}
                                    dy={5}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 11, fill: '#64748b'}}
                                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                    formatter={(val) => formatIDR(val)}
                                />
                                <Area type="monotone" dataKey="Masuk" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMasuk)" />
                                <Area type="monotone" dataKey="Keluar" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorKeluar)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Access Grid */}
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-none space-y-3">
                    <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-sm font-bold text-gray-800">Akses Cepat</h3>
                        <p className="text-xs text-gray-500">Pintasan modul transaksi harian</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        {quickAccess.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className="group p-2.5 bg-gray-50 border border-gray-200 rounded-md flex flex-col items-center justify-center text-center gap-2 hover:bg-white hover:border-blue-300 transition-colors"
                            >
                                <div className={`p-2 rounded ${item.color} text-white`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-semibold text-gray-700 tracking-wider uppercase leading-tight">
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Recent Activity Table */}
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-none space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">Pengajuan Top-Up Terakhir</h3>
                        <p className="text-xs text-gray-500">Status verifikasi top-up saldo terbaru</p>
                    </div>
                    <button 
                        onClick={() => navigate('/verifikasi-topup')} 
                        className="border border-blue-400 text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                        Lihat Semua
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
                
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            <tr className="text-xs font-semibold text-gray-600">
                                <th className="px-3.5 py-2">Nasabah</th>
                                <th className="px-3.5 py-2">Nominal</th>
                                <th className="px-3.5 py-2">Channel</th>
                                <th className="px-3.5 py-2">Status</th>
                                <th className="px-3.5 py-2">No. Referensi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(!stats?.recent_topups || stats.recent_topups.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-3.5 py-6 text-center text-xs text-gray-400">
                                        Belum ada pengajuan top-up
                                    </td>
                                </tr>
                            ) : (
                                stats.recent_topups.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3.5 py-2">
                                            <div className="font-semibold text-gray-800 text-xs">{row.account?.customer_name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{row.account_number}</div>
                                        </td>
                                        <td className="px-3.5 py-2 font-bold text-gray-900 text-xs">{formatIDR(row.amount)}</td>
                                        <td className="px-3.5 py-2">
                                            <span className="text-[10px] font-medium uppercase text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                {row.channel}
                                            </span>
                                        </td>
                                        <td className="px-3.5 py-2">
                                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                                row.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                                                row.status === 'waiting_verification' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                                                'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {row.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-3.5 py-2 text-[11px] font-mono text-gray-500">{row.payment_ref}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtext, icon: Icon, variant }) => {
    const iconColors = {
        indigo: 'bg-blue-50 text-blue-600 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        orange: 'bg-amber-50 text-amber-600 border-amber-200',
        pink: 'bg-rose-50 text-rose-600 border-rose-200',
    };

    return (
        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-none space-y-2 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{title}</span>
                <div className={`p-1.5 rounded border ${iconColors[variant] || 'bg-gray-50 text-gray-600'}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {value}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{subtext}</p>
            </div>
        </div>
    );
};

export default Dashboard;
