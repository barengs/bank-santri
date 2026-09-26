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
        }).format(amount || 0);
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

            toast.success('Transfer Antar Rekening Berhasil!');
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
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Transfer Antar Rekening Santri</h2>
                <p className="text-xs text-gray-500">Pemindahan bukuan saldo antar rekening tabungan secara real-time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Source & Dest Verification */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-3">
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Rekening Sumber (Pengirim)</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="NIS Pengirim..."
                                value={sourceNis}
                                onChange={(e) => setSourceNis(e.target.value)}
                                onBlur={() => sourceNis.length >= 4 && fetchSource(sourceNis)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {isCheckingSource && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                        </div>
                        {source && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between text-xs mt-1">
                                <span className="font-semibold text-blue-800">{source.customer_name}</span>
                                <span className="font-bold text-blue-700">{formatIDR(source.balance)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center py-1">
                        <ArrowRightLeft className="w-4 h-4 text-gray-300" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase">Rekening Tujuan (Penerima)</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="NIS Penerima..."
                                value={destNis}
                                onChange={(e) => setDestNis(e.target.value)}
                                onBlur={() => destNis.length >= 4 && fetchDest(destNis)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {isCheckingDest && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                        </div>
                        {dest && (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs mt-1">
                                <span className="font-semibold text-emerald-800">{dest.customer_name}</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Final Amount & Confirmation */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Nominal Transfer (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                <input 
                                    type="number" 
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-base font-bold text-blue-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">Keterangan Transfer</label>
                            <textarea 
                                rows="2"
                                placeholder="Catatan tambahan (opsional)..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            ></textarea>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 p-2 rounded text-[11px] text-blue-800">
                            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <p>
                                Pemindahbukuan instan tanpa biaya admin antar sesama rekening santri.
                            </p>
                        </div>
                        <button 
                            onClick={handleTransfer}
                            disabled={isProcessing || !source || !dest || Number(amount) < 100}
                            className={`w-full py-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                                (source && dest && Number(amount) >= 100) 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Proses Transfer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferBankPage;
