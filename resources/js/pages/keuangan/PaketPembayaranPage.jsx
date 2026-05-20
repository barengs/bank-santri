import React, { useMemo, useState } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Package, 
    CheckCircle2, 
    XCircle, 
    Info, 
    Trash,
    PlusCircle,
    Save
} from 'lucide-react';
import { 
    useGetPaymentPackagesQuery, 
    useCreatePaymentPackageMutation,
    useUpdatePaymentPackageMutation,
    useDeletePaymentPackageMutation
} from '../../store/paymentApi';
import { useGetTransactionItemsQuery } from '../../store/transactionItemApi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';

const PaketPembayaranPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [formData, setFormData] = useState({
        package_code: '',
        package_name: '',
        description: '',
        academic_year: '2024/2025',
        semester: 'ganjil',
        is_active: true,
        items: [{ transaction_item_id: '', item_name: '', category: 'pendidikan', amount: 0, is_saku: false }]
    });

    const { data: packagesRes, isLoading, isFetching } = useGetPaymentPackagesQuery({
        page,
        search,
        per_page: 10
    });

    const [createPackage, { isLoading: isCreating }] = useCreatePaymentPackageMutation();
    const [updatePackage, { isLoading: isUpdating }] = useUpdatePaymentPackageMutation();
    const [deletePackage] = useDeletePaymentPackageMutation();
    
    const { data: trxItemsRes } = useGetTransactionItemsQuery({ per_page: 100 });
    const trxItems = trxItemsRes?.data?.data || [];

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Hapus paket ini? Tindakan ini tidak dapat dibatalkan jika belum ada transaksi.')) {
            try {
                await deletePackage(id).unwrap();
                toast.success('Paket berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus paket');
            }
        }
    };

    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setSelectedPackage(pkg);
            setFormData({
                package_code: pkg.package_code,
                package_name: pkg.package_name,
                description: pkg.description || '',
                academic_year: pkg.academic_year || '',
                semester: pkg.semester || 'ganjil',
                is_active: pkg.is_active,
                items: pkg.items?.map(item => ({
                    transaction_item_id: item.transaction_item_id || '',
                    item_name: item.item_name,
                    category: item.category,
                    amount: item.amount,
                    is_saku: item.is_saku
                })) || []
            });
        } else {
            setSelectedPackage(null);
            setFormData({
                package_code: '',
                package_name: '',
                description: '',
                academic_year: '2024/2025',
                semester: 'ganjil',
                is_active: true,
                items: [{ transaction_item_id: '', item_name: '', category: 'pendidikan', amount: 0, is_saku: false }]
            });
        }
        setIsModalOpen(true);
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { transaction_item_id: '', item_name: '', category: 'lainnya', amount: 0, is_saku: false }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        
        // Auto set is_saku if category is saku
        if (field === 'category' && value === 'saku') {
            newItems[index].is_saku = true;
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: Every non-saku item MUST have a transaction_item_id
        const unlinkedItem = formData.items.find(item => !item.is_saku && !item.transaction_item_id);
        if (unlinkedItem) {
            toast.error(`Item "${unlinkedItem.item_name || 'Tanpa Nama'}" belum terhubung ke Master Rincian Transaksi. Silakan pilih koneksi master agar pencatatan COA akurat.`);
            return;
        }

        try {
            if (selectedPackage) {
                await updatePackage({ id: selectedPackage.id, ...formData }).unwrap();
                toast.success('Paket berhasil diperbarui');
            } else {
                await createPackage(formData).unwrap();
                toast.success('Paket baru berhasil dibuat');
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.data?.message || 'Gagal menyimpan paket');
        }
    };

    const columns = useMemo(() => [
        {
            header: 'NAMA PAKET',
            accessorKey: 'package_name',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{row.original.package_name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.original.package_code}</span>
                </div>
            )
        },
        {
            header: 'TOTAL TAGIHAN',
            accessorKey: 'total_amount',
            cell: ({ row }) => (
                <span className="font-bold text-indigo-600">
                    {formatIDR(row.original.total_amount)}
                </span>
            )
        },
        {
            header: 'JATAH SAKU',
            accessorKey: 'saku_amount',
            cell: ({ row }) => (
                <span className="font-bold text-emerald-600">
                    {formatIDR(row.original.saku_amount)}
                </span>
            )
        },
        {
            header: 'PERIODE',
            accessorKey: 'academic_year',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{row.original.academic_year || '-'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{row.original.semester || ''}</span>
                </div>
            )
        },
        {
            header: 'STATUS',
            accessorKey: 'is_active',
            cell: ({ row }) => (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    row.original.is_active 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                    {row.original.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {row.original.is_active ? 'Aktif' : 'Nonaktif'}
                </div>
            )
        },
        {
            header: 'AKSI',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleOpenModal(row.original)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], []);

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Paket Pembayaran</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        Billing & Package Management
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    TAMBAH PAKET BARU
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-md flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                    Definisikan paket rincian pembayaran (SPP, Asrama, Uang Saku) yang dapat dipilih oleh wali santri atau operator saat melakukan proses top-up saldo dan pelunasan tagihan.
                </p>
            </div>

            {/* Main Table */}
            <DataTable 
                columns={columns}
                data={packagesRes?.data?.data || []}
                isLoading={isLoading || isFetching}
                meta={packagesRes?.data}
                onPageChange={setPage}
                onSearchChange={setSearch}
                placeholder="Cari nama atau kode paket..."
            />

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedPackage ? 'Edit Paket Pembayaran' : 'Buat Paket Pembayaran Baru'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kode Paket</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                placeholder="CONTOH: PKT-2024-SMA"
                                value={formData.package_code}
                                onChange={(e) => setFormData({...formData, package_code: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Paket</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                placeholder="Contoh: Paket Bulanan SMA Kelas 10"
                                value={formData.package_name}
                                onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Akademik</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                placeholder="2024/2025"
                                value={formData.academic_year}
                                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                            <select
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                value={formData.semester}
                                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                            >
                                <option value="ganjil">Ganjil</option>
                                <option value="genap">Genap</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                            <div className="flex items-center gap-4 py-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-indigo-600 rounded"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                    />
                                    <span className="text-sm font-bold text-slate-700">Aktif</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Rincian Item Pembayaran</h3>
                            <button 
                                type="button"
                                onClick={handleAddItem}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-md transition-all"
                            >
                                <PlusCircle size={14} />
                                TAMBAH ITEM
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex flex-col bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 group hover:border-indigo-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs">
                                                {index + 1}
                                            </div>
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                {item.transaction_item_id ? trxItems.find(t => t.id == item.transaction_item_id)?.item_name : 'Pilih Item Transaksi'}
                                            </h4>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={formData.items.length === 1}
                                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all disabled:opacity-0"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-end">
                                        <div className="col-span-12 md:col-span-7 space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Rincian Transaksi</label>
                                            <select
                                                required
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                value={item.transaction_item_id}
                                                onChange={(e) => {
                                                    const selectedTrxItem = trxItems.find(t => t.id == e.target.value);
                                                    handleItemChange(index, 'transaction_item_id', e.target.value);
                                                    if (selectedTrxItem) {
                                                        handleItemChange(index, 'item_name', selectedTrxItem.item_name);
                                                        handleItemChange(index, 'amount', selectedTrxItem.default_amount);
                                                        handleItemChange(index, 'category', selectedTrxItem.category || 'pendidikan');
                                                        handleItemChange(index, 'is_saku', selectedTrxItem.category === 'saku');
                                                    }
                                                }}
                                            >
                                                <option value="">-- Pilih Rincian Master --</option>
                                                {trxItems.map(t => (
                                                    <option key={t.id} value={t.id}>{t.item_name} [{t.coa_code}] - {formatIDR(t.default_amount)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3 space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal (Override)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Rp</span>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-400 focus:bg-white"
                                                    value={item.amount}
                                                    onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 flex items-center h-[42px]">
                                            <div className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter w-full text-center ${
                                                item.is_saku ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {item.is_saku ? 'UANG SAKU' : 'TAGIHAN'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Estimasi Total Paket</span>
                            <span className="text-xl font-black text-indigo-600">
                                {formatIDR(formData.items.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-md transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating || isUpdating}
                                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-md font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:bg-slate-300"
                            >
                                <Save size={18} />
                                {isCreating || isUpdating ? 'Menyimpan...' : (selectedPackage ? 'Update Paket' : 'Simpan Paket')}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PaketPembayaranPage;
