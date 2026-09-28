import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    Save, 
    Loader2, 
    Building2, 
    CreditCard, 
    Globe, 
    Info,
    ShieldCheck,
    X
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
                                        <div key={item.key} className={`py-4 first:pt-2 last:pb-2 border-b last:border-0 border-gray-100 ${item.key === 'dapur_meal_sessions' ? 'block' : 'grid grid-cols-1 md:grid-cols-3 gap-4 items-center'}`}>
                                            <div className={item.key === 'dapur_meal_sessions' ? 'mb-3' : ''}>
                                                <label className="text-sm font-semibold text-gray-800 block">{item.label}</label>
                                                <span className="text-[10px] text-gray-400 font-mono">{item.key}</span>
                                                {item.key === 'dapur_meal_sessions' && (
                                                    <p className="text-xs text-gray-500 mt-1">Konfigurasi ini mengatur jadwal dan tarif makan santri secara dinamis di Dapur Umum.</p>
                                                )}
                                            </div>
                                            
                                            <div className={item.key === 'dapur_meal_sessions' ? '' : 'md:col-span-2'}>
                                                {item.key === 'dapur_meal_sessions' ? (
                                                    <div className="space-y-3">
                                                        {(() => {
                                                            let sessions = [];
                                                            try {
                                                                sessions = JSON.parse(item.value || '[]');
                                                            } catch (e) {
                                                                sessions = [];
                                                            }
                                                            return (
                                                                <>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        {sessions.map((session, idx) => (
                                                                            <div key={idx} className="border border-gray-200 rounded p-3 bg-white relative">
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newSessions = [...sessions];
                                                                                        newSessions.splice(idx, 1);
                                                                                        handleInputChange(item.key, JSON.stringify(newSessions));
                                                                                    }}
                                                                                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <div className="mb-2 pr-6">
                                                                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">ID Sesi</label>
                                                                                    <input type="text" value={session.id} onChange={(e) => {
                                                                                        const newSess = [...sessions]; newSess[idx].id = e.target.value; handleInputChange(item.key, JSON.stringify(newSess));
                                                                                    }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                                                </div>
                                                                                <div className="mb-2">
                                                                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Nama Sesi</label>
                                                                                    <input type="text" value={session.name} onChange={(e) => {
                                                                                        const newSess = [...sessions]; newSess[idx].name = e.target.value; handleInputChange(item.key, JSON.stringify(newSess));
                                                                                    }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                                                    <div>
                                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Jam Mulai</label>
                                                                                        <input type="time" value={session.start_time} onChange={(e) => {
                                                                                            const newSess = [...sessions]; newSess[idx].start_time = e.target.value; handleInputChange(item.key, JSON.stringify(newSess));
                                                                                        }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Jam Selesai</label>
                                                                                        <input type="time" value={session.end_time} onChange={(e) => {
                                                                                            const newSess = [...sessions]; newSess[idx].end_time = e.target.value; handleInputChange(item.key, JSON.stringify(newSess));
                                                                                        }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mb-2">
                                                                                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Tarif Per Porsi (Rp)</label>
                                                                                    <input type="number" value={session.price} onChange={(e) => {
                                                                                        const newSess = [...sessions]; newSess[idx].price = parseInt(e.target.value) || 0; handleInputChange(item.key, JSON.stringify(newSess));
                                                                                    }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                                                </div>
                                                                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                                                                    <input type="checkbox" id={`active-${idx}`} checked={session.is_active} onChange={(e) => {
                                                                                        const newSess = [...sessions]; newSess[idx].is_active = e.target.checked; handleInputChange(item.key, JSON.stringify(newSess));
                                                                                    }} className="rounded text-blue-600 focus:ring-blue-500" />
                                                                                    <label htmlFor={`active-${idx}`} className="text-xs text-gray-700 cursor-pointer">Sesi Aktif</label>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            const newSessions = [...sessions, {id: 'baru', name: 'Sesi Baru', start_time: '00:00', end_time: '23:59', price: 0, is_active: true}];
                                                                            handleInputChange(item.key, JSON.stringify(newSessions));
                                                                        }}
                                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-300 inline-flex items-center gap-1 mt-2"
                                                                    >
                                                                        + Tambah Sesi Makan
                                                                    </button>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : item.key === 'dapur_prevent_double_tap' ? (
                                                    <select 
                                                        value={item.value} 
                                                        onChange={(e) => handleInputChange(item.key, e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    >
                                                        <option value="1">Ya, Cegah Santri Tap Dua Kali</option>
                                                        <option value="0">Tidak, Biarkan Santri Tap Berkali-kali</option>
                                                    </select>
                                                ) : item.key === 'dapur_max_transaction_amount' || item.key === 'koperasi_max_transaction_amount' ? (
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rp</span>
                                                        <input 
                                                            type="number"
                                                            value={item.value}
                                                            onChange={(e) => handleInputChange(item.key, e.target.value)}
                                                            placeholder="Contoh: 50000"
                                                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input 
                                                        type={item.is_secret ? 'password' : 'text'}
                                                        value={item.value === '••••••••' ? '' : item.value || ''}
                                                        placeholder={item.is_secret ? 'Biarkan kosong jika tidak diubah' : ''}
                                                        onChange={(e) => handleInputChange(item.key, e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    />
                                                )}
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
