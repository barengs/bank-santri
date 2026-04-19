import React, { useState } from 'react';
import { 
    Send, 
    Search, 
    ArrowRightLeft, 
    CheckCircle2, 
    Loader2, 
    Info,
    User,
    ArrowRight
} from 'lucide-react';
import { useLazyGetAccountDetailQuery } from '../../store/accountApi';
import { useFundTransferMutation } from '../../store/transactionApi';
import { toast } from 'react-toastify';

const TransferBankPage = () => {
    const [sourceNis, setSourceNis] = useState('');
    const [destNis, setDestNis] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // API Hooks
    const [fetchSource, { data: sourceRes, isFetching: isCheckingSource }] = useLazyGetAccountDetailQuery();
    const [fetchDest, { data: destRes, isFetching: isCheckingDest }] = useLazyGetAccountDetailQuery();
    const [processTransfer, { isLoading: isProcessing }] = useFundTransferMutation();

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!sourceRes?.data || !destRes?.data || !amount) return;

        try {
            await processTransfer({
                source_account: sourceRes.data.account_number,
                destination_account: destRes.data.account_number,
                amount: Number(amount),
                description: description
            }).unwrap();

            toast.success('Transfer Berhasil!');
            setSourceNis('');
            setDestNis('');
            setAmount('');
            setDescription('');
        } catch (err) {
            toast.error('Gagal: ' + (err.data?.message || 'Terjadi kesalahan sistem'));
        }
    };

    const source = sourceRes?.data;
    const dest = destRes?.data;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Transfer Antar Rekening</h1>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Internal Fund Transfer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 1: Source & Dest Verification */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Rekening Sumber (Pengirim)</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="NIS Pengirim..."
                                    value={sourceNis}
                                    onChange={(e) => setSourceNis(e.target.value)}
                                    onBlur={() => sourceNis.length >= 4 && fetchSource(sourceNis)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
                                />
                                {isCheckingSource && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />}
                            </div>
                            {source && (
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md flex items-center justify-between">
                                    <span className="text-xs font-black text-indigo-700 uppercase">{source.customer_name}</span>
                                    <span className="text-xs font-black text-indigo-700 font-mono tracking-tighter">{formatIDR(source.balance)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center py-2">
                             <ArrowRightLeft className="w-6 h-6 text-gray-200" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Rekening Tujuan (Penerima)</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="NIS Penerima..."
                                    value={destNis}
                                    onChange={(e) => setDestNis(e.target.value)}
                                    onBlur={() => destNis.length >= 4 && fetchDest(destNis)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
                                />
                                {isCheckingDest && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />}
                            </div>
                            {dest && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md flex items-center justify-between">
                                    <span className="text-xs font-black text-emerald-700 uppercase">{dest.customer_name}</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 2: Final Amount & Confirmation */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm h-full flex flex-col justify-between space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nominal Transfer</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-400">Rp</div>
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-3xl font-black text-indigo-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Keterangan Transfer</label>
                                <textarea 
                                    rows="3"
                                    placeholder="Catatan tambahan (opsional)..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none transition-all text-sm font-medium"
                                ></textarea>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-gray-50">
                            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-md">
                                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                                    Transfer antar rekening bersifat instan. Pastikan data penerima sudah benar karena transaksi yang sudah diproses tidak dapat dibatalkan secara otomatis.
                                </p>
                            </div>
                            <button 
                                onClick={handleTransfer}
                                disabled={isProcessing || !source || !dest || Number(amount) < 100}
                                className={`w-full py-5 rounded-lg font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                    (source && dest) 
                                    ? 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                                PROSES TRANSFER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferBankPage;
