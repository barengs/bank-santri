import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    Plus, 
    Settings, 
    GripVertical, 
    Edit2, 
    Trash2, 
    ChevronDown,
    Save,
    Loader2,
    Move
} from 'lucide-react';
import { useGetMenusQuery } from '../../store/securityApi';

const MenuManagementPage = () => {
    const { data: menusRes, isLoading } = useGetMenusQuery();
    const menus = menusRes?.data || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Memuat struktur menu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Menu</h1>
                    <p className="text-sm text-gray-500">Atur hierarki dan urutan menu sidebar secara dinamis.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
                    <Plus className="w-4 h-4" />
                    Tambah Menu Utama
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8">
                    <div className="space-y-4">
                        {menus.map((menu) => (
                            <MenuRow key={menu.id} menu={menu} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MenuRow = ({ menu, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-2">
            <div 
                className={`flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md ${depth > 0 ? 'ml-8' : ''}`}
            >
                <div className="flex items-center gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                        <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{menu.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{menu.path || 'No Path (Parent)'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {menu.children && menu.children.length > 0 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-2 text-gray-400 hover:text-gray-800 rounded-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && menu.children && menu.children.length > 0 && (
                <div className="space-y-2">
                    {menu.children.map((child) => (
                        <MenuRow key={child.id} menu={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MenuManagementPage;
