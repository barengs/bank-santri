import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, CreditCard, User, ShieldCheck, 
    History, TrendingUp, TrendingDown, Clock,
    Loader2, AlertCircle, Printer, Pencil
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetTransactionsQuery } from '../store/transactionApi';
import { useGetAccountDetailQuery, useGetAccountsQuery, useUpdateAccountMutation } from '../store/accountApi';
import { useGetProductsQuery } from '../store/productApi';
import RekeningKoranModal from '../components/RekeningKoranModal';

const NasabahDetailPage = () => {
    const { accountNumber } = useParams();
    const navigate = useNavigate();
    const [isKoranOpen, setIsKoranOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Fetch Account Info lengkap termasuk data santri & foto dari SMPT
    const { data: accountDetailRes, isLoading: isLoadingAccount } = useGetAccountDetailQuery(accountNumber);
    const { data: accountsRes } = useGetAccountsQuery({ search: accountNumber }, { skip: !!accountDetailRes?.data });
    const account = accountDetailRes?.data || accountsRes?.data?.data?.find(acc => acc.account_number === accountNumber);

    // Fetch Transactions
    const { data: transactionsRes, isLoading: isLoadingTx } = useGetTransactionsQuery({ account_number: accountNumber });
    const transactions = transactionsRes?.data?.data || [];

    // State untuk fitur Ganti Produk
    const [isChangeProductOpen, setIsChangeProductOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedAkadType, setSelectedAkadType] = useState('wadiah');

    // Query daftar produk master & mutation update rekening
    const { data: productsRes } = useGetProductsQuery();
    const products = productsRes?.data || [];
    const [updateAccount, { isLoading: isUpdatingProduct }] = useUpdateAccountMutation();

    const openChangeProductModal = () => {
        setSelectedProductId(account?.product_id || account?.product?.id || (products[0]?.id || ''));
        setSelectedAkadType(account?.akad_type || 'wadiah');
        setIsChangeProductOpen(true);
    };

    const handleChangeProduct = async (e) => {
        if (e) e.preventDefault();
        if (!selectedProductId) return;

        try {
            await updateAccount({
                accountNumber: account.account_number,
                product_id: Number(selectedProductId),
                akad_type: selectedAkadType,
            }).unwrap();

            setIsChangeProductOpen(false);
            toast.success('Produk tabungan berhasil diubah!');
        } catch (err) {
            toast.error(err?.data?.message || 'Gagal mengubah produk tabungan.');
        }
    };

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoadingAccount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Memuat informasi nasabah...</p>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="bg-white border border-gray-200 rounded-md p-6 text-center max-w-lg mx-auto">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
                <h2 className="text-base font-bold text-gray-800">Nasabah Tidak Ditemukan</h2>
                <p className="text-xs text-gray-500 mt-1">Rekening {accountNumber} tidak terdaftar dalam sistem.</p>
                <button 
                    onClick={() => navigate('/nasabah')} 
                    className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Rekening
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Bar Card */}
            <div className="bg-white border border-gray-200 rounded-md p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/nasabah')}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-800 border border-gray-200 transition-colors"
                        title="Kembali"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Detail Rekening: {account.customer_name}</h2>
                        <p className="text-xs text-gray-500 font-mono">NIS: {account.account_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={openChangeProductModal}
                        className="px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Ganti Produk
                    </button>
                    <button 
                        onClick={() => setIsKoranOpen(true)}
                        className="px-3 py-1.5 border border-emerald-400 text-emerald-600 rounded-md text-xs font-medium hover:bg-emerald-50 transition-colors inline-flex items-center gap-1.5"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Rekening Koran
                    </button>
                    <button 
                        onClick={() => navigate('/mutasi')}
                        className="px-3 py-1.5 border border-blue-400 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors"
                    >
                        Cek Mutasi
                    </button>
                </div>
            </div>

            <RekeningKoranModal 
                isOpen={isKoranOpen} 
                onClose={() => setIsKoranOpen(false)} 
                accountNumber={accountNumber}
                customerName={account.customer_name}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Account Summary */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Account Card */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
                        <div className="flex items-center gap-3.5">
                            {/* Foto Profil Santri */}
                            <div className="relative shrink-0">
                                {(account.photo_url || account.student?.photo_url) && !imageError ? (
                                    <img 
                                        src={account.photo_url || account.student?.photo_url} 
                                        alt={account.customer_name}
                                        onError={() => setImageError(true)}
                                        className="w-14 h-14 rounded-lg object-cover border-2 border-emerald-500 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                                        {account.customer_name?.[0] || 'S'}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-sm text-gray-800 leading-tight truncate">{account.customer_name}</h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                        {account.status || 'Aktif'}
                                    </span>
                                    {(account.student?.current_class?.class_name || account.student?.class_name) && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                            Kelas {account.student.current_class?.class_name || account.student.class_name}
                                        </span>
                                    )}
                                    {(account.student?.hostel?.name || account.student?.hostel_name) && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                            {account.student.hostel?.name || account.student.hostel_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 space-y-2.5">
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Nomor Rekening</p>
                                <p className="text-sm font-mono font-bold text-gray-800">{account.account_number}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Total Saldo</p>
                                <p className="text-xl font-bold text-blue-600">{formatIDR(account.balance)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-gray-400 uppercase">Produk</p>
                                        <button 
                                            onClick={openChangeProductModal}
                                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 hover:underline"
                                            title="Ubah Produk Tabungan"
                                        >
                                            <Pencil className="w-2.5 h-2.5" /> Ganti
                                        </button>
                                    </div>
                                    <p className="font-semibold text-gray-700 truncate" title={account.product?.product_name || account.product?.name || '-'}>
                                        {account.product?.product_name || account.product?.name || '-'}
                                    </p>
                                    {account.product?.product_code && (
                                        <p className="text-[9px] font-mono text-gray-400">{account.product.product_code}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                    <p className="text-[10px] text-gray-400 uppercase">Akad</p>
                                    <p className="font-semibold text-gray-700 capitalize">
                                        {account.akad_type || 'Wadiah'}
                                    </p>
                                    <p className="text-[9px] text-gray-400 capitalize">
                                        {account.product?.product_type || 'Tabungan'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-2 shadow-none">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Informasi Kartu & Tanggal</h4>
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                    <span>No. Kartu / RFID</span>
                                </div>
                                <span className="font-mono font-semibold text-gray-800">{account.card_number || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Tanggal Buka</span>
                                </div>
                                <span className="font-semibold text-gray-800">
                                    {account.created_at ? new Date(account.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3 shadow-none">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-600" />
                                Riwayat Transaksi Terbaru
                            </h3>
                            <button 
                                onClick={() => navigate('/transaksi')}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Semua Transaksi
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            {isLoadingTx ? (
                                <div className="py-12 text-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                    <span className="text-xs">Memuat transaksi...</span>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                                    <p className="text-xs font-medium">Belum ada riwayat transaksi</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                                                    tx.destination_account === accountNumber ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {tx.destination_account === accountNumber ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 leading-tight">{tx.description}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(tx.created_at).toLocaleString('id-ID', { 
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-bold ${
                                                    tx.destination_account === accountNumber ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                    {tx.destination_account === accountNumber ? '+' : '-'}{formatIDR(tx.amount)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-mono">
                                                    {tx.reference_number || tx.id?.substring(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Ganti Produk Tabungan */}
            {isChangeProductOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        onClick={() => !isUpdatingProduct && setIsChangeProductOpen(false)}
                    ></div>
                    
                    <div className="relative w-full max-w-md bg-white rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Ganti Produk Tabungan</h2>
                                    <p className="text-[11px] text-gray-500">Sesuaikan jenis produk tabungan & akad santri</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => !isUpdatingProduct && setIsChangeProductOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <span className="text-lg leading-none">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleChangeProduct} className="p-4 space-y-3.5">
                            {/* Summary Santri */}
                            <div className="p-3 bg-slate-50 border border-gray-200 rounded-md space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Nasabah</span>
                                    <span className="font-bold text-gray-900">{account.customer_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Nomor Rekening / NIS</span>
                                    <span className="font-mono font-semibold text-blue-700">{account.account_number}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Saldo Tabungan Saat Ini</span>
                                    <span className="font-bold text-emerald-700">{formatIDR(account.balance)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Produk Saat Ini</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-800">
                                        {account.product?.product_name || account.product?.name || 'Wadiah'}
                                    </span>
                                </div>
                            </div>

                            {/* Pilihan Produk Baru */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Pilih Produk Bank / Tabungan Baru <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="" disabled>Pilih Produk Bank</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.product_name} ({p.product_code}) - {p.product_type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Info Produk Terpilih */}
                            {selectedProductId && (() => {
                                const prod = products.find(p => String(p.id) === String(selectedProductId));
                                if (!prod) return null;
                                return (
                                    <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-md text-xs space-y-1 text-blue-900">
                                        <p className="font-bold text-[11px] text-blue-800 flex items-center justify-between">
                                            <span>Rincian Produk: {prod.product_name}</span>
                                            <span className="text-[10px] font-normal uppercase bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-mono">{prod.product_code}</span>
                                        </p>
                                        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-0.5">
                                            <div>
                                                <span className="text-gray-500">Biaya Admin:</span>{' '}
                                                <span className="font-semibold">{Number(prod.admin_fee) > 0 ? formatIDR(prod.admin_fee) : 'Gratis (Rp 0)'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Saldo Minimal:</span>{' '}
                                                <span className="font-semibold">{formatIDR(prod.minimum_balance || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Limit Belanja:</span>{' '}
                                                <span className="font-semibold">{prod.daily_withdrawal_limit ? formatIDR(prod.daily_withdrawal_limit) : 'Sesuai Tier'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Nisbah/Bagi Hasil:</span>{' '}
                                                <span className="font-semibold">{prod.interest_rate || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Pilihan Jenis Akad */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Jenis Akad Syariah <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={selectedAkadType}
                                    onChange={(e) => setSelectedAkadType(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="wadiah">Wadiah (Titipan Murni - Tanpa Biaya/Bunga)</option>
                                    <option value="mudharabah">Mudharabah (Bagi Hasil Syariah)</option>
                                </select>
                            </div>

                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>Perubahan produk tabungan akan memperbarui jenis tabungan nasabah santri tanpa mempengaruhi saldo maupun riwayat mutasi transaksi yang telah berjalan.</span>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsChangeProductOpen(false)}
                                    disabled={isUpdatingProduct}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={!selectedProductId || isUpdatingProduct}
                                    className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition-all disabled:opacity-50"
                                >
                                    {isUpdatingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                    Simpan Perubahan Produk
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NasabahDetailPage;
