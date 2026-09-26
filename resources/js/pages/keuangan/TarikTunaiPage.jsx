import React, { useState, useEffect } from 'react';
import { 
    ArrowUpCircle, 
    Search, 
    Wallet, 
    CheckCircle2, 
    Loader2, 
    Printer, 
    AlertCircle, 
    User, 
    X, 
    Building2, 
    ShieldCheck, 
    ShieldAlert,
    HelpCircle
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../../store/accountApi';
import { useCashWithdrawalMutation } from '../../store/transactionApi';
import { toast } from 'react-toastify';

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000];

const TarikTunaiPage = () => {
    const [nis, setNis] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [recipientName, setRecipientName] = useState('');

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // API Hooks
    const [fetchAccount, { data: accountRes, isFetching: isChecking, error: accountError }] = useLazyGetAccountDetailQuery();
    const [processWithdrawal, { isLoading: isProcessing }] = useCashWithdrawalMutation();

    const account = accountRes?.data;
    const isInstansi = account?.customer_id === 0;

    const formatIDR = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleCheck = (e) => {
        e?.preventDefault();
        if (nis.trim().length >= 3) {
            fetchAccount(nis.trim());
        }
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

    const setQuickAmount = (val) => {
        setAmount(new Intl.NumberFormat('id-ID').format(val));
    };

    const rawAmount = amount ? Number(amount.replace(/\./g, '')) : 0;
    const minBalance = account?.product?.minimum_balance || 0;
    const maxWithdrawable = account ? Math.max(0, account.balance - minBalance) : 0;
    const dailyLimit = account?.product?.daily_withdrawal_limit || 0;
    const isExceedingBalance = account && rawAmount > maxWithdrawable;

    const handleMaxWithdraw = () => {
        if (maxWithdrawable > 0) {
            setAmount(new Intl.NumberFormat('id-ID').format(maxWithdrawable));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!account || !rawAmount || rawAmount <= 0) return;

        if (isExceedingBalance) {
            toast.error(`Nominal melebihi saldo yang dapat ditarik (${formatIDR(maxWithdrawable)})`);
            return;
        }

        try {
            const res = await processWithdrawal({
                account_number: account.account_number,
                amount: rawAmount,
                description: description || 'Tarik tunai teller',
                recipient_name: recipientName || account.customer_name,
            }).unwrap();

            setReceiptData({
                reference_number: res.data?.reference_number || 'TRX-' + Date.now(),
                created_at: new Date().toISOString(),
                account_number: account.account_number,
                customer_name: account.customer_name,
                amount: rawAmount,
                balance_before: account.balance,
                balance_after: res.data?.balance_after ?? (account.balance - rawAmount),
                description: description || 'Penarikan Uang Saku',
                recipient_name: recipientName || account.customer_name,
            });

            setShowReceipt(true);
            toast.success("Penarikan tunai berhasil diproses!");

            fetchAccount(account.account_number);
            setAmount('');
            setDescription('');
            setRecipientName('');
        } catch (err) {
            toast.error(err?.data?.message || err?.message || "Gagal memproses penarikan tunai");
        }
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Tarik Tunai / Pencairan Kas Teller</h2>
                <p className="text-xs text-gray-500">Layanan penarikan uang saku santri & kas operasional oleh petugas loket</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Form Pencarian & Input Penarikan (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Pencarian Nasabah */}
                    <div className="border border-gray-200 rounded-md p-3.5 space-y-2">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase block">
                            Cari Rekening Santri / Instansi
                        </label>
                        <form onSubmit={handleCheck} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Ketik NIS Santri atau No. Rekening Instansi..." 
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isChecking || !nis.trim()}
                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md transition-colors flex items-center gap-1.5"
                            >
                                {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Periksa'}
                            </button>
                        </form>
                    </div>

                    {/* Form Penarikan */}
                    <div className={`border border-gray-200 rounded-md p-3.5 space-y-3 ${!account ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <Wallet className="w-4 h-4 text-amber-600" />
                                Nominal & Rincian Penarikan
                            </h3>
                            {account && (
                                <button 
                                    type="button" 
                                    onClick={handleMaxWithdraw}
                                    className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors"
                                >
                                    Tarik Maksimal
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 uppercase block">
                                    Nominal Penarikan (IDR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                                    <input 
                                        type="text" 
                                        placeholder="0" 
                                        value={amount}
                                        onChange={handleAmountChange}
                                        className={`w-full pl-8 pr-3 py-1.5 bg-white border rounded-md text-base font-bold outline-none transition-colors ${
                                            isExceedingBalance 
                                                ? 'border-rose-400 text-rose-600 focus:ring-1 focus:ring-rose-500' 
                                                : 'border-gray-300 text-gray-800 focus:ring-1 focus:ring-amber-500 focus:border-amber-500'
                                        }`}
                                    />
                                </div>
                                {isExceedingBalance && (
                                    <div className="flex items-center gap-1 text-rose-600 text-xs font-medium mt-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>Nominal melebihi saldo dapat ditarik ({formatIDR(maxWithdrawable)})</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase">Pilihan Cepat:</span>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {QUICK_AMOUNTS.map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setQuickAmount(val)}
                                            className="py-1 px-1 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 text-gray-700 font-medium text-[11px] rounded border border-gray-200 transition-colors"
                                        >
                                            {formatIDR(val)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Keterangan & Nama Pengambil */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase block">Nama Pengambil</label>
                                    <input 
                                        type="text" 
                                        placeholder={account?.customer_name || 'Santri / Wali'} 
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600 uppercase block">Keperluan / Catatan</label>
                                    <input 
                                        type="text" 
                                        placeholder="Contoh: Beli kitab..." 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing || !account || !rawAmount || rawAmount <= 0 || isExceedingBalance}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-1.5"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Memproses Penarikan...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpCircle className="w-3.5 h-3.5" />
                                        <span>Konfirmasi & Tarik Tunai</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Info Profil & Saldo Nasabah (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                    {account ? (
                        <div className="border border-gray-200 rounded-md p-3.5 space-y-3 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-amber-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                                    {isInstansi ? <Building2 className="w-5 h-5 text-white" /> : (account.customer_name ? account.customer_name.charAt(0) : 'S')}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800">
                                            {isInstansi ? 'Instansi' : 'Santri'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                                            {account.status}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 truncate mt-0.5">{account.customer_name}</h4>
                                    <p className="text-[10px] text-gray-500 font-mono">{account.account_number}</p>
                                </div>
                            </div>

                            {/* Saldo Details */}
                            <div className="border-t border-gray-200 pt-2.5 space-y-2 text-xs">
                                <div className="p-2.5 bg-amber-50 rounded border border-amber-200 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-semibold text-amber-800 uppercase block">Total Saldo</span>
                                        <span className="text-lg font-bold text-amber-700">{formatIDR(account.balance)}</span>
                                    </div>
                                    <Wallet className="w-6 h-6 text-amber-600 opacity-60" />
                                </div>

                                <div className="space-y-1 text-gray-700">
                                    <div className="flex justify-between py-1 border-b border-gray-200">
                                        <span className="text-gray-500">Saldo Minimum:</span>
                                        <span className="font-semibold">{formatIDR(minBalance)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200">
                                        <span className="text-gray-500">Dapat Ditarik:</span>
                                        <span className="font-bold text-emerald-700">{formatIDR(maxWithdrawable)}</span>
                                    </div>
                                    {!isInstansi && (
                                        <div className="flex justify-between py-1">
                                            <span className="text-gray-500">Limit Harian:</span>
                                            <span className="font-semibold">
                                                {dailyLimit > 0 ? formatIDR(dailyLimit) + ' / hari' : 'Bebas'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-md p-5 text-center space-y-1.5 bg-gray-50">
                            <User className="w-6 h-6 text-gray-300 mx-auto" />
                            <h4 className="text-xs font-bold text-gray-700">Belum Ada Rekening Terpilih</h4>
                            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                                Masukkan NIS santri pada kolom pencarian untuk memeriksa saldo dan kuota penarikan kas.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Thermal Receipt Print Modal */}
            {showReceipt && receiptData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
                    <div className="relative w-full max-w-sm bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden">
                        <div className="p-4 bg-white" id="printable-receipt">
                            <div className="text-center pb-2 border-b border-gray-200">
                                <h3 className="font-bold text-sm text-gray-800">BANK SANTRI PESANTREN</h3>
                                <p className="text-[10px] text-gray-500 uppercase">Bukti Penarikan Tunai Kas</p>
                            </div>

                            <div className="space-y-1 text-xs py-2 text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Ref:</span>
                                    <span className="font-mono font-semibold">{receiptData.reference_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Waktu:</span>
                                    <span className="font-semibold">
                                        {new Date(receiptData.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Rekening:</span>
                                    <span className="font-mono font-semibold">{receiptData.account_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Nama:</span>
                                    <span className="font-semibold uppercase">{receiptData.customer_name}</span>
                                </div>
                                {receiptData.recipient_name && receiptData.recipient_name !== receiptData.customer_name && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Pengambil:</span>
                                        <span className="font-semibold">{receiptData.recipient_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-2.5 bg-amber-50 rounded text-center border border-amber-200 my-2">
                                <span className="text-[10px] text-amber-800 uppercase font-semibold block">Nominal Penarikan</span>
                                <span className="text-lg font-bold text-amber-700">{formatIDR(receiptData.amount)}</span>
                            </div>

                            <div className="space-y-1 text-xs text-gray-700 pt-1 border-t border-gray-100">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Saldo Sebelumnya:</span>
                                    <span>{formatIDR(receiptData.balance_before)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span className="text-gray-500">Sisa Saldo:</span>
                                    <span className="text-gray-900">{formatIDR(receiptData.balance_after)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded flex items-center gap-1"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Cetak Slip
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseReceipt}
                                className="px-3 py-1.5 border border-gray-300 text-gray-700 font-semibold text-xs rounded hover:bg-gray-100"
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

export default TarikTunaiPage;
