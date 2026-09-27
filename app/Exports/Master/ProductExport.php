<?php

namespace App\Exports\Master;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    public function collection()
    {
        return Product::all();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Produk',
            'Nama Produk',
            'Akad Syariah',
            'Min. Saldo',
            'Limit Tarik/Hari',
            'Status Aktif',
            'Dibuat',
            'Diperbarui',
        ];
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->product_code,
            $product->product_name,
            $product->akad_type ?? '-',
            $product->minimum_balance,
            $product->daily_withdrawal_limit,
            $product->is_active ? 'Ya' : 'Tidak',
            $product->created_at?->format('Y-m-d H:i:s'),
            $product->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Produk Tabungan';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
