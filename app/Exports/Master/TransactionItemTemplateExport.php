<?php

namespace App\Exports\Master;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TransactionItemTemplateExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function array(): array
    {
        return [
            [
                'Biaya Pendaftaran',
                '4000',
                'credit',
                'fixed',
                150000,
                '',
                'Biaya Pendaftaran Santri Baru',
                1,
            ],
            [
                'Setoran Tunai',
                '1100',
                'debit',
                'dynamic',
                0,
                '',
                'Setoran tunai ke kas',
                1,
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'item_name',
            'coa_code',
            'entry_type',
            'value_mode',
            'default_amount',
            'destination_account',
            'description',
            'is_active',
        ];
    }

    public function title(): string
    {
        return 'Template Item Transaksi';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
