import React, { useState } from 'react';
import { X, Printer, Calendar, FileText } from 'lucide-react';

const RekeningKoranModal = ({ isOpen, onClose, accountNumber, customerName }) => {
    if (!isOpen) return null;

    const [filterType, setFilterType] = useState('month'); // 'month' | 'date_range'
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

    // Default 30 hari terakhir untuk date range
    const [startDate, setStartDate] = useState(
        new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const handlePrint = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (token) params.append('token', token);

        if (filterType === 'month') {
            params.append('month', selectedMonth);
            params.append('year', selectedYear);
        } else {
            params.append('start_date', startDate);
            params.append('end_date', endDate);
        }

        const url = `/api/main/account/${accountNumber}/rekening-koran/print?${params.toString()}`;
        window.open(url, '_blank');
        onClose();
    };

    const months = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Cetak Rekening Koran</h3>
                            <p className="text-xs text-gray-500 font-mono">
                                {accountNumber} {customerName ? `• ${customerName}` : ''}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handlePrint} className="p-5 space-y-4">
                    {/* Filter Type Tabs */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Pilih Mode Filter Periode
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-md">
                            <button
                                type="button"
                                onClick={() => setFilterType('month')}
                                className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                                    filterType === 'month'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Per Bulan
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType('date_range')}
                                className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                                    filterType === 'date_range'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Rentang Tanggal
                            </button>
                        </div>
                    </div>

                    {filterType === 'month' ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Bulan
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {months.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Tahun
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y.toString()}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Dari Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Sampai Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-md">
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            Rekening koran memuat saldo awal periode, seluruh rincian debit/kredit, saldo akhir, serta pengesahan teller.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Cetak PDF
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RekeningKoranModal;
