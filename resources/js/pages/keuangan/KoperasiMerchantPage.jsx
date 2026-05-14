import React, { useState } from 'react';
import { Store, Plus, Key, Copy, Check, Trash2, KeyRound, Loader2, X } from 'lucide-react';
import {
    useGetKoperasiMerchantsQuery,
    useCreateKoperasiMerchantMutation,
    useUpdateKoperasiMerchantMutation,
    useDeleteKoperasiMerchantMutation,
    useRotateKoperasiMerchantKeyMutation,
} from '../../store/koperasiApi';
import { toast } from 'react-toastify';

const KoperasiMerchantPage = () => {
    const { data, isLoading } = useGetKoperasiMerchantsQuery();
    const merchants = data?.data || [];

    const [createMerchant, { isLoading: isCreating }] = useCreateKoperasiMerchantMutation();
    const [updateMerchant] = useUpdateKoperasiMerchantMutation();
    const [deleteMerchant] = useDeleteKoperasiMerchantMutation();
    const [rotateKey] = useRotateKoperasiMerchantKeyMutation();

    // States for modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isKeyOpen, setIsKeyOpen] = useState(false);
    const [isRotateOpen, setIsRotateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [newKey, setNewKey] = useState('');
    const [copied, setCopied] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ name: '', notes: '' });

    const handleCopy = () => {
        navigator.clipboard.writeText(newKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("API Key disalin ke clipboard!");
    };

    const handleCreate = async () => {
        if (!formData.name) return toast.error("Nama merchant wajib diisi.");
        try {
            const res = await createMerchant(formData).unwrap();
            setNewKey(res.api_key);
            setIsAddOpen(false);
            setFormData({ name: '', notes: '' });
            setIsKeyOpen(true);
            toast.success("Merchant berhasil dibuat.");
        } catch (error) {
            toast.error("Gagal membuat merchant.");
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await updateMerchant({ id, is_active: !currentStatus }).unwrap();
            toast.success(`Status merchant berhasil di${!currentStatus ? 'aktifkan' : 'nonaktifkan'}.`);
        } catch (error) {
            toast.error("Gagal mengubah status merchant.");
        }
    };

    const handleRotate = async () => {
        try {
            const res = await rotateKey(selectedMerchant.id).unwrap();
            setNewKey(res.api_key);
            setIsRotateOpen(false);
            setIsKeyOpen(true);
            toast.success("API Key berhasil di-generate ulang.");
        } catch (error) {
            toast.error("Gagal melakukan rotate key.");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMerchant(selectedMerchant.id).unwrap();
            setIsDeleteOpen(false);
            toast.success("Merchant berhasil dihapus.");
        } catch (error) {
            toast.error("Gagal menghapus merchant.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Merchant / Outlet Koperasi</h1>
                    <p className="text-sm text-gray-500">Kelola akses API untuk kasir koperasi eksternal.</p>
                </div>
                <button 
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Merchant
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Nama Outlet</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Terakhir Digunakan</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Dibuat Oleh</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {merchants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                            <p className="text-sm">Belum ada merchant koperasi.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    merchants.map((merchant) => (
                                        <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{merchant.name}</div>
                                                {merchant.notes && <div className="text-xs text-gray-500 mt-1">{merchant.notes}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(merchant.id, merchant.is_active)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                                                        merchant.is_active 
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {merchant.is_active ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                                {merchant.last_used_at
                                                    ? new Date(merchant.last_used_at).toLocaleString('id-ID')
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {merchant.creator?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMerchant(merchant);
                                                            setIsRotateOpen(true);
                                                        }}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Rotate API Key"
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMerchant(merchant);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Hapus Merchant"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isCreating && setIsAddOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tambah Merchant Baru</h2>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-500 mb-4">API Key akan digenerate otomatis setelah merchant dibuat.</p>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nama Outlet / Kasir</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Kantin Putra"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Keterangan (Opsional)</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Keterangan tambahan..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm h-24 resize-none"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setIsAddOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-all">Batal</button>
                                <button 
                                    onClick={handleCreate} 
                                    disabled={isCreating || !formData.name}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Show API Key Modal */}
            {isKeyOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                            <Key className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest">API Key Baru</h2>
                        </div>
                        <div className="p-6 text-center space-y-6">
                            <p className="text-sm font-bold text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                Simpan API Key ini sekarang. Anda tidak akan bisa melihatnya lagi setelah jendela ini ditutup!
                            </p>
                            
                            <div className="flex items-center gap-2 bg-gray-900 p-4 rounded-xl shadow-inner">
                                <code className="flex-1 font-mono text-sm text-emerald-400 break-all text-left">
                                    {newKey}
                                </code>
                                <button 
                                    onClick={handleCopy}
                                    className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
                                >
                                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>

                            <button 
                                onClick={() => { setIsKeyOpen(false); setNewKey(''); }}
                                className="w-full px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-bold text-sm transition-all"
                            >
                                Saya sudah menyimpannya dengan aman
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rotate Confirmation Modal */}
            {isRotateOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRotateOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Rotate API Key?</h2>
                            <p className="text-sm text-gray-500">
                                API Key lama untuk <strong className="text-gray-900">{selectedMerchant?.name}</strong> akan langsung hangus. Pastikan kasir siap memperbarui key mereka.
                            </p>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setIsRotateOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-bold text-sm transition-all">Batal</button>
                                <button onClick={handleRotate} className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-bold text-sm transition-all">Ya, Rotate</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Hapus Merchant?</h2>
                            <p className="text-sm text-gray-500">
                                Apakah Anda yakin ingin menghapus akses <strong className="text-gray-900">{selectedMerchant?.name}</strong> secara permanen?
                            </p>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-bold text-sm transition-all">Batal</button>
                                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-sm transition-all">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KoperasiMerchantPage;
