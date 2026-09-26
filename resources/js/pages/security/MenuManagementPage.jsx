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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Manajemen Menu</h1>
                    <p className="text-xs text-gray-500">Atur hierarki dan urutan menu sidebar secara dinamis</p>
                </div>
                <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium text-xs hover:bg-blue-700 transition-all shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Menu Utama
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3 shadow-none">
                <div className="space-y-2">
                    {menus.map((menu) => (
                        <MenuRow key={menu.id} menu={menu} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const MenuRow = ({ menu, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-1.5">
            <div 
                className={`flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200 group transition-all hover:bg-white text-xs ${depth > 0 ? 'ml-6' : ''}`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-1.5 bg-white border border-gray-200 rounded text-blue-600">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{menu.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{menu.path || 'No Path (Parent)'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition-all opacity-0 group-hover:opacity-100" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded transition-all opacity-0 group-hover:opacity-100" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {menu.children && menu.children.length > 0 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-1 text-gray-500 hover:text-gray-800 rounded transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && menu.children && menu.children.length > 0 && (
                <div className="space-y-1.5">
                    {menu.children.map((child) => (
                        <MenuRow key={child.id} menu={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MenuManagementPage;
