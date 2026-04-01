<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\Transaction;
use App\Models\TransactionLedger;
use App\Models\TransactionType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccountingService
{
    /**
     * Mencatat transaksi perbankan lengkap dengan jurnal COA (Double-Entry).
     */
    public function recordTransaction(
        string $typeCode,
        float $amount,
        ?string $sourceAccount = null,
        ?string $destAccount = null,
        ?string $description = null,
        string $channel = 'system',
        array $extraData = []
    ) {
        return DB::transaction(function () use ($typeCode, $amount, $sourceAccount, $destAccount, $description, $channel, $extraData) {
            $type = TransactionType::where('code', $typeCode)->firstOrFail();
            
            $ref = $extraData['reference_number'] ?? ($type->code . '-' . date('YmdHis') . strtoupper(Str::random(4)));

            // 1. Buat Header Transaksi
            $transaction = Transaction::create([
                'id'                  => Str::uuid(),
                'transaction_type_id' => $type->id,
                'source_account'      => $sourceAccount,
                'destination_account' => $destAccount,
                'reference_number'    => $ref,
                'amount'              => $amount,
                'description'         => $description ?? $type->name,
                'status'              => 'success',
                'channel'             => $channel,
                'akad_type'           => $extraData['akad_type'] ?? 'wadiah',
            ]);

            // 2. Update Saldo Santri & Catat Mutasi (Sub-ledger)
            if ($sourceAccount) {
                $src = Account::where('account_number', $sourceAccount)->lockForUpdate()->firstOrFail();
                $before = $src->balance;
                $src->balance -= $amount;
                $src->save();

                AccountMovement::create([
                    'account_number' => $sourceAccount,
                    'transaction_id' => $transaction->id,
                    'amount'         => $amount,
                    'type'           => 'debit',
                    'balance_before' => $before,
                    'balance_after'  => $src->balance,
                    'description'    => $transaction->description,
                ]);
            }

            if ($destAccount) {
                $dst = Account::where('account_number', $destAccount)->lockForUpdate()->firstOrFail();
                $before = $dst->balance;
                $dst->balance += $amount;
                $dst->save();

                AccountMovement::create([
                    'account_number' => $destAccount,
                    'transaction_id' => $transaction->id,
                    'amount'         => $amount,
                    'type'           => 'credit',
                    'balance_before' => $before,
                    'balance_after'  => $dst->balance,
                    'description'    => $transaction->description,
                ]);
            }

            // 3. Catat Jurnal Umum (General Ledger / COA)
            // Debit Entry
            if ($type->default_debit_coa) {
                TransactionLedger::create([
                    'transaction_id' => $transaction->id,
                    'coa_code'       => $type->default_debit_coa,
                    'debit'          => $amount,
                    'credit'         => 0,
                    'description'    => $transaction->description,
                ]);
            }

            // Credit Entry
            if ($type->default_credit_coa) {
                TransactionLedger::create([
                    'transaction_id' => $transaction->id,
                    'coa_code'       => $type->default_credit_coa,
                    'debit'          => 0,
                    'credit'         => $amount,
                    'description'    => $transaction->description,
                ]);
            }

            return $transaction;
        });
    }
}
