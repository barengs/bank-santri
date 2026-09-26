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
        }).format(amount || 0);
    };

    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setSelectedPackage(pkg);
            setFormData({
                package_code: pkg.package_code,
                package_name: pkg.package_name,
                description: pkg.description || '',
                academic_year: pkg.academic_year || '2024/2025',
                semester: pkg.semester || 'ganjil',
                is_active: Boolean(pkg.is_active),
                items: pkg.items?.map(i => ({
                    transaction_item_id: i.transaction_item_id || '',
                    item_name: i.item_name,
                    category: i.category,
                    amount: i.amount,
                    is_saku: Boolean(i.is_saku)
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

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus paket pembayaran ini?')) {
            try {
                await deletePackage(id).unwrap();
                toast.success('Paket berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus');
            }
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { transaction_item_id: '', item_name: '', category: 'pendidikan', amount: 0, is_saku: false }]
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
        
        if (field === 'category' && value === 'saku') {
            newItems[index].is_saku = true;
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const unlinkedItem = formData.items.find(item => !item.is_saku && !item.transaction_item_id);
        if (unlinkedItem) {
            toast.error(`Item "${unlinkedItem.item_name || 'Tanpa Nama'}" belum terhubung ke Master Rincian Transaksi.`);
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
                    <span className="font-semibold text-gray-800 text-xs">{row.original.package_name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{row.original.package_code}</span>
                </div>
            )
        },
        {
            header: 'TOTAL TAGIHAN',
            accessorKey: 'total_amount',
            cell: ({ row }) => (
                <span className="font-bold text-gray-900 text-xs">
                    {formatIDR(row.original.total_amount)}
                </span>
            )
        },
        {
            header: 'JATAH SAKU',
            accessorKey: 'saku_amount',
            cell: ({ row }) => (
                <span className="font-semibold text-emerald-700 text-xs">
                    {formatIDR(row.original.saku_amount)}
                </span>
            )
        },
        {
            header: 'PERIODE',
            accessorKey: 'academic_year',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs text-gray-700">
                    <span>{row.original.academic_year || '-'}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{row.original.semester || ''}</span>
                </div>
            )
        },
        {
            header: 'STATUS',
            accessorKey: 'is_active',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    row.original.is_active 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                    {row.original.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
            )
        },
        {
            header: 'AKSI',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 justify-end">
                    <button 
                        onClick={() => handleOpenModal(row.original)}
                        className="border border-blue-400 text-blue-600 hover:bg-blue-50 rounded px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="border border-rose-300 text-rose-600 hover:bg-rose-50 rounded px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                        Hapus
                    </button>
                </div>
            )
        }
    ], []);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Paket Pembayaran Santri</h2>
                    <p className="text-xs text-gray-500">Definisi komponen rincian tagihan rutin (SPP, Makan, Jatah Saku)</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Paket
                </button>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Kode Paket</label>
                            <input
                                type="text"
                                required
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="CONTOH: PKT-2024-SMA"
                                value={formData.package_code}
                                onChange={(e) => setFormData({...formData, package_code: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Paket</label>
                            <input
                                type="text"
                                required
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Contoh: Paket Bulanan SMA Kelas 10"
                                value={formData.package_name}
                                onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Tahun Akademik</label>
                            <input
                                type="text"
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                placeholder="2024/2025"
                                value={formData.academic_year}
                                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Semester</label>
                            <select
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                value={formData.semester}
                                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                            >
                                <option value="ganjil">Ganjil</option>
                                <option value="genap">Genap</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Status</label>
                            <div className="flex items-center gap-2 py-1.5">
                                <input
                                    type="checkbox"
                                    id="is_active_pkg"
                                    className="rounded border-gray-300 text-blue-600"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                />
                                <label htmlFor="is_active_pkg" className="text-xs text-gray-700 font-medium">Paket Aktif</label>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Items */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700 uppercase">Rincian Item Pembayaran</span>
                            <button 
                                type="button"
                                onClick={handleAddItem}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-1 rounded transition-colors"
                            >
                                <PlusCircle size={14} />
                                Tambah Item
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {formData.items.map((item, index) => (
                                <div key={index} className="p-2.5 bg-gray-50 border border-gray-200 rounded-md space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800">
                                            #{index + 1} {item.transaction_item_id ? trxItems.find(t => t.id == item.transaction_item_id)?.item_name : 'Item Baru'}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={formData.items.length === 1}
                                            className="text-gray-400 hover:text-rose-600 disabled:opacity-0"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-7">
                                            <select
                                                required
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs outline-none focus:border-blue-500"
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
                                        <div className="col-span-7 md:col-span-3">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Rp</span>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full pl-6 pr-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold outline-none focus:border-blue-500"
                                                    value={item.amount}
                                                    onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-5 md:col-span-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border block ${
                                                item.is_saku ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {item.is_saku ? 'UANG SAKU' : 'TAGIHAN'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Paket:</span>
                            <span className="text-base font-bold text-blue-700">
                                {formatIDR(formData.items.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 text-xs font-semibold transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating || isUpdating}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save size={14} />
                                {isCreating || isUpdating ? 'Menyimpan...' : 'Simpan Paket'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PaketPembayaranPage;
