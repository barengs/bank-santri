import React from 'react';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';

const PermissionManagementPage = () => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Permissions</h1>
                    <p className="text-xs text-gray-500">Kelola izin mendetail untuk setiap aksi sistem</p>
                </div>
            </div>

            <div className="bg-white rounded-md border border-dashed border-gray-300 h-[320px] flex flex-col items-center justify-center text-gray-500 space-y-2">
                <div className="p-3 bg-amber-50 rounded-full">
                    <Lock className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-700">Modul Segera Hadir</h3>
                <p className="max-w-xs text-center text-xs text-gray-400">Fitur manajemen permission mendetail per modul sedang dalam tahap pengembangan akhir.</p>
            </div>
        </div>
    );
};

export default PermissionManagementPage;
