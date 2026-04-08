import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Package, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useGetPaymentPackagesQuery } from '../../store/paymentApi';
import DataTable from '../../components/DataTable';

const PaketPembayaranPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data: packagesRes, isLoading } = useGetPaymentPackagesQuery({
        page,
        search,
        per_page: 10
    });

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'package_name',
            header: 'Nama Paket',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-gray-900">{row.original.package_name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.original.package_code}</span>
                </div>
            )
        },
        {
            accessorKey: 'total_amount',
            header: 'Total Tagihan',
            cell: ({ row }) => (
                <span className="font-bold text-indigo-600">
                    {formatIDR(row.original.total_amount)}
                </span>
            )
        },
        {
            accessorKey: 'saku_amount',
            header: 'Jatah Saku',
            cell: ({ row }) => (
                <span className="font-bold text-emerald-600">
                    {formatIDR(row.original.saku_amount)}
                </span>
            )
        },
        {
            accessorKey: 'academic_year',
            header: 'Periode',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700">{row.original.academic_year || '-'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{row.original.semester || ''}</span>
                </div>
            )
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    row.original.is_active 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                    {row.original.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {row.original.is_active ? 'Aktif' : 'Nonaktif'}
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Paket Pembayaran</h1>
                    <p className="text-sm text-gray-400 font-medium font-bold uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        Billing & Package Management
                    </p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                    <Plus className="w-4 h-4" />
                    TAMBAH PAKET BARU
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                    Definisikan paket rincian pembayaran (SPP, Asrama, Uang Saku) yang dapat dipilih oleh wali santri atau operator saat melakukan proses top-up saldo dan pelunasan tagihan.
                </p>
            </div>

            {/* Main Table */}
            <DataTable 
                columns={columns}
                data={packagesRes?.data?.data || []}
                isLoading={isLoading}
                meta={packagesRes?.data}
                onPageChange={setPage}
                onSearchChange={setSearch}
                placeholder="Cari nama atau kode paket..."
            />
        </div>
    );
};

export default PaketPembayaranPage;
