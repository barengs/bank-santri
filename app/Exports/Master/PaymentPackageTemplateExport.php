<?php

namespace App\Exports\Master;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaymentPackageTemplateExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function array(): array
    {
        return [
            [
                'PKG-2026-GANJIL',
                'Paket Semester Ganjil 2026/2027',
                '2026/2027',
                'ganjil',
                'Paket standar pendaftaran & operasional',
                1,
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'package_code',
            'package_name',
            'academic_year',
            'semester',
            'description',
            'is_active',
        ];
    }

    public function title(): string
    {
        return 'Template Paket Pembayaran';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
