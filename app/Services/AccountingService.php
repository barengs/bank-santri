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
                'status'              => $extraData['status'] ?? 'success',
                'channel'             => $channel,
                'akad_type'           => $extraData['akad_type'] ?? 'wadiah',
            ]);

            // 2. Update Saldo Santri & Catat Mutasi (Sub-ledger) - Only if SUCCESS
            $status = $extraData['status'] ?? 'success';
            if ($status === 'success') {
                $this->applyBalanceMovement($transaction);
            }

            // 3. Catat Jurnal Umum (General Ledger / COA) via Rules
            $rules = $type->rules;
            
            foreach ($rules as $rule) {
                $ledgerAmount = 0;
                
                switch ($rule->value_mode) {
                    case 'total':
                        $ledgerAmount = $amount;
                        break;
                    case 'fixed':
                        $ledgerAmount = $rule->fixed_amount;
                        break;
                    case 'remainder':
                        // Hitung total dari rule lain di SISI yang sama
                        $otherRulesSameSideSum = $rules->where('entry_type', $rule->entry_type)
                            ->where('id', '!=', $rule->id)
                            ->where('value_mode', 'fixed')
                            ->sum('fixed_amount');
                        $ledgerAmount = max(0, $amount - $otherRulesSameSideSum);
                        break;
                }

                if ($ledgerAmount > 0) {
                    TransactionLedger::create([
                        'transaction_id' => $transaction->id,
                        'coa_code'       => $rule->coa_code,
                        'debit'          => $rule->entry_type === 'debit' ? $ledgerAmount : 0,
                        'credit'         => $rule->entry_type === 'credit' ? $ledgerAmount : 0,
                        'description'    => $rule->description ?? $transaction->description,
                    ]);
                }
            }

            return $transaction;
        });
    }

    /**
     * Menerapkan mutasi saldo ke rekening terkait berdasarkan data transaksi.
     */
    public function applyBalanceMovement(Transaction $transaction)
    {
        return DB::transaction(function () use ($transaction) {
            if ($transaction->source_account) {
                $src = Account::where('account_number', $transaction->source_account)->lockForUpdate()->firstOrFail();
                $before = $src->balance;
                $src->balance -= $transaction->amount;
                $src->save();

                AccountMovement::create([
                    'account_number' => $transaction->source_account,
                    'transaction_id' => $transaction->id,
                    'amount'         => $transaction->amount,
                    'type'           => 'debit',
                    'balance_before' => $before,
                    'balance_after'  => $src->balance,
                    'description'    => $transaction->description,
                ]);
            }

            if ($transaction->destination_account) {
                $dst = Account::where('account_number', $transaction->destination_account)->lockForUpdate()->firstOrFail();
                $before = $dst->balance;
                $dst->balance += $transaction->amount;
                $dst->save();

                AccountMovement::create([
                    'account_number' => $transaction->destination_account,
                    'transaction_id' => $transaction->id,
                    'amount'         => $transaction->amount,
                    'type'           => 'credit',
                    'balance_before' => $before,
                    'balance_after'  => $dst->balance,
                    'description'    => $transaction->description,
                ]);
            }
        });
    }
}
