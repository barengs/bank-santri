<?php

namespace App\Exports\Master;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ChartOfAccountTemplateExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function array(): array
    {
        return [
            [
                '1000',
                'Aset Lancar',
                'asset',
                '',
                1,
                0,
                1,
            ],
            [
                '1100',
                'Kas dan Bank',
                'asset',
                '1000',
                2,
                1,
                1,
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'coa_code',
            'account_name',
            'account_type',
            'parent_coa_code',
            'level',
            'is_postable',
            'is_active',
        ];
    }

    public function title(): string
    {
        return 'Template COA';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
