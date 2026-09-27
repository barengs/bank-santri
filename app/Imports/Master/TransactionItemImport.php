<?php

namespace App\Imports\Master;

use App\Models\TransactionItem;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class TransactionItemImport implements
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
                $destAccount = !empty($row['destination_account']) ? trim((string)$row['destination_account']) : null;
                $coaCode = !empty($row['coa_code']) ? trim((string)$row['coa_code']) : null;

                TransactionItem::updateOrCreate(
                    ['item_name' => trim((string)$row['item_name'])],
                    [
                        'coa_code'            => $coaCode,
                        'entry_type'          => strtolower($row['entry_type'] ?? 'credit'),
                        'value_mode'          => strtolower($row['value_mode'] ?? 'fixed'),
                        'default_amount'      => $row['default_amount'] ?? 0,
                        'destination_account' => $destAccount ?: null,
                        'description'         => $row['description'] ?? null,
                        'is_active'           => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                    ]
                );
                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Error pada item {$row['item_name']}: " . $e->getMessage();
                $this->failureCount++;
                Log::error("TransactionItem import error: " . $e->getMessage());
            }
        }
    }

    public function rules(): array
    {
        return [
            'item_name'  => 'required|string|max:255',
            'entry_type' => 'nullable|in:debit,credit,DEBIT,CREDIT',
            'value_mode' => 'nullable|in:fixed,dynamic,percentage,FIXED,DYNAMIC,PERCENTAGE',
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
