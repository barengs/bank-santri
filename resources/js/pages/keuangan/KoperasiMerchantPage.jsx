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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Merchant / Outlet Koperasi</h1>
                    <p className="text-xs text-gray-500">Kelola akses API untuk kasir koperasi eksternal</p>
                </div>
                <button 
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium text-xs hover:bg-blue-700 transition-all shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Merchant
                </button>
            </div>

            <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-none">
                {isLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                        <p className="mt-2 text-xs text-gray-500">Memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[11px]">
                                <tr>
                                    <th className="px-3.5 py-2.5">Nama Outlet</th>
                                    <th className="px-3.5 py-2.5">Status</th>
                                    <th className="px-3.5 py-2.5">Terakhir Digunakan</th>
                                    <th className="px-3.5 py-2.5">Dibuat Oleh</th>
                                    <th className="px-3.5 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {merchants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs">Belum ada merchant koperasi.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    merchants.map((merchant) => (
                                        <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3.5 py-2">
                                                <div className="font-semibold text-gray-900">{merchant.name}</div>
                                                {merchant.notes && <div className="text-[10px] text-gray-400">{merchant.notes}</div>}
                                            </td>
                                            <td className="px-3.5 py-2">
                                                <button
                                                    onClick={() => handleToggleActive(merchant.id, merchant.is_active)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                                        merchant.is_active 
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                                    }`}
                                                >
                                                    {merchant.is_active ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                            </td>
                                            <td className="px-3.5 py-2 text-gray-600 font-mono text-[11px]">
                                                {merchant.last_used_at
                                                    ? new Date(merchant.last_used_at).toLocaleString('id-ID')
                                                    : '-'}
                                            </td>
                                            <td className="px-3.5 py-2 text-gray-600">
                                                {merchant.creator?.name || '-'}
                                            </td>
                                            <td className="px-3.5 py-2 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMerchant(merchant);
                                                            setIsRotateOpen(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 border border-orange-400 text-orange-600 rounded px-2 py-0.5 text-xs font-medium hover:bg-orange-50 transition-colors"
                                                        title="Rotate API Key"
                                                    >
                                                        <KeyRound className="h-3 w-3" />
                                                        Rotate Key
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMerchant(merchant);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 border border-rose-400 text-rose-600 rounded px-2 py-0.5 text-xs font-medium hover:bg-rose-50 transition-colors"
                                                        title="Hapus Merchant"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Hapus
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
                    <div className="relative w-full max-w-md bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Tambah Merchant Baru</h2>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <p className="text-xs text-gray-500">API Key akan digenerate otomatis setelah merchant dibuat.</p>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Nama Outlet / Kasir</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Kantin Putra"
                                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Keterangan (Opsional)</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Keterangan tambahan..."
                                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs h-20 resize-none"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all">Batal</button>
                                <button 
                                    onClick={handleCreate} 
                                    disabled={isCreating || !formData.name}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                    <div className="relative w-full max-w-lg bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                            <Key className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">API Key Baru</h2>
                        </div>
                        <div className="p-4 text-center space-y-4">
                            <p className="text-xs font-medium text-amber-800 bg-amber-50 p-2.5 rounded-md border border-amber-200 text-left">
                                Simpan API Key ini sekarang. Anda tidak akan bisa melihatnya lagi setelah jendela ini ditutup!
                            </p>
                            
                            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-md shadow-inner">
                                <code className="flex-1 font-mono text-xs text-emerald-400 break-all text-left">
                                    {newKey}
                                </code>
                                <button 
                                    onClick={handleCopy}
                                    className="p-1.5 rounded bg-slate-800 text-gray-300 hover:text-white hover:bg-slate-700 transition-all"
                                    title="Salin Key"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <button 
                                onClick={() => { setIsKeyOpen(false); setNewKey(''); }}
                                className="w-full px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium text-xs transition-all"
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
                    <div className="relative w-full max-w-sm bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="p-5 text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-900">Rotate API Key?</h2>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                API Key lama untuk <strong className="text-gray-900">{selectedMerchant?.name}</strong> akan langsung hangus. Pastikan kasir siap memperbarui key mereka.
                            </p>
                            <div className="pt-2 flex gap-2">
                                <button onClick={() => setIsRotateOpen(false)} className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium text-xs transition-all">Batal</button>
                                <button onClick={handleRotate} className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium text-xs transition-all">Ya, Rotate</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="p-5 text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-900">Hapus Merchant?</h2>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Apakah Anda yakin ingin menghapus akses <strong className="text-gray-900">{selectedMerchant?.name}</strong> secara permanen?
                            </p>
                            <div className="pt-2 flex gap-2">
                                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium text-xs transition-all">Batal</button>
                                <button onClick={handleDelete} className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium text-xs transition-all">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KoperasiMerchantPage;
