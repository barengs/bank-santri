import React, { useState, useMemo } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Package, 
    CheckCircle2, 
    XCircle, 
    Loader2,
    Save,
    X
} from 'lucide-react';
import { 
    useGetProductsQuery, 
    useCreateProductMutation, 
    useUpdateProductMutation, 
    useDeleteProductMutation 
} from '../../store/productApi';
import DataTable from '../../components/DataTable';
import { toast } from 'react-toastify';

const ProductPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        product_code: '',
        product_name: '',
        product_type: 'Tabungan',
        interest_rate: 0,
        admin_fee: 0,
        opening_fee: 0,
        minimum_balance: 0,
        daily_withdrawal_limit: 0,
        is_active: true
    });

    const { data: productsRes, isLoading } = useGetProductsQuery();
    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const [deleteProduct] = useDeleteProductMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'product_code',
            header: 'Kode',
            cell: ({ row }) => <span className="font-mono font-semibold text-gray-800">{row.original.product_code}</span>
        },
        {
            accessorKey: 'product_name',
            header: 'Nama Produk',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.original.product_name}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{row.original.product_type}</span>
                </div>
            )
        },
        {
            accessorKey: 'opening_fee',
            header: 'Biaya Buka',
            cell: ({ row }) => <span className="text-gray-700">{formatIDR(row.original.opening_fee)}</span>
        },
        {
            accessorKey: 'admin_fee',
            header: 'Biaya Admin',
            cell: ({ row }) => <span className="text-gray-700">{formatIDR(row.original.admin_fee)}/bln</span>
        },
        {
            accessorKey: 'minimum_balance',
            header: 'Saldo Mengendap',
            cell: ({ row }) => <span className="text-gray-700">{formatIDR(row.original.minimum_balance || 0)}</span>
        },
        {
            accessorKey: 'daily_withdrawal_limit',
            header: 'Limit Tarik/Hari',
            cell: ({ row }) => <span className="text-gray-700">{row.original.daily_withdrawal_limit > 0 ? formatIDR(row.original.daily_withdrawal_limit) : 'Bebas'}</span>
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
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
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 justify-end">
                    <button 
                        onClick={() => handleEdit(row.original)}
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

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            product_code: product.product_code,
            product_name: product.product_name,
            product_type: product.product_type,
            interest_rate: product.interest_rate,
            admin_fee: product.admin_fee,
            opening_fee: product.opening_fee,
            minimum_balance: product.minimum_balance || 0,
            daily_withdrawal_limit: product.daily_withdrawal_limit || 0,
            is_active: product.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
            try {
                await deleteProduct(id).unwrap();
                toast.success('Produk berhasil dihapus');
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus produk');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct({ id: editingProduct.id, ...formData }).unwrap();
                toast.success('Produk berhasil diperbarui');
            } else {
                await createProduct(formData).unwrap();
                toast.success('Produk berhasil ditambahkan');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan');
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            product_code: '',
            product_name: '',
            product_type: 'Tabungan',
            interest_rate: 0,
            admin_fee: 0,
            opening_fee: 0,
            minimum_balance: 0,
            daily_withdrawal_limit: 0,
            is_active: true
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Produk Bank</h2>
                    <p className="text-xs text-gray-500">Kelola daftar dan ketentuan produk perbankan santri</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Produk
                </button>
            </div>

            <DataTable 
                columns={columns}
                data={productsRes?.data || []}
                isLoading={isLoading}
                placeholder="Cari produk..."
            />

            {/* Flat Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Kode Produk</label>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.product_code}
                                        onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Tipe Produk</label>
                                    <select 
                                        value={formData.product_type}
                                        onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    >
                                        <option value="Tabungan">Tabungan</option>
                                        <option value="Deposito">Deposito</option>
                                        <option value="Pinjaman">Pinjaman</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Nama Produk</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.product_name}
                                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Biaya Buka (IDR)</label>
                                    <input 
                                        type="number"
                                        value={formData.opening_fee}
                                        onChange={(e) => setFormData({...formData, opening_fee: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Biaya Admin (IDR)</label>
                                    <input 
                                        type="number"
                                        value={formData.admin_fee}
                                        onChange={(e) => setFormData({...formData, admin_fee: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Saldo Mengendap</label>
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        value={formData.minimum_balance}
                                        onChange={(e) => setFormData({...formData, minimum_balance: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase">Limit Tarik/Hari</label>
                                    <input 
                                        type="number"
                                        placeholder="0 = Tanpa Batas"
                                        value={formData.daily_withdrawal_limit}
                                        onChange={(e) => setFormData({...formData, daily_withdrawal_limit: e.target.value})}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-1">
                                <input 
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-xs text-gray-700 font-medium">Produk Aktif</label>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-md font-semibold text-xs text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isCreating || isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Simpan Produk
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductPage;
