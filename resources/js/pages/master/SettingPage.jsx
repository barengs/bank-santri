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
            // Flatten the grouped settings for the form
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Group settings for rendering
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
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Bank</h1>
                <p className="text-sm text-gray-500">Konfigurasi identitas lembaga dan integrasi sistem eksternal.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {Object.entries(grouped).map(([group, items]) => {
                    const Icon = getGroupIcon(group);
                    return (
                        <div key={group} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Icon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs">
                                    {group.replace('_', ' ')}
                                </h2>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {items.map((item) => (
                                    <div key={item.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">{item.label}</label>
                                            <p className="text-[10px] text-gray-400 font-medium">Key: <code className="bg-gray-100 px-1 rounded">{item.key}</code></p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <input 
                                                type={item.is_secret ? 'password' : 'text'}
                                                value={item.value === '••••••••' ? '' : item.value || ''}
                                                placeholder={item.is_secret ? 'Biarkan kosong jika tidak diubah' : ''}
                                                onChange={(e) => handleInputChange(item.key, e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                <div className="flex items-center justify-between p-6 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Simpan Perubahan</p>
                            <p className="text-xs text-indigo-100">Pastikan data yang Anda masukkan sudah benar.</p>
                        </div>
                    </div>
                    <button 
                        type="submit"
                        disabled={isUpdating}
                        className="px-6 py-2.5 bg-white text-indigo-600 rounded-md font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Sekarang
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingPage;
