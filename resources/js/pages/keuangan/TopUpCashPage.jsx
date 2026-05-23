import React, { useState } from 'react';
import { 
    PlusCircle, 
    Search, 
    Wallet, 
    CheckCircle2, 
    Loader2, 
    Printer,
    ArrowDownCircle,
    Info,
    User,
    X
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../../store/accountApi';
import { useGetPaymentPackagesQuery } from '../../store/paymentApi';
import { useCashTopUpMutation } from '../../store/topUpApi';
import { toast } from 'react-toastify';

const TopUpCashPage = () => {
    const [nis, setNis] = useState('');
    const [amount, setAmount] = useState('');
    const [packageId, setPackageId] = useState('');
    const [notes, setNotes] = useState('');

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // API Hooks
    const [fetchAccount, { data: accountRes, isFetching: isChecking }] = useLazyGetAccountDetailQuery();
    const { data: packagesRes, isLoading: isLoadingPackages } = useGetPaymentPackagesQuery({ is_active: true });
    const [processTopUp, { isLoading: isProcessing }] = useCashTopUpMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleCheck = (e) => {
        e.preventDefault();
        if (nis.length >= 4) {
            fetchAccount(nis);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountRes?.data || !amount || !packageId) return;

        try {
            const res = await processTopUp({
                account_number: accountRes.data.account_number,
                payment_package_id: packageId,
                amount: Number(amount),
                notes: notes
            }).unwrap();

            toast.success('Top-up Tunai Berhasil!');

            // Set receipt data and show modal
            setReceiptData({
                ...res.data,
                customer_name: accountRes.data.customer_name,
                package_name: packages.find(p => p.id === Number(packageId))?.package_name || 'Pembayaran Paket'
            });
            setShowReceipt(true);

            // Refetch account detail in background to update the sidebar balance
            fetchAccount(accountRes.data.account_number);

            // Reset setoran input fields
            setAmount('');
            setPackageId('');
            setNotes('');
        } catch (err) {
            toast.error('Gagal: ' + (err.data?.message || 'Terjadi kesalahan sistem'));
        }
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
    };

    const handleResetForm = () => {
        setNis('');
        setAmount('');
        setPackageId('');
        setNotes('');
    };

    const account = nis ? accountRes?.data : null;
    const packages = packagesRes?.data?.data || [];

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Top-Up / Setor Tunai</h1>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Teller Deposit Counter</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* NIS Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Rekening Santri (NIS)</label>
                                    {account && (
                                        <button 
                                            type="button" 
                                            onClick={handleResetForm}
                                            className="text-[10px] font-black text-rose-600 hover:text-rose-700 uppercase tracking-wider transition-colors"
                                        >
                                            Batal / Reset
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Ketik NIS atau Scan Kartu..."
                                        value={nis}
                                        onChange={(e) => setNis(e.target.value)}
                                        onBlur={() => nis.length >= 4 && fetchAccount(nis)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-lg font-bold"
                                        required
                                    />
                                    {isChecking && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />}
                                </div>
                            </div>

                            {/* Package Selection */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pilih Paket Pembayaran</label>
                                <select 
                                    value={packageId}
                                    onChange={(e) => setPackageId(e.target.value)}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">-- Pilih Paket Pelunasan --</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.package_name} ({formatIDR(pkg.total_amount)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Jumlah Setoran</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</div>
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-emerald-600 focus:outline-none transition-all text-2xl font-black text-emerald-600"
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isProcessing || !account}
                                className={`w-full py-5 rounded-lg font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                    account 
                                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Printer className="w-5 h-5" />}
                                PROSES & CETAK STRUK
                            </button>
                        </form>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    {/* Account Stats */}
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-lg text-white shadow-xl space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <ArrowDownCircle className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center font-black">
                                {account?.customer_name?.[0] || <User className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase leading-tight">{account?.customer_name || 'NAMA NASABAH'}</h4>
                                <p className="text-[10px] font-bold opacity-60 uppercase">{account?.account_number || 'NIS••••••••'}</p>
                            </div>
                        </div>
                        <div className="relative z-10 pt-4 border-t border-white/10">
                            <p className="text-[10px] font-black opacity-40 uppercase mb-1">Saldo Saat Ini</p>
                            <h2 className="text-2xl font-black">{formatIDR(account?.balance || 0)}</h2>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            <Info className="w-4 h-4" />
                            Informasi Teller
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Setoran tunai akan langsung masuk ke saldo rekening santri dan secara otomatis memicu pelunasan paket tagihan yang dipilih.
                        </p>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print-backdrop">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between no-print">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="font-black text-slate-800 text-sm uppercase tracking-wider">Top-up Berhasil</span>
                            </div>
                            <button 
                                onClick={handleCloseReceipt}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Receipt Content Area */}
                        <div className="p-6 overflow-y-auto flex-1 text-slate-800" id="receipt-print-area">
                            <style dangerouslySetInnerHTML={{__html: `
                                @media print {
                                    body * {
                                        visibility: hidden;
                                    }
                                    #receipt-print-area, #receipt-print-area * {
                                        visibility: visible;
                                    }
                                    #receipt-print-area {
                                        position: absolute;
                                        left: 0;
                                        top: 0;
                                        width: 100%;
                                        padding: 0;
                                        margin: 0;
                                        box-shadow: none;
                                    }
                                    .no-print {
                                        display: none !important;
                                    }
                                }
                            `}} />

                            <div className="text-center space-y-2 mb-6">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">BANK SANTRI</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pesantren Digital Ecosystem</p>
                                <p className="text-[9px] text-slate-400">BUKTI SETORAN TUNAI</p>
                            </div>

                            <div className="border-t border-dashed border-slate-200 my-4"></div>

                            <div className="space-y-3 text-xs font-semibold text-slate-600">
                                <div className="flex justify-between">
                                    <span>No. Referensi:</span>
                                    <span className="font-bold text-slate-850">{receiptData.payment_ref}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tanggal:</span>
                                    <span className="font-bold text-slate-850">
                                        {new Date(receiptData.created_at).toLocaleString('id-ID', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>NIS / Rekening:</span>
                                    <span className="font-bold text-slate-850">{receiptData.account_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Nama Santri:</span>
                                    <span className="font-bold text-slate-850 uppercase">{receiptData.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Paket Pembayaran:</span>
                                    <span className="font-bold text-slate-850">{receiptData.package_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Metode:</span>
                                    <span className="font-bold text-slate-850 uppercase">{receiptData.channel === 'cash' ? 'Tunai (Teller)' : receiptData.channel}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-200 my-4"></div>

                            <div className="py-3 flex flex-col items-center justify-center bg-emerald-50 rounded-lg">
                                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Jumlah Setoran</span>
                                <span className="text-2xl font-black text-emerald-600 mt-1">{formatIDR(receiptData.amount)}</span>
                            </div>

                            <div className="border-t border-dashed border-slate-200 my-4"></div>

                            <div className="text-center space-y-1">
                                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Terima Kasih</p>
                                <p className="text-[9px] text-slate-450 leading-relaxed">
                                    Simpan struk ini sebagai bukti setoran yang sah.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer (Actions) */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 no-print">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm rounded-lg shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                            >
                                <Printer className="w-4 h-4" />
                                CETAK STRUK
                            </button>
                            <button
                                onClick={handleCloseReceipt}
                                className="px-5 py-3 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-black text-sm rounded-lg transition-all"
                            >
                                TUTUP
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopUpCashPage;
