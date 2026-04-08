import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    Search, 
    User, 
    LogOut,
    ChevronDown,
    Maximize,
    Moon
} from 'lucide-react';

const Topbar = ({ isSidebarOpen }) => {
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        // Load user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const handleLogout = () => {
        // Clear local session data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect back to the SMPT Portal Login via dynamic config
        const portalUrl = window.config?.portal_url || 'http://localhost:5173';
        window.location.href = `${portalUrl}/login`;
    };

    return (
        <header 
            className={`fixed top-0 right-0 z-30 flex items-center justify-between h-16 bg-white border-b border-gray-200 transition-all duration-300 ${
                isSidebarOpen ? 'left-64' : 'left-20'
            }`}
        >
            {/* Left Section: Search & Breadcrumbs */}
            <div className="flex items-center gap-6 px-6">
                <div className="relative hidden md:block group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Cari transaksi..." 
                        className="pl-10 pr-4 py-1.5 w-64 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                </div>
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-2 px-6">
                <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <Moon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                
                <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

                {/* Profile Dropdown Container */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-md hover:bg-gray-50 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-600/20 uppercase">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="text-left hidden lg:block">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || 'Admin Bank'}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user?.role || 'Administrator'}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-4 py-2 border-b border-gray-50 mb-1 lg:hidden">
                                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">{user?.role}</p>
                            </div>
                            <button 
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                onClick={() => { /* Profile link if needed */ }}
                            >
                                <User className="w-4 h-4" />
                                Profil Saya
                            </button>
                            <button 
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Keluar Aplikasi
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
