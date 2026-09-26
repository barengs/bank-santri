import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    Save, 
    Loader2, 
    Building2, 
    CreditCard, 
    Globe, 
    Info,
    ShieldCheck
} from 'lucide-react';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../store/settingApi';
import { toast } from 'react-toastify';

const SettingPage = () => {
    const { data: settingsRes, isLoading } = useGetSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();
    
    const [formData, setFormData] = useState([]);

    useEffect(() => {
        if (settingsRes?.data) {
            const flat = Object.values(settingsRes.data).flat();
            setFormData(flat);
        }
    }, [settingsRes]);

    const handleInputChange = (key, value) => {
        setFormData(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const settingsToUpdate = formData.map(s => ({ key: s.key, value: s.value }));
            await updateSettings(settingsToUpdate).unwrap();
            toast.success('Pengaturan berhasil disimpan');
        } catch (err) {
            toast.error(err.data?.message || 'Gagal menyimpan pengaturan');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            </div>
        );
    }

    const grouped = formData.reduce((acc, curr) => {
        if (!acc[curr.group]) acc[curr.group] = [];
        acc[curr.group].push(curr);
        return acc;
    }, {});

    const getGroupIcon = (group) => {
        switch(group) {
            case 'pesantren': return Building2;
            case 'midtrans': return CreditCard;
            case 'koperasi': return Globe;
            default: return Settings;
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                        <h2 className="text-base font-bold text-gray-800">Pengaturan Konfigurasi</h2>
                        <p className="text-xs text-gray-500">Konfigurasi parameter pesantren, integrasi Midtrans, dan koperasi</p>
                    </div>
                    <button 
                        type="submit"
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan Pengaturan
                    </button>
                </div>

                <div className="space-y-4">
                    {Object.entries(grouped).map(([group, items]) => {
                        const Icon = getGroupIcon(group);
                        return (
                            <div key={group} className="border border-gray-200 rounded-md overflow-hidden">
                                <div className="px-3.5 py-2 bg-slate-50 border-b border-gray-200 flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-blue-600" />
                                    <h3 className="font-bold text-gray-800 uppercase text-xs">
                                        {group.replace('_', ' ')}
                                    </h3>
                                </div>
                                
                                <div className="p-3.5 divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <div key={item.key} className="py-2.5 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block">{item.label}</label>
                                                <span className="text-[10px] text-gray-400 font-mono">{item.key}</span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <input 
                                                    type={item.is_secret ? 'password' : 'text'}
                                                    value={item.value === '••••••••' ? '' : item.value || ''}
                                                    placeholder={item.is_secret ? 'Biarkan kosong jika tidak diubah' : ''}
                                                    onChange={(e) => handleInputChange(item.key, e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </form>
        </div>
    );
};

export default SettingPage;
