<?php

namespace App\Imports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class TransactionImport implements ToCollection, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    private $errors = [];
    private $successCount = 0;
    private $failureCount = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            try {
                // Create or update transaction based on reference_number
                $transaction = Transaction::updateOrCreate(
                    ['reference_number' => $row['reference_number']],
                    [
                        'amount' => $row['amount'],
                        'description' => $row['description'] ?? null,
                        'status' => $row['status'] ?? 'pending',
                        'channel' => $row['channel'] ?? 'teller',
                        'source_account' => $row['source_account'] ?? null,
                        'destination_account' => $row['destination_account'] ?? null,
                        'transaction_type_id' => $row['transaction_type_id'] ?? null,
                    ]
                );
                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Error pada transaksi {$row['reference_number']}: " . $e->getMessage();
                $this->failureCount++;
                Log::error("Transaction import error: " . $e->getMessage());
            }
        }
    }

    public function rules(): array
    {
        return [
            'reference_number' => 'required|string',
            'amount' => 'required|numeric|min:0',
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
