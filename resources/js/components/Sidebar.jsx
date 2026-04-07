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
    PieChart
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Nasabah', path: '/nasabah', icon: Users },
        { name: 'Transaksi', path: '/transaksi', icon: CreditCard },
        { name: 'Mutasi', path: '/mutasi', icon: History },
        { name: 'Laporan', path: '/laporan', icon: PieChart },
        { name: 'Konfigurasi', path: '/konfigurasi', icon: Settings },
    ];

    return (
        <aside 
            className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-slate-900 text-slate-300 border-r border-slate-800 ${
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
            <nav className="p-4 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => {
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
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900">
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

export default Sidebar;
