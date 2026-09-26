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
                    icon: <FileText className="w-4 h-4 text-blue-600" />,
                    path: '/laporan/jurnal',
                    detail: 'Daftar semua entri jurnal (debit/kredit) kronologis.'
                },
                {
                    name: 'Buku Besar',
                    icon: <BookOpen className="w-4 h-4 text-blue-600" />,
                    path: '/laporan/jurnal',
                    detail: 'Rekap mutasi dan saldo per akun COA.'
                }
            ]
        },
        {
            title: 'Laporan Konsolidasi',
            description: 'Ringkasan performa dan posisi keuangan pesantren.',
            items: [
                {
                    name: 'Neraca Saldo',
                    icon: <Scale className="w-4 h-4 text-amber-600" />,
                    path: '/laporan/neraca-saldo',
                    detail: 'Cek keseimbangan debit & kredit seluruh akun.'
                },
                {
                    name: 'Laba Rugi',
                    icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
                    path: '/laporan/keuangan',
                    detail: 'Monitor pendapatan, beban operasional, dan laba bersih.'
                },
                {
                    name: 'Neraca Keuangan',
                    icon: <PieChart className="w-4 h-4 text-rose-600" />,
                    path: '/laporan/keuangan',
                    detail: 'Posisi Aktiva (Aset) dan Pasiva (Liabilitas & Ekuitas).'
                }
            ]
        },
        {
            title: 'Laporan Rekening & Mutasi',
            description: 'Data spesifik simpanan santri dan mutasi nasabah.',
            items: [
                {
                    name: 'Mutasi Rekening',
                    icon: <Users className="w-4 h-4 text-sky-600" />,
                    path: '/mutasi',
                    detail: 'Cetak riwayat transaksi tabungan santri per NIS.'
                },
                {
                    name: 'Daftar Saldo Nasabah',
                    icon: <Wallet className="w-4 h-4 text-purple-600" />,
                    path: '/nasabah',
                    detail: 'Rekap tabungan santri, status rekening, dan cetak kartu.'
                }
            ]
        }
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-5 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Pusat Laporan Keuangan</h2>
                <p className="text-xs text-gray-500">Akses cepat seluruh laporan keuangan, neraca saldo, dan mutasi perbankan santri</p>
            </div>

            <div className="space-y-5">
                {reportCategories.map((category, idx) => (
                    <div key={idx} className="space-y-2.5">
                        <div>
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{category.title}</h3>
                            <p className="text-[11px] text-gray-400">{category.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {category.items.map((item, itemIdx) => (
                                <Link 
                                    key={itemIdx} 
                                    to={item.path}
                                    className="p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-white hover:border-blue-300 transition-colors flex items-start justify-between gap-3 group"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-1.5 bg-white border border-gray-200 rounded shrink-0">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                {item.name}
                                            </h4>
                                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                                {item.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LaporanPage;
