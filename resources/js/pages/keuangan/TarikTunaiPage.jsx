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

    // Derived Limits & Balances
    const currentBalance = Number(account?.balance || 0);
    const minBalance = Number(account?.product?.minimum_balance || 0);
    const dailyLimit = Number(account?.daily_withdrawal_limit || account?.product?.daily_withdrawal_limit || 0);
    const maxWithdrawable = Math.max(0, currentBalance - minBalance);

    const rawAmount = Number(amount.toString().replace(/\./g, ''));
    const isExceedingBalance = rawAmount > maxWithdrawable;

    const handleMaxWithdraw = () => {
        if (maxWithdrawable > 0) {
            let targetAmt = maxWithdrawable;
            if (!isInstansi && dailyLimit > 0) {
                targetAmt = Math.min(targetAmt, dailyLimit);
            }
            setAmount(new Intl.NumberFormat('id-ID').format(targetAmt));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!account || !rawAmount || rawAmount <= 0) return;

        if (isExceedingBalance) {
            toast.error("Nominal penarikan melebihi saldo yang tersedia.");
            return;
        }

        try {
            const desc = description.trim() || (isInstansi ? 'Pencairan operasional kas instansi' : 'Penarikan tunai uang saku santri');
            const res = await processWithdrawal({
                account_number: account.account_number,
                amount: rawAmount,
                description: recipientName ? `${desc} (Penerima: ${recipientName})` : desc,
            }).unwrap();

            const trxData = res.data;

            setReceiptData({
                reference_number: trxData?.transaction?.reference_number || 'TRX-' + Date.now(),
                created_at: trxData?.transaction?.created_at || new Date().toISOString(),
                account_number: account.account_number,
                customer_name: account.customer_name,
                is_instansi: isInstansi,
                product_name: account.product?.product_name || 'Tabungan',
                amount: rawAmount,
                balance_before: trxData?.balance_before ?? account.balance,
                balance_after: trxData?.balance_after ?? (account.balance - rawAmount),
                remaining_quota: trxData?.remaining_quota,
                daily_limit: trxData?.daily_limit,
                description: desc,
                recipient_name: recipientName || account.customer_name,
            });

            setShowReceipt(true);
            toast.success("Penarikan tunai berhasil diproses!");

            // Refresh account data
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
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                        <ArrowUpCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Tarik Tunai / Pencairan Kas</h1>
                        <p className="text-xs text-slate-500 font-medium">Layanan penarikan uang saku santri & kas instansi pesantren oleh teller.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Pencarian & Input Penarikan (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Card 1: Pencarian Nasabah */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                            Cari Rekening Santri / Instansi
                        </label>
                        <form onSubmit={handleCheck} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Ketik NIS Santri atau No. Rekening Instansi..." 
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isChecking || !nis.trim()}
                                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center gap-2"
                            >
                                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Periksa'}
                            </button>
                        </form>
                    </div>

                    {/* Card 2: Form Penarikan */}
                    <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 transition-all ${!account ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-amber-600" />
                                Nominal & Rincian Penarikan
                            </h2>
                            {account && (
                                <button 
                                    type="button" 
                                    onClick={handleMaxWithdraw}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    Tarik Maksimal
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Input Nominal */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                                    Nominal Penarikan (IDR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                                    <input 
                                        type="text" 
                                        placeholder="0"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl text-2xl font-black transition-all focus:outline-none ${
                                            isExceedingBalance 
                                                ? 'border-rose-300 text-rose-600 focus:ring-rose-500/20' 
                                                : 'border-slate-200 text-slate-800 focus:ring-amber-500/20 focus:border-amber-500'
                                        }`}
                                    />
                                </div>

                                {isExceedingBalance && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold mt-1">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Nominal melebihi saldo yang dapat ditarik ({formatIDR(maxWithdrawable)})</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pilihan Cepat Nominal:</label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {QUICK_AMOUNTS.map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setQuickAmount(val)}
                                            className="py-2.5 px-2 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all active:scale-95"
                                        >
                                            {formatIDR(val)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Keterangan & Nama Pengambil */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                                        Nama Pengambil (Opsional)
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder={account?.customer_name || 'Santri sendiri / Wali'} 
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                                        Keperluan / Catatan
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Contoh: Beli kitab, uang jajan, dll." 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isProcessing || !account || !rawAmount || rawAmount <= 0 || isExceedingBalance}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Memproses Penarikan...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpCircle className="w-5 h-5" />
                                        <span>Konfirmasi & Tarik Tunai</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Info Profil & Saldo Nasabah (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {account ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                            {/* Card Header Profil */}
                            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-700/60 border border-slate-600 flex items-center justify-center font-black text-2xl text-amber-400 shadow-inner overflow-hidden shrink-0">
                                        {account.student?.photo ? (
                                            <img src={account.student.photo} alt={account.customer_name} className="w-full h-full object-cover" />
                                        ) : isInstansi ? (
                                            <Building2 className="w-8 h-8 text-amber-400" />
                                        ) : (
                                            account.customer_name ? account.customer_name.charAt(0) : 'S'
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                isInstansi ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                                            }`}>
                                                {isInstansi ? 'Rekening Instansi' : 'Rekening Santri'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                                                {account.status}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black tracking-tight leading-snug">{account.customer_name}</h3>
                                        <p className="text-xs text-slate-400 font-mono">No. Rekening: {account.account_number}</p>
                                    </div>
                                </div>

                                {account.student && (
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/50 text-[11px] text-slate-300">
                                        <div>
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold">Kamar / Asrama:</span>
                                            <span className="font-semibold">{account.student.current_room?.hostel_name || '-'} / {account.student.current_room?.room_name || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold">Kelas:</span>
                                            <span className="font-semibold">{account.student.current_class?.class_name || '-'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Saldo Details */}
                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Total Saldo Rekening</span>
                                        <span className="text-2xl font-black text-amber-600">{formatIDR(account.balance)}</span>
                                    </div>
                                    <Wallet className="w-8 h-8 text-amber-500/30" />
                                </div>

                                <div className="space-y-2 text-xs font-semibold text-slate-600">
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-400">Produk Tabungan:</span>
                                        <span className="font-bold text-slate-800">{account.product?.product_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-400">Akad Syariah:</span>
                                        <span className="font-bold text-slate-800 uppercase">{account.akad_type || 'Wadiah'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-400">Saldo Minimum Mengendap:</span>
                                        <span className="font-bold text-slate-800">{formatIDR(minBalance)}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-400">Saldo Dapat Ditarik:</span>
                                        <span className="font-bold text-emerald-600">{formatIDR(maxWithdrawable)}</span>
                                    </div>

                                    {!isInstansi && (
                                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-400">Batas Limit Harian:</span>
                                            <span className="font-bold text-slate-800">
                                                {dailyLimit > 0 ? formatIDR(dailyLimit) + ' / hari' : <span className="text-slate-400 italic">Tanpa Batas</span>}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Penarikan kas teller otomatis memotong saldo simpanan wadiah dan menerbitkan jurnal kas keluar secara real-time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <User className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-700">Belum Ada Rekening Terpilih</h3>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Masukkan NIS santri atau nomor rekening instansi di samping untuk memeriksa saldo dan kuota penarikan.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Thermal Receipt Print Modal */}
            {showReceipt && receiptData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                        {/* Printable Slip Content */}
                        <div className="p-6 bg-white print:p-0 print:m-0" id="printable-receipt">
                            <div className="text-center space-y-1">
                                <h2 className="text-base font-black text-slate-900 tracking-tight">BANK SANTRI PESANTREN</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Slip Penarikan Tunai Kas</p>
                                <p className="text-[9px] text-slate-400">Bukti Pengambilan Uang Saku & Kas</p>
                            </div>

                            <div className="border-t border-dashed border-slate-300 my-3"></div>

                            <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">No. Ref:</span>
                                    <span className="font-mono font-bold text-slate-800">{receiptData.reference_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Waktu:</span>
                                    <span className="font-bold text-slate-800">
                                        {new Date(receiptData.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">No. Rekening:</span>
                                    <span className="font-bold text-slate-800">{receiptData.account_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Nama:</span>
                                    <span className="font-bold text-slate-800 uppercase">{receiptData.customer_name}</span>
                                </div>
                                {receiptData.recipient_name && receiptData.recipient_name !== receiptData.customer_name && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Pengambil:</span>
                                        <span className="font-bold text-slate-800">{receiptData.recipient_name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Keperluan:</span>
                                    <span className="font-bold text-slate-800">{receiptData.description}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-300 my-3"></div>

                            {/* Nominal Box */}
                            <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">Nominal Penarikan</span>
                                <span className="text-2xl font-black text-amber-600">{formatIDR(receiptData.amount)}</span>
                            </div>

                            <div className="space-y-1.5 text-[11px] font-semibold text-slate-600 mt-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Saldo Sebelumnya:</span>
                                    <span className="font-bold text-slate-700">{formatIDR(receiptData.balance_before)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Sisa Saldo:</span>
                                    <span className="font-black text-slate-900">{formatIDR(receiptData.balance_after)}</span>
                                </div>
                                {receiptData.remaining_quota !== null && receiptData.remaining_quota !== undefined && (
                                    <div className="flex justify-between text-amber-700">
                                        <span>Sisa Kuota Hari Ini:</span>
                                        <span className="font-black">{formatIDR(receiptData.remaining_quota)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-slate-300 my-4"></div>

                            {/* Signature Columns */}
                            <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-1">
                                <div className="space-y-8">
                                    <span className="text-slate-400 font-bold block">Penerima Kas</span>
                                    <span className="border-t border-slate-400 pt-1 block font-bold text-slate-800">
                                        ( {receiptData.recipient_name || 'Santri/Wali'} )
                                    </span>
                                </div>
                                <div className="space-y-8">
                                    <span className="text-slate-400 font-bold block">Teller Bank</span>
                                    <span className="border-t border-slate-400 pt-1 block font-bold text-slate-800">
                                        ( Petugas Loket )
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 no-print">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-all"
                            >
                                <Printer className="w-4 h-4" />
                                Cetak Slip
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseReceipt}
                                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition-all"
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
