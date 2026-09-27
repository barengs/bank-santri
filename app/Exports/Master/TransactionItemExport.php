<?php

namespace App\Exports\Master;

use App\Models\TransactionItem;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TransactionItemExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    public function collection()
    {
        return TransactionItem::with('coa')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Item',
            'Kode COA',
            'Nama COA',
            'Tipe Entry',
            'Mode Nilai',
            'Jumlah Default',
            'Akun Tujuan',
            'Deskripsi',
            'Status Aktif',
            'Dibuat',
            'Diperbarui',
        ];
    }

    public function map($item): array
    {
        return [
            $item->id,
            $item->item_name,
            $item->coa_code,
            $item->coa?->account_name ?? '-',
            $item->entry_type,
            $item->value_mode,
            $item->default_amount,
            $item->destination_account ?? '-',
            $item->description,
            $item->is_active ? 'Ya' : 'Tidak',
            $item->created_at?->format('Y-m-d H:i:s'),
            $item->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Item Transaksi';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
