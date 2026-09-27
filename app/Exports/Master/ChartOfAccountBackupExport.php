<?php

namespace App\Exports\Master;

use App\Models\ChartOfAccount;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ChartOfAccountBackupExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return ChartOfAccount::orderBy('coa_code')->get();
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
            'created_at',
            'updated_at',
        ];
    }

    public function map($coa): array
    {
        return [
            $coa->coa_code,
            $coa->account_name,
            $coa->account_type,
            $coa->parent_coa_code,
            $coa->level,
            $coa->is_postable,
            $coa->is_active,
            $coa->created_at?->format('Y-m-d H:i:s'),
            $coa->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
