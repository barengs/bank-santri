import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { 
    LayoutDashboard, 
    Users, 
    CreditCard, 
    History, 
    Settings, 
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
    Store,
    Lock,
    ArrowUpCircle,
    Briefcase,
    UserPlus,
    FileText,
    Landmark,
    Shield,
    GraduationCap,
    BookOpen,
    Info,
    Database,
    ClipboardList,
    Home
} from 'lucide-react';
import { useGetSidebarQuery } from '../store/securityApi';

const IconMap = {
    LayoutDashboard, Users, CreditCard, History, Settings,
    Banknote, PieChart, Package, Receipt, ShieldCheck, ShoppingCart,
    PlusCircle, Send, ArrowRightLeft, ChevronDown, DollarSign, Store, Lock,
    ArrowUpCircle, Briefcase, UserPlus, FileText, Landmark, Shield,
    GraduationCap, BookOpen, Info, Database, ClipboardList, Home
};

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const user = useSelector(selectCurrentUser);
    const { data: sidebarRes, isLoading } = useGetSidebarQuery();

    const menuItems = sidebarRes?.data || [];

    return (
        <aside 
            className={`fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out bg-[#182234] text-slate-300 border-r border-slate-800 ${
                isOpen ? 'w-60' : 'w-16'
            }`}
        >
            {/* Sidebar Brand Header */}
            <div className="flex items-center h-14 md:h-16 px-4 bg-[#141c2b] border-b border-white/10 gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Banknote className="w-4 h-4" />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <span className="text-base font-bold text-white tracking-tight whitespace-nowrap block">
                        Bank Santri
                    </span>
                    <span className="text-[10px] text-slate-400 tracking-wider uppercase block font-medium">
                        e-Panyeppen
                    </span>
                </div>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto no-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : menuItems.map((item, idx) => {
                    if (item.is_divider) {
                        return <div key={idx} className="h-px bg-white/10 my-2 mx-2" />;
                    }

                    const IconComponent = IconMap[item.icon] || Settings;

                    if (item.children && item.children.length > 0) {
                        return (
                            <SubMenu 
                                key={item.id || idx} 
                                item={{...item, icon: IconComponent}} 
                                isOpen={isOpen} 
                                location={location} 
                            />
                        );
                    }

                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.id || item.path || idx}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors group relative ${
                                isActive 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                {item.name}
                            </span>
                            {!isOpen && (
                                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 border border-slate-700 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Sidebar User Footer */}
            <div className="p-3 border-t border-white/10 bg-[#141c2b]">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {user?.name?.[0] || 'U'}
                    </div>
                    {isOpen && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tight truncate">{user?.role || 'Admin Pusat'}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

const SubMenu = ({ item, isOpen, location }) => {
    const isChildActive = item.children?.some(child => location.pathname === child.path);
    const [isExpanded, setIsExpanded] = useState(isChildActive);

    return (
        <div className="space-y-0.5">
            <button
                type="button"
                onClick={() => isOpen && setIsExpanded(!isExpanded)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors group relative ${
                    isChildActive 
                        ? 'bg-blue-600/90 text-white font-semibold' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
            >
                <item.icon className={`w-4 h-4 shrink-0 ${isChildActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className={`whitespace-nowrap transition-all duration-300 flex-1 text-left ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    {item.name}
                </span>
                {isOpen && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
                {!isOpen && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 border border-slate-700 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                        {item.name}
                    </div>
                )}
            </button>

            {isOpen && isExpanded && (
                <div className="ml-3 pl-2.5 border-l border-white/10 space-y-0.5 mt-0.5">
                    {item.children.map((child, idx) => {
                        const isActive = location.pathname === child.path;
                        return (
                            <Link
                                key={idx}
                                to={child.path}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    isActive 
                                        ? 'bg-white text-slate-900 font-bold shadow-sm' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-500'}`} />
                                <span className="truncate">{child.name}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
