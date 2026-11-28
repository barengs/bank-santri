import React, { useState, useMemo } from 'react';
import {
    Send,
    Search,
    ArrowRightLeft,
    CheckCircle2,
    Loader2,
    Info,
    Building2,
    User,
    X,
    AlertCircle
} from 'lucide-react';
import { useLazyGetAccountDetailQuery, useGetAccountsQuery } from '../../store/accountApi';
import { useFundTransferMutation } from '../../store/transactionApi';
import { toast } from 'react-toastify';

const TransferBankPage = () => {
    const [sourceInput, setSourceInput] = useState('');
    const [selectedSource, setSelectedSource] = useState(null);
    const [sourceError, setSourceError] = useState('');

    const [destMode, setDestMode] = useState('santri'); // 'santri' | 'instansi'
    const [destInput, setDestInput] = useState('');
    const [instansiSearch, setInstansiSearch] = useState('');
    const [selectedDest, setSelectedDest] = useState(null);
    const [destError, setDestError] = useState('');

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // API Hooks
    const [fetchAccountDetail, { isFetching: isCheckingSource }] = useLazyGetAccountDetailQuery();
    const [fetchDestDetail, { isFetching: isCheckingDest }] = useLazyGetAccountDetailQuery();
    const { data: instansiRes, isFetching: isLoadingInstansi } = useGetAccountsQuery(
        { is_instansi: 1, status: 'AKTIF', per_page: 100, for_transfer: 1 },
        { skip: destMode !== 'instansi' }
    );
    const [processTransfer, { isLoading: isProcessing }] = useFundTransferMutation();

    const instansiAccounts = useMemo(() => {
        const list = instansiRes?.data?.data || (Array.isArray(instansiRes?.data) ? instansiRes.data : []);
        if (!instansiSearch.trim()) return list;
        const q = instansiSearch.toLowerCase();
        return list.filter(
            (acc) =>
                acc.customer_name?.toLowerCase().includes(q) ||
                acc.account_number?.toLowerCase().includes(q)
        );
    }, [instansiRes, instansiSearch]);

    const formatIDR = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleCheckSource = async (e) => {
        e?.preventDefault();
        const query = sourceInput.trim();
        if (query.length < 3) return;

        setSourceError('');
        try {
            const res = await fetchAccountDetail(query).unwrap();
            if (res?.data) {
                setSelectedSource(res.data);
            } else {
                setSelectedSource(null);
                setSourceError('Rekening pengirim tidak ditemukan.');
            }
        } catch (err) {
            setSelectedSource(null);
            setSourceError(err?.data?.message || 'Rekening pengirim tidak ditemukan.');
        }
    };

    const handleCheckDest = async (e) => {
        e?.preventDefault();
        const query = destInput.trim();
        if (query.length < 3) return;

        setDestError('');
        try {
            const res = await fetchDestDetail(query).unwrap();
            if (res?.data) {
                setSelectedDest(res.data);
            } else {
                setSelectedDest(null);
                setDestError('Rekening tujuan tidak ditemukan.');
            }
        } catch (err) {
            setSelectedDest(null);
            setDestError(err?.data?.message || 'Rekening tujuan tidak ditemukan.');
        }
    };

    const handleDestModeChange = (mode) => {
        setDestMode(mode);
        setSelectedDest(null);
        setDestInput('');
        setInstansiSearch('');
        setDestError('');
    };

    const numericAmount = Number(amount || 0);
    const minBalance = Number(selectedSource?.product?.minimum_balance || 0);
    const maxTransferable = selectedSource ? Math.max(0, Number(selectedSource.balance || 0) - minBalance) : 0;
    const isSameAccount =
        selectedSource &&
        selectedDest &&
        selectedSource.account_number === selectedDest.account_number;
    const isExceedingBalance = selectedSource && numericAmount > maxTransferable;
    const isAmountValid = numericAmount >= 1000 && !isExceedingBalance;

    const canSubmit =
        !isProcessing &&
        !!selectedSource &&
        !!selectedDest &&
        !isSameAccount &&
        isAmountValid;

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        try {
            await processTransfer({
                source_account: selectedSource.account_number,
                destination_account: selectedDest.account_number,
                amount: numericAmount,
                description: description.trim() || `Transfer ke ${selectedDest.customer_name}`
            }).unwrap();

            toast.success('Transfer Antar Rekening Berhasil!');
            setSourceInput('');
            setSelectedSource(null);
            setSourceError('');
            setDestInput('');
            setInstansiSearch('');
            setSelectedDest(null);
            setDestError('');
            setAmount('');
            setDescription('');
        } catch (err) {
            toast.error('Gagal: ' + (err?.data?.message || 'Terjadi kesalahan sistem'));
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-800">Transfer Antar Rekening</h2>
                <p className="text-xs text-gray-500">
                    Pemindahbukuan saldo antar rekening santri maupun ke rekening instansi secara real-time
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Source & Dest Verification */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-3">
                    {/* Rekening Sumber */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-gray-600 uppercase block">
                            Rekening Sumber (Pengirim)
                        </label>
                        {!selectedSource ? (
                            <form onSubmit={handleCheckSource} className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="NIS / No. Rekening / No. Kartu Pengirim..."
                                        value={sourceInput}
                                        onChange={(e) => {
                                            setSourceInput(e.target.value);
                                            if (sourceError) setSourceError('');
                                        }}
                                        onBlur={() => sourceInput.trim().length >= 4 && handleCheckSource()}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCheckingSource || sourceInput.trim().length < 3}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
                                >
                                    {isCheckingSource ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Periksa'}
                                </button>
                            </form>
                        ) : (
                            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between text-xs">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-blue-900 truncate">
                                            {selectedSource.customer_name}
                                        </span>
                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700">
                                            {selectedSource.customer_id === 0 ? 'Instansi' : 'Santri'}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-blue-700 mt-0.5">
                                        No. Rek: {selectedSource.account_number} • Saldo:{' '}
                                        <span className="font-bold">{formatIDR(selectedSource.balance)}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSource(null);
                                        setSourceInput('');
                                        setSourceError('');
                                    }}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                    title="Ganti rekening pengirim"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        {sourceError && (
                            <p className="text-[11px] text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {sourceError}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center py-0.5">
                        <ArrowRightLeft className="w-4 h-4 text-gray-300" />
                    </div>

                    {/* Rekening Tujuan */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">
                                Rekening Tujuan (Penerima)
                            </label>
                            <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => handleDestModeChange('santri')}
                                    className={`px-2 py-0.5 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors ${
                                        destMode === 'santri'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <User className="w-3 h-3" />
                                    Santri
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDestModeChange('instansi')}
                                    className={`px-2 py-0.5 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors ${
                                        destMode === 'instansi'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Building2 className="w-3 h-3" />
                                    Instansi
                                </button>
                            </div>
                        </div>

                        {selectedDest ? (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-emerald-900 truncate">
                                            {selectedDest.customer_name}
                                        </span>
                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700">
                                            {selectedDest.customer_id === 0 ? 'Instansi' : 'Santri'}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-emerald-700 mt-0.5">
                                        No. Rek: {selectedDest.account_number}
                                        {selectedDest.product?.name ? ` • ${selectedDest.product.name}` : ''}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedDest(null);
                                        setDestInput('');
                                        setDestError('');
                                    }}
                                    className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded"
                                    title="Ganti rekening penerima"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : destMode === 'santri' ? (
                            <form onSubmit={handleCheckDest} className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="NIS / No. Rekening / No. Kartu Penerima..."
                                        value={destInput}
                                        onChange={(e) => {
                                            setDestInput(e.target.value);
                                            if (destError) setDestError('');
                                        }}
                                        onBlur={() => destInput.trim().length >= 4 && handleCheckDest()}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCheckingDest || destInput.trim().length < 3}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
                                >
                                    {isCheckingDest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Periksa'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama instansi atau nomor rekening..."
                                        value={instansiSearch}
                                        onChange={(e) => setInstansiSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                                    {isLoadingInstansi ? (
                                        <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                            Memuat rekening instansi...
                                        </div>
                                    ) : instansiAccounts.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-gray-500">
                                            Rekening instansi tidak ditemukan.
                                        </div>
                                    ) : (
                                        instansiAccounts.map((acc) => (
                                            <button
                                                key={acc.account_number}
                                                type="button"
                                                onClick={() => setSelectedDest(acc)}
                                                className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2"
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-xs font-semibold text-gray-800 truncate">
                                                        {acc.customer_name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {acc.account_number}
                                                        {acc.product?.name ? ` • ${acc.product.name}` : ''}
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
                                                    Pilih
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {destError && (
                            <p className="text-[11px] text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {destError}
                            </p>
                        )}
                        {isSameAccount && (
                            <p className="text-[11px] text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Rekening sumber dan tujuan tidak boleh sama.
                            </p>
                        )}
                    </div>
                </div>

                {/* Step 2: Final Amount & Confirmation */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">
                                Nominal Transfer (IDR)
                            </label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min="1000"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-base font-bold text-blue-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            {amount !== '' && numericAmount > 0 && numericAmount < 1000 && (
                                <p className="text-[11px] text-amber-600">Minimal transfer Rp 1.000.</p>
                            )}
                            {isExceedingBalance && (
                                <p className="text-[11px] text-red-600">
                                    Saldo tidak mencukupi (maksimal dapat ditransfer: {formatIDR(maxTransferable)}).
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase">
                                Keterangan Transfer
                            </label>
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
                                Pemindahbukuan instan tanpa biaya admin antar rekening santri maupun ke rekening instansi.
                            </p>
                        </div>
                        <button
                            onClick={handleTransfer}
                            disabled={!canSubmit}
                            className={`w-full py-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                                canSubmit
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
