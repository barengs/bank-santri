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
    User
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
            await processTopUp({
                account_number: accountRes.data.account_number,
                payment_package_id: packageId,
                amount: Number(amount),
                notes: notes
            }).unwrap();

            toast.success('Top-up Tunai Berhasil!');
            setNis('');
            setAmount('');
            setPackageId('');
            setNotes('');
        } catch (err) {
            toast.error('Gagal: ' + (err.data?.message || 'Terjadi kesalahan sistem'));
        }
    };

    const account = accountRes?.data;
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
                    <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* NIS Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Rekening Santri (NIS)</label>
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
                            <div className="w-12 h-12 bg-white/20 rounded-md flex items-center justify-center font-black">
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

                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-4">
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
        </div>
    );
};

export default TopUpCashPage;
