<?php

namespace App\Exports\Master;

use App\Models\TransactionItem;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionItemBackupExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return TransactionItem::all();
    }

    public function headings(): array
    {
        return [
            'id',
            'item_name',
            'coa_code',
            'entry_type',
            'value_mode',
            'default_amount',
            'destination_account',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function map($item): array
    {
        return [
            $item->id,
            $item->item_name,
            $item->coa_code,
            $item->entry_type,
            $item->value_mode,
            $item->default_amount,
            $item->destination_account,
            $item->description,
            $item->is_active,
            $item->created_at?->format('Y-m-d H:i:s'),
            $item->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
