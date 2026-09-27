<?php

namespace App\Exports\Master;

use App\Models\ChartOfAccount;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ChartOfAccountExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    public function collection()
    {
        return ChartOfAccount::orderBy('coa_code')->get();
    }

    public function headings(): array
    {
        return [
            'Kode Akun',
            'Nama Akun',
            'Tipe Akun',
            'Grup Akun',
            'Saldo Normal',
            'Parent Akun',
            'Level',
            'Dapat Diposting',
            'Status Aktif',
            'Dibuat',
            'Diperbarui',
        ];
    }

    public function map($coa): array
    {
        return [
            $coa->coa_code,
            $coa->account_name,
            $coa->account_type,
            $coa->group,
            $coa->normal_balance,
            $coa->parent_coa_code ?? '-',
            $coa->level,
            $coa->is_postable ? 'Ya' : 'Tidak',
            $coa->is_active ? 'Ya' : 'Tidak',
            $coa->created_at?->format('Y-m-d H:i:s'),
            $coa->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Bagan Akun (COA)';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
