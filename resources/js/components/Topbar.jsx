import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '../store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    User, 
    LogOut,
    ChevronDown,
    Maximize,
    Minimize,
    Sun,
    Moon,
    Globe,
    ChevronsLeft,
    ChevronsRight,
    Settings
} from 'lucide-react';
import { getRouteMeta } from '../utils/navigationHelper';

const Topbar = ({ isSidebarOpen, onToggleSidebar }) => {
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [hijriDate, setHijriDate] = useState('');

    const routeMeta = getRouteMeta(location.pathname);

    // Calculate Hijri Date matching SMPT format: "15, Rabiulakhir, 1448"
    useEffect(() => {
        try {
            const today = new Date();
            const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const parts = formatter.formatToParts(today);
            let year = '';
            let month = '';
            let day = '';
            for (const part of parts) {
                if (part.type === 'year') year = part.value;
                if (part.type === 'month') month = part.value;
                if (part.type === 'day') day = part.value;
            }
            if (day && month && year) {
                setHijriDate(`${day}, ${month}, ${year}`);
            } else {
                setHijriDate(new Date().toLocaleDateString('id-ID'));
            }
        } catch (e) {
            setHijriDate(new Date().toLocaleDateString('id-ID'));
        }
    }, []);

    // Fullscreen toggle listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header 
            className={`fixed top-0 right-0 z-30 flex items-center justify-between h-14 md:h-16 bg-white border-b border-gray-200 transition-all duration-300 ${
                isSidebarOpen ? 'left-60' : 'left-16'
            }`}
        >
            {/* Left Section: Sidebar Toggle & Page Title */}
            <div className="flex items-center gap-3 px-4 md:px-6">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title={isSidebarOpen ? 'Ciutkan Sidebar' : 'Perluas Sidebar'}
                >
                    {isSidebarOpen ? (
                        <ChevronsLeft className="w-5 h-5" />
                    ) : (
                        <ChevronsRight className="w-5 h-5" />
                    )}
                </button>
                <h1 className="text-base md:text-lg font-semibold text-gray-800 tracking-tight">
                    {routeMeta.title}
                </h1>
            </div>

            {/* Right Section: Hijri Date, Actions & User Profile */}
            <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6">
                {/* Hijri Date */}
                {hijriDate && (
                    <span className="text-xs text-gray-500 font-medium hidden md:block select-none mr-1">
                        {hijriDate}
                    </span>
                )}

                {/* Fullscreen Button */}
                <button 
                    type="button"
                    onClick={toggleFullScreen}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    title="Fullscreen"
                >
                    {isFullscreen ? (
                        <Minimize className="w-4 h-4" />
                    ) : (
                        <Maximize className="w-4 h-4" />
                    )}
                </button>

                {/* Theme Toggle Button */}
                <button 
                    type="button"
                    onClick={() => setIsDark(!isDark)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    title="Tema"
                >
                    {isDark ? (
                        <Moon className="w-4 h-4" />
                    ) : (
                        <Sun className="w-4 h-4" />
                    )}
                </button>

                {/* Language Dropdown */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={() => {
                            setIsLanguageOpen(!isLanguageOpen);
                            setIsProfileOpen(false);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        title="Bahasa"
                    >
                        <Globe className="w-4 h-4" />
                    </button>
                    {isLanguageOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-xs">
                            <button 
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                onClick={() => setIsLanguageOpen(false)}
                            >
                                <span>🇮🇩</span> Bahasa Indonesia
                            </button>
                            <button 
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                onClick={() => setIsLanguageOpen(false)}
                            >
                                <span>🇬🇧</span> English
                            </button>
                            <button 
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                onClick={() => setIsLanguageOpen(false)}
                            >
                                <span>🇸🇦</span> العربية
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-5 w-[1px] bg-gray-200 mx-1"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={() => {
                            setIsProfileOpen(!isProfileOpen);
                            setIsLanguageOpen(false);
                        }}
                        className="flex items-center gap-2.5 p-1 rounded-md hover:bg-gray-100 transition-colors group"
                    >
                        <div className="w-7 h-7 bg-gray-100 border border-gray-300 text-gray-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                            <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 hidden sm:block">
                            {user?.name || 'Admin Pusat'}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-xs">
                            <div className="px-3 py-2 border-b border-gray-100">
                                <p className="font-semibold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-medium">{user?.role || 'Admin Pusat'}</p>
                            </div>
                            <button 
                                className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate('/security/user');
                                }}
                            >
                                <Settings className="w-3.5 h-3.5 text-gray-400" />
                                Pengaturan Profil
                            </button>
                            <button 
                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-gray-100"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-3.5 h-3.5" />
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
