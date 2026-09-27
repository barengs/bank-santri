<?php

namespace App\Exports\Master;

use App\Models\PaymentPackage;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PaymentPackageBackupExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return PaymentPackage::all();
    }

    public function headings(): array
    {
        return [
            'id',
            'package_code',
            'package_name',
            'description',
            'academic_year',
            'semester',
            'total_amount',
            'saku_amount',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function map($package): array
    {
        return [
            $package->id,
            $package->package_code,
            $package->package_name,
            $package->description,
            $package->academic_year,
            $package->semester,
            $package->total_amount,
            $package->saku_amount,
            $package->is_active,
            $package->created_at?->format('Y-m-d H:i:s'),
            $package->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
