<?php

namespace App\Exports\Master;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductTemplateExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function array(): array
    {
        return [
            [
                'TAB-SANTRI',
                'Tabungan Santri Reguler',
                'wadiah',
                10000,
                50000,
                1,
            ],
            [
                'TAB-WADIAH-PLUS',
                'Tabungan Wadiah Plus',
                'wadiah',
                25000,
                100000,
                1,
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'product_code',
            'product_name',
            'akad_type',
            'minimum_balance',
            'daily_withdrawal_limit',
            'is_active',
        ];
    }

    public function title(): string
    {
        return 'Template Produk';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
