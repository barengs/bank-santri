import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex w-full min-h-screen bg-gray-50/50 overflow-x-hidden">
            {/* Sidebar Overlay (Mobile) */}
            {!isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(true)}
                ></div>
            )}

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <div 
                className={`flex-1 flex flex-col h-screen w-full min-w-0 transition-all duration-300 ${
                    isSidebarOpen ? 'pl-64' : 'pl-20'
                }`}
            >
                {/* Topbar */}
                <Topbar isSidebarOpen={isSidebarOpen} />

                {/* Content */}
                <main className="flex-1 mt-16 p-6 overflow-y-auto overflow-x-hidden no-scrollbar">
                    <div className="space-y-6">
                        <Outlet />
                    </div>
                </main>

                {/* Footer (Optional) */}
                <footer className="w-full py-4 px-6 bg-white border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        © 2026 Bank Santri Marketplace. Powered by Pesantren Digital Ecosystem.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;
