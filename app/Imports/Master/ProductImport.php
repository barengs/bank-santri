<?php

namespace App\Imports\Master;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ProductImport implements
    ToCollection,
    WithHeadingRow,
    WithValidation,
    SkipsOnError,
    SkipsOnFailure
{
    private $errors = [];
    private $successCount = 0;
    private $failureCount = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            try {
                Product::updateOrCreate(
                    ['product_code' => $row['product_code']],
                    [
                        'product_name'           => $row['product_name'],
                        'akad_type'              => $row['akad_type'] ?? 'wadiah',
                        'minimum_balance'        => $row['minimum_balance'] ?? 0,
                        'daily_withdrawal_limit' => $row['daily_withdrawal_limit'] ?? 0,
                        'is_active'              => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                    ]
                );
                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Error pada produk {$row['product_code']}: " . $e->getMessage();
                $this->failureCount++;
                Log::error("Product import error: " . $e->getMessage());
            }
        }
    }

    public function rules(): array
    {
        return [
            'product_code' => 'required|string|max:50',
            'product_name' => 'required|string|max:255',
        ];
    }

    public function onError(\Throwable $e)
    {
        $this->errors[] = $e->getMessage();
    }

    public function onFailure(Failure ...$failures)
    {
        foreach ($failures as $failure) {
            $this->errors[] = "Row {$failure->row()}: " . implode(', ', $failure->errors());
            $this->failureCount++;
        }
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }

    public function getFailureCount(): int
    {
        return $this->failureCount;
    }
}
