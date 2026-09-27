<?php

namespace App\Imports\Master;

use App\Models\PaymentPackage;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class PaymentPackageImport implements
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
                PaymentPackage::updateOrCreate(
                    ['package_code' => trim((string)$row['package_code'])],
                    [
                        'package_name'  => $row['package_name'],
                        'academic_year' => $row['academic_year'] ?? null,
                        'semester'      => $row['semester'] ?? null,
                        'description'   => $row['description'] ?? null,
                        'is_active'     => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                    ]
                );
                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Error pada paket {$row['package_code']}: " . $e->getMessage();
                $this->failureCount++;
                Log::error("PaymentPackage import error: " . $e->getMessage());
            }
        }
    }

    public function rules(): array
    {
        return [
            'package_code' => 'required|string|max:50',
            'package_name' => 'required|string|max:255',
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
