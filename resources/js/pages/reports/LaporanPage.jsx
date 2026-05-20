import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FileText, 
    Scale, 
    TrendingUp, 
    PieChart, 
    ChevronRight,
    ArrowUpRight,
    BookOpen,
    Users,
    Wallet
} from 'lucide-react';

const LaporanPage = () => {
    const reportCategories = [
        {
            title: 'Pencatatan Keuangan',
            description: 'Log detail setiap transaksi dan entri jurnal akuntansi.',
            items: [
                {
                    name: 'Jurnal Umum',
                    icon: <FileText className="text-indigo-600" />,
                    path: '/laporan/jurnal',
                    detail: 'Daftar semua entri jurnal (debit/kredit) kronologis.'
                },
                {
                    name: 'Buku Besar',
                    icon: <BookOpen className="text-indigo-600" />,
                    path: '/laporan/jurnal', // For now redirect to journal
                    detail: 'Rekap mutasi per akun COA.'
                }
            ]
        },
        {
            title: 'Laporan Konsolidasi',
            description: 'Ringkasan performa dan posisi keuangan pesantren.',
            items: [
                {
                    name: 'Neraca Saldo',
                    icon: <Scale className="text-amber-600" />,
                    path: '/laporan/neraca-saldo',
                    detail: 'Cek keseimbangan debit & kredit seluruh akun.'
                },
                {
                    name: 'Laba Rugi',
                    icon: <TrendingUp className="text-emerald-600" />,
                    path: '/laporan/keuangan',
                    detail: 'Monitor pendapatan, beban, dan laba bersih.'
                },
                {
                    name: 'Neraca',
                    icon: <PieChart className="text-rose-600" />,
                    path: '/laporan/keuangan',
                    detail: 'Posisi Aset, Liabilitas, dan Ekuitas saat ini.'
                }
            ]
        },
        {
            title: 'Laporan Perbankan',
            description: 'Data spesifik simpanan santri dan mutasi nasabah.',
            items: [
                {
                    name: 'Mutasi Rekening',
                    icon: <Users className="text-sky-600" />,
                    path: '/mutasi',
                    detail: 'Cetak buku tabungan atau riwayat per santri.'
                },
                {
                    name: 'Rekap Saldo Tabungan',
                    icon: <Wallet className="text-purple-600" />,
                    path: '/nasabah',
                    detail: 'Total simpanan santri per produk tabungan.'
                }
            ]
        }
    ];

    return (
        <div className="p-6 space-y-12">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pusat Laporan</h1>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Financial Reporting Center</p>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {reportCategories.map((category, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">{category.title}</h2>
                            <p className="text-xs text-slate-400 font-medium">{category.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.items.map((item, itemIdx) => (
                                <Link 
                                    key={itemIdx} 
                                    to={item.path}
                                    className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={16} className="text-indigo-600" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                            {React.cloneElement(item.icon, { size: 24 })}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-black text-slate-800 tracking-tight">{item.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                {item.detail}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Tip */}
            <div className="bg-slate-900 rounded-2xl p-8 flex items-center justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="space-y-2 relative z-10">
                    <h4 className="text-white font-black tracking-tight">Butuh laporan khusus?</h4>
                    <p className="text-slate-400 text-xs">Anda dapat mengekspor data ke Excel untuk pengolahan lebih lanjut di luar sistem.</p>
                </div>
                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all relative z-10">
                    Hubungi IT
                </button>
            </div>
        </div>
    );
};

export default LaporanPage;
