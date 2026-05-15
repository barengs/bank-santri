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
    BarChart3
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
        { name: 'PROSES PEMBAYARAN', path: '/proses-pembayaran', icon: Receipt, color: 'bg-blue-600', hover: 'hover:bg-blue-700' },
        { name: 'KASIR KOPERASI', path: '/koperasi', icon: ShoppingCart, color: 'bg-indigo-600', hover: 'hover:bg-indigo-700' },
        { name: 'PAKET PEMBAYARAN', path: '/paket-pembayaran', icon: Package, color: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
        { name: 'VERIFIKASI TOP-UP', path: '/verifikasi-topup', icon: TrendingUp, color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
        { name: 'DAFTAR REKENING', path: '/nasabah', icon: Users, color: 'bg-slate-700', hover: 'hover:bg-slate-800' },
        { name: 'PENGATURAN SISTEM', path: '/konfigurasi', icon: Settings, color: 'bg-rose-600', hover: 'hover:bg-rose-700' },
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
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Rekening Aktif"
                    value={stats?.rekening?.total_aktif || 0}
                    subtext="REKENING SANTRI TERDAFTAR"
                    icon={Users}
                    variant="indigo"
                />
                <StatCard 
                    title="Total Saldo Mengendap"
                    value={formatIDR(stats?.rekening?.total_saldo)}
                    subtext={`${stats?.topup?.pending_count || 0} MENUNGGU VERIFIKASI`}
                    icon={Wallet}
                    variant="purple"
                    isCurrency
                />
                <StatCard 
                    title="Pembayaran Bulan Ini"
                    value={formatIDR(stats?.payment?.month_amount)}
                    subtext="TOTAL PENDAFTARAN & PAKET"
                    icon={Receipt}
                    variant="orange"
                    isCurrency
                />
                <StatCard 
                    title="Transaksi Koperasi"
                    value={formatIDR(stats?.koperasi?.today_amount)}
                    subtext={`${stats?.koperasi?.today_count || 0} TRANSAKSI HARI INI`}
                    icon={ShoppingCart}
                    variant="pink"
                    isCurrency
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-8 rounded-lg border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Tren Transaksi (7 Hari Terakhir)</h3>
                            <p className="text-sm text-gray-400 font-medium">Perbandingan aliran dana masuk (Top-up) dan keluar (Debit/Koperasi).</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                <span className="text-gray-900">Masuk</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span className="text-gray-900">Keluar</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}}
                                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(val) => formatIDR(val)}
                                />
                                <Area type="monotone" dataKey="Masuk" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorMasuk)" />
                                <Area type="monotone" dataKey="Keluar" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorKeluar)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Access Grid */}
                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Akses Cepat</h3>
                        <p className="text-sm text-gray-400 font-medium">Pintasan untuk manajemen harian.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {quickAccess.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className="group p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:border-gray-200 active:scale-95"
                            >
                                <div className={`p-3 rounded-md ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-slate-800 tracking-widest uppercase leading-tight">
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Recent Activity Mini-Table */}
            <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Top-up Terakhir</h3>
                        <p className="text-sm text-gray-400 font-medium">Status pengajuan top-up saldo terbaru.</p>
                    </div>
                    <button onClick={() => navigate('/verifikasi-topup')} className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                        Lihat Semua
                        <ArrowRightCircle className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <th className="pb-4">Nasabah</th>
                                <th className="pb-4">Nominal</th>
                                <th className="pb-4">Channel</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4">No. Referensi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats?.recent_topups?.map((row) => (
                                <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="font-bold text-gray-800 text-xs">{row.account?.customer_name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{row.account_number}</div>
                                    </td>
                                    <td className="py-4 font-black text-gray-900 text-xs">{formatIDR(row.amount)}</td>
                                    <td className="py-4">
                                        <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {row.channel}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                            row.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                                            row.status === 'waiting_verification' ? 'bg-orange-50 text-orange-600' : 
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            {row.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-tight">{row.payment_ref}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtext, icon: Icon, variant, isCurrency }) => {
    const variants = {
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        pink: 'bg-pink-50 text-pink-600',
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm space-y-4 hover:shadow-lg hover:shadow-slate-100 transition-all hover:translate-y-[-2px] group">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-md ${variants[variant]} transition-all group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Daily Report</div>
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 tracking-tight leading-tight">{title}</p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                    {value}
                </h2>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{subtext}</p>
            </div>
        </div>
    );
};

const ArrowRightCircle = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="m12 8 4 4-4 4"/>
    </svg>
);

export default Dashboard;
