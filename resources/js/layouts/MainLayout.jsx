import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Home, ChevronRight } from 'lucide-react';
import { getRouteMeta } from '../utils/navigationHelper';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const routeMeta = getRouteMeta(location.pathname);

    return (
        <div className="flex w-full min-h-screen bg-[#f4f6f9] overflow-x-hidden text-slate-800">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <div 
                className={`flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300 ${
                    isSidebarOpen ? 'pl-60' : 'pl-16'
                }`}
            >
                {/* Topbar */}
                <Topbar 
                    isSidebarOpen={isSidebarOpen} 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                />

                {/* Content Container */}
                <main className="flex-1 mt-14 md:mt-16 p-4 md:p-5 overflow-y-auto">
                    {/* Breadcrumbs */}
                    {location.pathname !== '/' && (
                        <div className="flex items-center text-xs text-gray-500 gap-1.5 mb-3 flex-wrap">
                            <Link to="/" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <Home className="w-3.5 h-3.5 text-gray-400" />
                                <span>Dashboard</span>
                            </Link>
                            {routeMeta.crumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    {crumb.path ? (
                                        <Link to={crumb.path} className="text-gray-500 hover:text-blue-600 transition-colors">
                                            {crumb.name}
                                        </Link>
                                    ) : (
                                        <span className="font-semibold text-gray-800">{crumb.name}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="w-full">
                        <Outlet />
                    </div>
                </main>

                {/* Footer matching SMPT style */}
                <footer className="w-full py-2 px-6 bg-[#182234] text-white text-xs text-center border-t border-slate-800">
                    <p className="text-[11px] text-slate-300">
                        © 2026 All rights reserved. Made with <span className="text-rose-500">❤️</span> by PT. Unggul Mediatama Indonesia
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;
