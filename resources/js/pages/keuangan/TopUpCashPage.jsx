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
        }).format(amount || 0);
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        if (rawValue === '') {
            setAmount('');
            return;
        }
        const formattedValue = new Intl.NumberFormat('id-ID').format(Number(rawValue));
        setAmount(formattedValue);
    };

    const handlePackageChange = (e) => {
        const selectedId = e.target.value;
        setPackageId(selectedId);
        if (selectedId) {
            const selectedPackage = packages.find(p => p.id === Number(selectedId));
            if (selectedPackage) {
                const formattedAmt = new Intl.NumberFormat('id-ID').format(selectedPackage.total_amount);
                setAmount(formattedAmt);
            }
        } else {
            setAmount('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountRes?.data || !amount) return;

        const rawAmount = Number(amount.replace(/\./g, ''));

        try {
            const res = await processTopUp({
                account_number: nis,
                amount: rawAmount,
                payment_package_id: packageId || null,
                notes: notes || undefined
            }).unwrap();

            toast.success('Top-Up setoran tunai berhasil!');
            
            setReceiptData({
                payment_ref: res.data?.payment_ref || res.data?.reference_number || 'REF-' + Date.now(),
                created_at: new Date().toISOString(),
                account_number: accountRes.data.account_number,
                customer_name: accountRes.data.customer_name,
                package_name: packages.find(p => p.id === Number(packageId))?.package_name || 'Setoran Saldo Bebas',
                channel: 'cash',
                amount: rawAmount
            });
            setShowReceipt(true);
        } catch (err) {
            toast.error(err.data?.message || 'Gagal memproses setoran tunai');
        }
    };

    const handleResetForm = () => {
        setNis('');
        setAmount('');
        setPackageId('');
        setNotes('');
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
        handleResetForm();
    };

    const account = nis ? accountRes?.data : null;
    const packages = packagesRes?.data?.data || [];

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Top-Up / Setor Tunai Teller</h2>
                <p className="text-xs text-gray-500">Penerimaan kas masuk dan penyetoran saldo tabungan santri</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Form Section */}
                <div className="md:col-span-2 border border-gray-200 rounded-md p-4 space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* NIS Input */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Rekening Santri (NIS)</label>
                                {account && (
                                    <button 
                                        type="button" 
                                        onClick={handleResetForm}
                                        className="text-xs text-rose-600 hover:underline"
                                    >
                                        Reset Form
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Ketik NIS atau Scan Kartu..."
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    onBlur={() => nis.length >= 4 && fetchAccount(nis)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                                {isChecking && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                            </div>
                        </div>

                        {/* Package Selection */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Pilih Paket Pembayaran</label>
                            <select 
                                value={packageId}
                                onChange={handlePackageChange}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:border-blue-500 outline-none cursor-pointer"
                            >
                                <option value="">-- Tanpa Paket (Hanya Top-Up Saldo Bebas) --</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.package_name} ({formatIDR(pkg.total_amount)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Jumlah Setoran (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                <input 
                                    type="text"
                                    placeholder="0"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md text-base font-bold text-emerald-600 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Catatan (Opsional)</label>
                            <input 
                                type="text"
                                placeholder="Keterangan tambahan..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isProcessing || !account}
                            className={`w-full py-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                                account 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                            Proses & Cetak Struk
                        </button>
                    </form>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-3">
                    <div className="border border-gray-200 rounded-md p-3.5 space-y-3 bg-gray-50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {account?.customer_name?.[0] || 'N'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs text-gray-800 truncate">{account?.customer_name || 'NAMA NASABAH'}</h4>
                                <p className="text-[10px] text-gray-400 font-mono">{account?.account_number || 'NIS••••••••'}</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Saldo Saat Ini</p>
                            <h3 className="text-lg font-bold text-blue-600">{formatIDR(account?.balance || 0)}</h3>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-md p-3 space-y-1.5 bg-blue-50/50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                            <Info className="w-3.5 h-3.5" />
                            <span>Informasi Teller</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                            Setoran tunai akan langsung masuk ke rekening santri dan otomatis memicu pelunasan paket pembayaran jika dipilih.
                        </p>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden flex flex-col">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Top-Up Berhasil</span>
                            </div>
                            <button onClick={handleCloseReceipt} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3 text-xs" id="receipt-print-area">
                            <div className="text-center pb-2 border-b border-gray-100">
                                <h3 className="font-bold text-sm text-gray-800">BANK SANTRI</h3>
                                <p className="text-[10px] text-gray-400 uppercase">BUKTI SETORAN TUNAI</p>
                            </div>

                            <div className="space-y-1 text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Ref:</span>
                                    <span className="font-mono font-semibold">{receiptData.payment_ref}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">NIS:</span>
                                    <span className="font-mono font-semibold">{receiptData.account_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Nama:</span>
                                    <span className="font-semibold uppercase">{receiptData.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Paket:</span>
                                    <span className="font-medium">{receiptData.package_name}</span>
                                </div>
                            </div>

                            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded text-center">
                                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Jumlah Setoran</span>
                                <span className="text-lg font-bold text-emerald-700">{formatIDR(receiptData.amount)}</span>
                            </div>
                        </div>

                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => window.print()}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Cetak
                            </button>
                            <button
                                onClick={handleCloseReceipt}
                                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-100"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopUpCashPage;
