import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    PlusCircle, 
    Search, 
    Wallet, 
    CheckCircle2, 
    Loader2, 
    Printer,
    Info,
    User,
    X,
    Lock,
    AlertTriangle,
    Layers,
    CheckSquare,
    Square
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../../store/accountApi';
import { useGetPaymentPackagesQuery } from '../../store/paymentApi';
import { useGetTransactionItemsQuery } from '../../store/transactionItemApi';
import { useLazyGetBillsByAccountQuery } from '../../store/billApi';
import { useCashTopUpMutation } from '../../store/topUpApi';
import { toast } from 'react-toastify';
import { printReceiptPdf } from '../../utils/reportPdf';

const TopUpCashPage = () => {
    const [nis, setNis] = useState('');
    const [amount, setAmount] = useState('');
    const [packageId, setPackageId] = useState('');
    const [selectedBillIds, setSelectedBillIds] = useState([]);
    const [selectedAddonIds, setSelectedAddonIds] = useState([]);
    const [notes, setNotes] = useState('');

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // API Hooks
    const [fetchAccount, { data: accountRes, isFetching: isChecking }] = useLazyGetAccountDetailQuery();
    const [fetchBills, { data: billsRes, isFetching: isFetchingBills }] = useLazyGetBillsByAccountQuery();
    const { data: packagesRes, isLoading: isLoadingPackages } = useGetPaymentPackagesQuery({ is_active: true });
    const { data: transactionItemsRes } = useGetTransactionItemsQuery({ is_active: true, all: true });
    const [processTopUp, { isLoading: isProcessing }] = useCashTopUpMutation();

    // Refs untuk teller keyboard shortcut
    const amountInputRef = useRef(null);
    const notesInputRef = useRef(null);
    const account = nis ? accountRes?.data : null;

    // Helper formatting IDR
    const formatIDR = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    // Format periode e.g. "2026-03" -> "Maret 2026"
    const formatPeriod = (periodStr) => {
        if (!periodStr) return '-';
        const [year, month] = periodStr.split('-');
        if (!year || !month) return periodStr;
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    // Unpaid bills (urut tertua / FIFO)
    const unpaidBills = useMemo(() => {
        const rawBills = billsRes?.data?.bills || [];
        return rawBills
            .filter(b => ['unpaid', 'partial', 'overdue'].includes(b.status))
            .sort((a, b) => (a.period || '').localeCompare(b.period || ''));
    }, [billsRes]);

    const packages = packagesRes?.data?.data || [];
    const allItems = useMemo(() => {
        const raw = transactionItemsRes?.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [];
    }, [transactionItemsRes]);

    const selectedPackage = useMemo(() => {
        return packages.find(p => p.id === Number(packageId)) || null;
    }, [packages, packageId]);

    // Rincian biaya yang TIDAK ada di dalam paket terpilih (Add-on)
    const availableAddons = useMemo(() => {
        if (!selectedPackage) return [];
        const packageItemIds = new Set(
            (selectedPackage.items || [])
                .map(i => i.transaction_item_id)
                .filter(Boolean)
        );
        return allItems.filter(item => !packageItemIds.has(item.id) && item.is_active);
    }, [selectedPackage, allItems]);

    // Trigger fetch tagihan saat data rekening berhasil dimuat
    useEffect(() => {
        if (accountRes?.data?.account_number) {
            fetchBills(accountRes.data.account_number);
            setSelectedBillIds([]);
            setSelectedAddonIds([]);
            setPackageId('');
            setAmount('');
            const timer = setTimeout(() => amountInputRef.current?.focus(), 150);
            return () => clearTimeout(timer);
        }
    }, [accountRes]);

    // Enter pada input NIS
    const handleNisKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nis.trim().length >= 3) {
                fetchAccount(nis.trim());
            }
        }
    };

    // Enter pada nominal
    const handleAmountKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            notesInputRef.current?.focus();
        }
    };

    // Enter pada catatan
    const handleNotesKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    };

    // Input nominal bebas (Top-up biasa)
    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        if (rawValue === '') {
            setAmount('');
            return;
        }
        const formattedValue = new Intl.NumberFormat('id-ID').format(Number(rawValue));
        setAmount(formattedValue);
    };

    // Ganti paket di dropdown
    const handlePackageChange = (e) => {
        const selectedId = e.target.value;
        setPackageId(selectedId);
        setSelectedAddonIds([]); // Reset add-ons saat ganti paket

        if (selectedId) {
            const pkg = packages.find(p => p.id === Number(selectedId));
            if (pkg) {
                const formattedAmt = new Intl.NumberFormat('id-ID').format(pkg.total_amount);
                setAmount(formattedAmt);
            }
        } else {
            setAmount('');
        }
    };

    // Toggle centang Add-on
    const handleToggleAddon = (addonId) => {
        let newAddons = [];
        if (selectedAddonIds.includes(addonId)) {
            newAddons = selectedAddonIds.filter(id => id !== addonId);
        } else {
            newAddons = [...selectedAddonIds, addonId];
        }
        setSelectedAddonIds(newAddons);

        // Update total amount: paket + total add-on
        if (selectedPackage) {
            const baseAmount = Number(selectedPackage.total_amount) || 0;
            const addonTotal = availableAddons
                .filter(a => newAddons.includes(a.id))
                .reduce((sum, a) => sum + (Number(a.default_amount) || 0), 0);
            setAmount(new Intl.NumberFormat('id-ID').format(baseAmount + addonTotal));
        }
    };

    // Toggle centang tagihan di sidebar kanan (Aturan FIFO Tertua)
    const handleToggleBill = (billId) => {
        const index = unpaidBills.findIndex(b => b.id === billId);
        if (index === -1) return;

        let newSelected = [];
        const isCurrentlyChecked = selectedBillIds.includes(billId);

        if (isCurrentlyChecked) {
            // Uncheck bill ini dan semua bulan sesudahnya (yang lebih baru)
            newSelected = unpaidBills.slice(0, index).map(b => b.id);
        } else {
            // Check bill ini dan semua bulan sebelumnya (yang lebih tua)
            newSelected = unpaidBills.slice(0, index + 1).map(b => b.id);
        }

        setSelectedBillIds(newSelected);

        if (newSelected.length > 0) {
            // Mode pelunasan tagihan: nonaktifkan pilihan paket & add-on
            setPackageId('');
            setSelectedAddonIds([]);
            const totalBills = unpaidBills
                .filter(b => newSelected.includes(b.id))
                .reduce((sum, b) => sum + (Number(b.remaining) || Number(b.amount)), 0);
            setAmount(new Intl.NumberFormat('id-ID').format(totalBills));
        } else {
            setAmount('');
        }
    };

    // Pilih semua tunggakan
    const handleSelectAllBills = () => {
        const allIds = unpaidBills.map(b => b.id);
        setSelectedBillIds(allIds);
        setPackageId('');
        setSelectedAddonIds([]);
        const total = unpaidBills.reduce((sum, b) => sum + (Number(b.remaining) || Number(b.amount)), 0);
        setAmount(new Intl.NumberFormat('id-ID').format(total));
    };

    // Batal pilih semua tunggakan
    const handleClearSelectedBills = () => {
        setSelectedBillIds([]);
        setAmount('');
    };

    // Submit transaksi
    const handleSubmit = async (e) => {
        e.preventDefault();
        const accountData = accountRes?.data;
        if (!accountData || !amount) return;

        const rawAmount = Number(amount.replace(/\./g, ''));

        try {
            let res;
            if (selectedBillIds.length > 0) {
                // 1. Pelunasan Tunggakan Tagihan
                res = await processTopUp({
                    account_number: accountData.account_number,
                    amount: rawAmount,
                    bill_ids: selectedBillIds,
                    notes: notes || undefined
                }).unwrap();

                const selectedPeriods = unpaidBills
                    .filter(b => selectedBillIds.includes(b.id))
                    .map(b => formatPeriod(b.period))
                    .join(', ');

                toast.success('Pelunasan tagihan berhasil!');
                setReceiptData({
                    payment_ref: res.data?.reference_number || 'BILL-' + Date.now(),
                    created_at: new Date().toISOString(),
                    account_number: accountData.account_number,
                    customer_name: accountData.customer_name,
                    package_name: `Pelunasan Tagihan (${selectedPeriods})`,
                    channel: 'teller',
                    amount: rawAmount,
                    type: 'Pelunasan Tagihan'
                });
            } else if (packageId) {
                // 2. Pembayaran Paket Reguler + Add-On
                res = await processTopUp({
                    account_number: accountData.account_number,
                    amount: rawAmount,
                    payment_package_id: Number(packageId),
                    addon_item_ids: selectedAddonIds.length > 0 ? selectedAddonIds : undefined,
                    notes: notes || undefined
                }).unwrap();

                const addonNames = availableAddons
                    .filter(a => selectedAddonIds.includes(a.id))
                    .map(a => a.item_name);

                const packageName = selectedPackage?.package_name || 'Paket Pembayaran';
                const fullDesc = addonNames.length > 0 
                    ? `${packageName} + Add-On: ${addonNames.join(', ')}`
                    : packageName;

                toast.success('Pembayaran paket berhasil diproses!');
                setReceiptData({
                    payment_ref: res.data?.payment_ref || res.data?.reference_number || 'REF-' + Date.now(),
                    created_at: new Date().toISOString(),
                    account_number: accountData.account_number,
                    customer_name: accountData.customer_name,
                    package_name: fullDesc,
                    channel: 'cash',
                    amount: rawAmount,
                    type: 'Pembayaran Paket'
                });
            } else {
                // 3. Top-Up Saldo Tabungan Santri
                res = await processTopUp({
                    account_number: accountData.account_number,
                    amount: rawAmount,
                    notes: notes || undefined
                }).unwrap();

                toast.success('Top-Up saldo tabungan santri berhasil!');
                setReceiptData({
                    payment_ref: res.data?.payment_ref || res.data?.reference_number || 'REF-' + Date.now(),
                    created_at: new Date().toISOString(),
                    account_number: accountData.account_number,
                    customer_name: accountData.customer_name,
                    package_name: 'Setoran Saldo Tabungan Bebas',
                    channel: 'cash',
                    amount: rawAmount,
                    type: 'Setor Tunai Tabungan'
                });
            }

            setShowReceipt(true);
            // Refresh data setelah berhasil
            if (accountData.account_number) {
                fetchBills(accountData.account_number);
                fetchAccount(accountData.account_number);
            }
        } catch (err) {
            toast.error(err.data?.message || 'Gagal memproses setoran tunai');
        }
    };

    const handleResetForm = () => {
        setNis('');
        setAmount('');
        setPackageId('');
        setSelectedBillIds([]);
        setSelectedAddonIds([]);
        setNotes('');
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
        handleResetForm();
    };

    // Mode aktif transaksi
    const isPayingBills = selectedBillIds.length > 0;
    const isPayingPackage = Boolean(packageId) && !isPayingBills;
    const isLockedAmount = isPayingBills || isPayingPackage;

    // Subtotal Addon
    const addonSubtotal = useMemo(() => {
        return availableAddons
            .filter(a => selectedAddonIds.includes(a.id))
            .reduce((sum, a) => sum + (Number(a.default_amount) || 0), 0);
    }, [availableAddons, selectedAddonIds]);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3 flex flex-wrap justify-between items-center gap-2">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Top-Up / Setor Tunai Teller</h2>
                    <p className="text-xs text-gray-500">Penerimaan kas masuk, pembayaran tagihan paket bulanan, & saldo tabungan santri</p>
                </div>
                {isPayingBills && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Mode Pelunasan Tagihan ({selectedBillIds.length} Bulan)
                    </span>
                )}
                {isPayingPackage && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        <Layers className="w-3 h-3 text-blue-600" />
                        Mode Paket {selectedAddonIds.length > 0 ? `+ ${selectedAddonIds.length} Add-On` : ''}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Kolom Kiri: Form Transaksi (2 Cols) */}
                <div className="lg:col-span-2 border border-gray-200 rounded-md p-4 space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-3.5">
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
                                    onKeyDown={handleNisKeyDown}
                                    onBlur={() => nis.length >= 4 && fetchAccount(nis)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                                {isChecking && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                            </div>
                        </div>

                        {/* Package Selection */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Pilih Paket Pembayaran</label>
                                {isPayingBills && (
                                    <span className="text-[10px] text-amber-600 font-medium italic">
                                        (Nonaktif: Tunggakan di panel kanan sedang dipilih)
                                    </span>
                                )}
                            </div>
                            <select 
                                value={packageId}
                                onChange={handlePackageChange}
                                disabled={isPayingBills}
                                className={`w-full px-2.5 py-1.5 bg-white border rounded-md text-xs outline-none transition-colors ${
                                    isPayingBills 
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                        : 'border-gray-300 focus:border-blue-500 cursor-pointer'
                                }`}
                            >
                                <option value="">-- Tanpa Paket (Hanya Top-Up Saldo Bebas) --</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.package_name} ({formatIDR(pkg.total_amount)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Rincian Biaya Tambahan (Add-On) - Tampil hanya bila paket dipilih dan bukan bayar tunggakan */}
                        {isPayingPackage && availableAddons.length > 0 && (
                            <div className="border border-blue-200 bg-blue-50/40 rounded-md p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                                        <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Rincian Biaya Tambahan (Add-On Opsional)</span>
                                    </div>
                                    {addonSubtotal > 0 && (
                                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                            + {formatIDR(addonSubtotal)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500">
                                    Centang item biaya di luar paket ini jika santri ingin menambah pembayaran sekaligus:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                                    {availableAddons.map((addon) => {
                                        const isChecked = selectedAddonIds.includes(addon.id);
                                        return (
                                            <label 
                                                key={addon.id} 
                                                onClick={() => handleToggleAddon(addon.id)}
                                                className={`flex items-start gap-2 p-2 rounded border cursor-pointer select-none transition-all ${
                                                    isChecked 
                                                        ? 'bg-blue-100/70 border-blue-400 text-blue-900 shadow-xs' 
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold leading-tight truncate">{addon.item_name}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600">{formatIDR(addon.default_amount)}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Jumlah Setoran (IDR)</label>
                                {isLockedAmount && (
                                    <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                                        <Lock className="w-3 h-3 text-emerald-600" />
                                        Nominal terkunci otomatis
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                <input 
                                    type="text"
                                    placeholder="0"
                                    ref={amountInputRef}
                                    value={amount}
                                    onChange={handleAmountChange}
                                    onKeyDown={handleAmountKeyDown}
                                    readOnly={isLockedAmount}
                                    className={`w-full pl-8 pr-3 py-2 border rounded-md text-base font-bold outline-none transition-colors ${
                                        isLockedAmount
                                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-700 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-emerald-600 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500'
                                    }`}
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
                                ref={notesInputRef}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onKeyDown={handleNotesKeyDown}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isProcessing || !account}
                            className={`w-full py-2.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                                account 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                            Proses & Cetak Struk
                        </button>
                    </form>
                </div>

                {/* Kolom Kanan: Sidebar Info Nasabah & Daftar Tagihan (1 Col) */}
                <div className="space-y-3">
                    {/* Kartu Profil Nasabah */}
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
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase">Saldo Tabungan Saat Ini</p>
                                <h3 className="text-base font-bold text-blue-600">{formatIDR(account?.balance || 0)}</h3>
                            </div>
                            {account && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                    {account.status || 'AKTIF'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Kartu Daftar Tunggakan / Tagihan (BARU) */}
                    <div className="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                <AlertTriangle className={`w-3.5 h-3.5 ${unpaidBills.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                                <span>Daftar Tagihan / Tunggakan</span>
                            </div>
                            {unpaidBills.length > 0 ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                    {unpaidBills.length} Bulan
                                </span>
                            ) : account ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                    Lunas
                                </span>
                            ) : null}
                        </div>

                        {isFetchingBills ? (
                            <div className="py-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Memeriksa tagihan...
                            </div>
                        ) : unpaidBills.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-400 italic">Centang bulan (urut tertua FIFO):</span>
                                    <div className="flex gap-1.5">
                                        <button 
                                            type="button" 
                                            onClick={handleSelectAllBills}
                                            className="text-blue-600 hover:underline font-semibold"
                                        >
                                            Semua
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button 
                                            type="button" 
                                            onClick={handleClearSelectedBills}
                                            className="text-rose-600 hover:underline font-semibold"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                                    {unpaidBills.map((bill, idx) => {
                                        const isChecked = selectedBillIds.includes(bill.id);
                                        const isOverdue = bill.is_overdue || bill.status === 'overdue';
                                        return (
                                            <div 
                                                key={bill.id}
                                                onClick={() => handleToggleBill(bill.id)}
                                                className={`p-2 rounded border cursor-pointer select-none transition-all flex items-start gap-2 ${
                                                    isChecked 
                                                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs' 
                                                        : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="mt-0.5">
                                                    {isChecked ? (
                                                        <CheckSquare className="w-4 h-4 text-amber-600" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold">{formatPeriod(bill.period)}</span>
                                                        <span className={`text-[9px] font-bold px-1 rounded ${
                                                            isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {isOverdue ? 'Jatuh Tempo' : 'Tagihan'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <span className="text-[10px] text-gray-500 font-mono">Bulan ke-{idx + 1}</span>
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {formatIDR(bill.remaining || bill.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {isPayingBills && (
                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-center">
                                        <p className="text-[10px] text-amber-700 font-semibold uppercase">Total Tagihan Terpilih</p>
                                        <p className="text-sm font-bold text-amber-900">{amount}</p>
                                    </div>
                                )}
                            </div>
                        ) : account ? (
                            <div className="py-3 text-center bg-emerald-50/50 border border-emerald-100 rounded text-emerald-700 text-xs font-semibold">
                                ✓ Tidak ada tunggakan tagihan
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2 italic">Masukkan NIS untuk melihat data tagihan</p>
                        )}
                    </div>

                    {/* Informasi Teller Adaptif */}
                    <div className="border border-gray-200 rounded-md p-3 space-y-1.5 bg-blue-50/50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                            <Info className="w-3.5 h-3.5" />
                            <span>Informasi Teller</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                            {isPayingBills ? (
                                <span className="text-amber-800 font-medium">
                                    Setoran tunai ini langsung dialokasikan untuk <strong>pelunasan tagihan periode terpilih</strong> ke kas operasional pesantren (tidak menambah saldo tabungan santri).
                                </span>
                            ) : isPayingPackage ? (
                                <span className="text-blue-800 font-medium">
                                    Setoran dialokasikan untuk pembayaran paket dan item add-on bulan berjalan.
                                </span>
                            ) : (
                                <span>
                                    Setoran tunai saldo bebas akan langsung masuk ke rekening tabungan santri untuk kebutuhan uang saku jajan.
                                </span>
                            )}
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
                                <span>Transaksi Berhasil</span>
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

                            <div className="space-y-1.5 text-gray-700">
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
                                    <span className="text-gray-400">Jenis:</span>
                                    <span className="font-medium text-right max-w-[200px] truncate">{receiptData.package_name}</span>
                                </div>
                            </div>

                            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded text-center">
                                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Total Setoran</span>
                                <span className="text-lg font-bold text-emerald-700">{formatIDR(receiptData.amount)}</span>
                            </div>
                        </div>

                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => printReceiptPdf(receiptData, 'BUKTI SETORAN TUNAI')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Cetak PDF
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
