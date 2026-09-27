<?php

namespace App\Exports\Master;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProductBackupExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Product::all();
    }

    public function headings(): array
    {
        return [
            'id',
            'product_code',
            'product_name',
            'akad_type',
            'minimum_balance',
            'daily_withdrawal_limit',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->product_code,
            $product->product_name,
            $product->akad_type,
            $product->minimum_balance,
            $product->daily_withdrawal_limit,
            $product->is_active,
            $product->created_at?->format('Y-m-d H:i:s'),
            $product->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
