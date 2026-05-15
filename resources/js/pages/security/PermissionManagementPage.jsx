import React from 'react';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';

const PermissionManagementPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
                    <p className="text-sm text-gray-500">Kelola izin mendetail untuk setiap aksi sistem.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-dashed border-gray-200 h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="p-4 bg-amber-50 rounded-full">
                    <Lock className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Modul Segera Hadir</h3>
                <p className="max-w-xs text-center text-sm">Fitur manajemen permission mendetail per modul sedang dalam tahap pengembangan akhir.</p>
            </div>
        </div>
    );
};

export default PermissionManagementPage;
