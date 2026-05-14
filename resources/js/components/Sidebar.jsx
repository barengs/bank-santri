import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    CreditCard, 
    History, 
    Settings, 
    ChevronLeft,
    Banknote,
    PieChart,
    Package,
    Receipt,
    ShieldCheck,
    ShoppingCart,
    PlusCircle,
    Send,
    ArrowRightLeft,
    ChevronDown,
    DollarSign,
    Store
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard Bank', path: '/', icon: LayoutDashboard },
        { 
            name: 'Operasional Bank', 
            icon: CreditCard,
            children: [
                { name: 'Transaksi Bank', path: '/transaksi', icon: CreditCard },
                { name: 'Entri Transaksi', path: '/entri-transaksi', icon: PlusCircle },
                { name: 'Rekening Bank', path: '/nasabah', icon: Users },
                { name: 'Top-Up / Setor Tunai', path: '/topup', icon: PlusCircle },
                { name: 'Transfer Bank', path: '/transfer', icon: Send },
                { name: 'Mutasi Rekening', path: '/mutasi', icon: History },
            ]
        },
        { 
            name: 'Pembayaran & Tagihan', 
            icon: Package,
            children: [
                { name: 'Paket Pembayaran', path: '/paket-pembayaran', icon: Package },
                { name: 'Proses Pembayaran', path: '/proses-pembayaran', icon: Receipt },
                { name: 'Verifikasi Top-up', path: '/verifikasi-topup', icon: ShieldCheck },
            ]
        },
        { name: 'Kasir Koperasi', path: '/koperasi', icon: ShoppingCart },
        { name: 'Laporan', path: '/laporan', icon: PieChart },
        { name: 'divider', isDivider: true },
        { 
            name: 'Master Data', 
            icon: Settings,
            children: [
                { name: 'Produk Bank', path: '/master/produk', icon: Package },
                { name: 'COA Bank', path: '/master/coa', icon: ArrowRightLeft },
                { name: 'Master Rincian Transaksi', path: '/master/rincian-transaksi', icon: DollarSign },
                { name: 'Jenis Transaksi Bank', path: '/master/jenis-transaksi', icon: Settings },
                { name: 'Merchant Koperasi', path: '/master/koperasi-merchant', icon: Store },
                { name: 'Pengaturan Bank', path: '/master/pengaturan', icon: ShieldCheck },
            ]
        },
    ];

    return (
        <aside 
            className={`fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out bg-slate-900 text-slate-300 border-r border-slate-800 ${
                isOpen ? 'w-64' : 'w-20'
            }`}
        >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-6 bg-slate-950/50">
                <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                        Bank Santri
                    </span>
                </div>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                >
                    <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
                {menuItems.map((item, idx) => {
                    if (item.isDivider) {
                        return <div key={idx} className="h-px bg-slate-800 my-4 mx-2" />;
                    }

                    if (item.children) {
                        return <SubMenu key={idx} item={item} isOpen={isOpen} location={location} />;
                    }

                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                                isActive 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                    : 'hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                {item.name}
                            </span>
                            {!isOpen && (
                                <div className="absolute left-full ml-6 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Sidebar Footer */}
            <div className="w-full p-4 border-t border-slate-800 bg-slate-900">
                <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                        BS
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-white">System Admin</p>
                        <p className="text-[10px] text-slate-500">v1.2.0-stable</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const SubMenu = ({ item, isOpen, location }) => {
    const isChildActive = item.children?.some(child => location.pathname === child.path);
    const [isExpanded, setIsExpanded] = useState(isChildActive);

    return (
        <div className="space-y-1">
            <button
                onClick={() => isOpen && setIsExpanded(!isExpanded)}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isChildActive 
                        ? 'text-indigo-400' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <item.icon className={`w-5 h-5 min-w-[20px] ${isChildActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                <span className={`font-medium whitespace-nowrap transition-all duration-300 flex-1 text-left ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    {item.name}
                </span>
                {isOpen && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
                {!isOpen && (
                    <div className="absolute left-full ml-6 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.name}
                    </div>
                )}
            </button>

            {isOpen && isExpanded && (
                <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map((child, idx) => {
                        const isActive = location.pathname === child.path;
                        return (
                            <Link
                                key={idx}
                                to={child.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    isActive 
                                        ? 'text-white bg-slate-800' 
                                        : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                                {child.name}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
