<?php

namespace App\Imports\Master;

use App\Models\ChartOfAccount;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ChartOfAccountImport implements
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
                $parent = !empty($row['parent_coa_code']) ? trim((string)$row['parent_coa_code']) : null;

                ChartOfAccount::updateOrCreate(
                    ['coa_code' => trim((string)$row['coa_code'])],
                    [
                        'account_name'    => $row['account_name'],
                        'account_type'    => strtolower($row['account_type']),
                        'parent_coa_code' => $parent ?: null,
                        'level'           => $row['level'] ?? 1,
                        'is_postable'     => isset($row['is_postable']) ? (bool)$row['is_postable'] : true,
                        'is_active'       => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                    ]
                );
                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Error pada akun {$row['coa_code']}: " . $e->getMessage();
                $this->failureCount++;
                Log::error("COA import error: " . $e->getMessage());
            }
        }
    }

    public function rules(): array
    {
        return [
            'coa_code'     => 'required',
            'account_name' => 'required|string|max:255',
            'account_type' => 'required|in:asset,liability,equity,revenue,expense,zis,Aset,Liabilitas,Ekuitas,Pendapatan,Beban,Dana ZIS,ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE,ZIS',
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
