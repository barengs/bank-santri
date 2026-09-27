<?php

namespace App\Exports\Master;

use App\Models\PaymentPackage;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaymentPackageExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    public function collection()
    {
        return PaymentPackage::with('items')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Paket',
            'Nama Paket',
            'Tahun Ajaran',
            'Semester',
            'Total Tagihan',
            'Total Uang Saku',
            'Deskripsi',
            'Status Aktif',
            'Dibuat',
            'Diperbarui',
        ];
    }

    public function map($package): array
    {
        return [
            $package->id,
            $package->package_code,
            $package->package_name,
            $package->academic_year ?? '-',
            $package->semester ?? '-',
            $package->total_amount,
            $package->saku_amount,
            $package->description,
            $package->is_active ? 'Ya' : 'Tidak',
            $package->created_at?->format('Y-m-d H:i:s'),
            $package->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Paket Pembayaran';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
