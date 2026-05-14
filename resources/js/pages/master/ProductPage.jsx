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
        }).format(amount);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'product_code',
            header: 'Kode',
            cell: ({ row }) => <span className="font-black text-gray-900">{row.original.product_code}</span>
        },
        {
            accessorKey: 'product_name',
            header: 'Nama Produk',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-indigo-600">{row.original.product_name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.original.product_type}</span>
                </div>
            )
        },
        {
            accessorKey: 'opening_fee',
            header: 'Biaya Buka',
            cell: ({ row }) => <span>{formatIDR(row.original.opening_fee)}</span>
        },
        {
            accessorKey: 'admin_fee',
            header: 'Biaya Admin',
            cell: ({ row }) => <span>{formatIDR(row.original.admin_fee)}/bln</span>
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit ${
                    row.original.is_active 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                    {row.original.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {row.original.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleEdit(row.original)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                    >
                        <Trash2 className="w-4 h-4" />
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
            is_active: true
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produk Bank</h1>
                    <p className="text-sm text-gray-500">Kelola daftar produk perbankan santri.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Produk
                </button>
            </div>

            <DataTable 
                columns={columns}
                data={productsRes?.data || []}
                isLoading={isLoading}
                placeholder="Cari produk..."
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 bg-indigo-600 text-white relative">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                            <p className="text-indigo-100 text-xs mt-1">Konfigurasi parameter produk perbankan.</p>
                            <div className="absolute top-6 right-8 opacity-20">
                                <Package className="w-12 h-12" />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kode Produk</label>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.product_code}
                                        onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Produk</label>
                                    <select 
                                        value={formData.product_type}
                                        onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    >
                                        <option value="Tabungan">Tabungan</option>
                                        <option value="Deposito">Deposito</option>
                                        <option value="Pinjaman">Pinjaman</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Produk</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.product_name}
                                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Biaya Buka (IDR)</label>
                                    <input 
                                        type="number"
                                        value={formData.opening_fee}
                                        onChange={(e) => setFormData({...formData, opening_fee: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Biaya Admin (IDR)</label>
                                    <input 
                                        type="number"
                                        value={formData.admin_fee}
                                        onChange={(e) => setFormData({...formData, admin_fee: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Produk Aktif</label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-all flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-md font-bold text-sm text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                                >
                                    {isCreating || isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
