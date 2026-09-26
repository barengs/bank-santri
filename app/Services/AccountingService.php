<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\Transaction;
use App\Models\TransactionLedger;
use App\Models\TransactionType;
use App\Models\TransactionItem;
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
            $this->ensureLedgerEntries($transaction);

            return $transaction;
        });
    }

    /**
     * Mencatat transaksi per rincian item paket menggunakan Master Transaction Item.
     */
    public function recordPackageItemTransaction(
        TransactionItem $item,
        float $amount,
        ?string $sourceAccount = null,
        ?string $destAccount = null,
        ?string $description = null,
        string $channel = 'system',
        array $extraData = []
    ) {
        return DB::transaction(function () use ($item, $amount, $sourceAccount, $destAccount, $description, $channel, $extraData) {
            $ref = $extraData['reference_number'] ?? ('PKG-' . date('YmdHis') . strtoupper(Str::random(4)));

            // 1. Buat Header Transaksi
            $transaction = Transaction::create([
                'id'                  => Str::uuid(),
                'transaction_type_id' => null, // No type needed if we have item
                'source_account'      => $sourceAccount,
                'destination_account' => $destAccount,
                'reference_number'    => $ref,
                'amount'              => $amount,
                'description'         => $description ?? $item->item_name,
                'status'              => 'success',
                'channel'             => $channel,
                'akad_type'           => $extraData['akad_type'] ?? 'wadiah',
            ]);

            // 2. Update Saldo & Mutasi
            $this->applyBalanceMovement($transaction);

            // 3. Jurnal COA Seimbang (Double-Entry Balance) berdasarkan Transaction Item
            if ($item->coa_code) {
                // Sisi 1: Akun Item (misal Pendapatan 4100/4200/4300)
                TransactionLedger::create([
                    'transaction_id' => $transaction->id,
                    'coa_code'       => $item->coa_code,
                    'debit'          => $item->entry_type === 'debit' ? $amount : 0,
                    'credit'         => $item->entry_type === 'credit' ? $amount : 0,
                    'description'    => $transaction->description,
                ]);

                // Sisi 2: Lawan Akun
                // Jika dari rekening santri: Tabungan Santri (2100)
                // Jika pembayaran tunai: Kas Utama (1101)
                $contraCoa = $sourceAccount ? '2100' : '1101';
                $contraEntryType = ($item->entry_type === 'credit') ? 'debit' : 'credit';

                TransactionLedger::create([
                    'transaction_id' => $transaction->id,
                    'coa_code'       => $contraCoa,
                    'debit'          => $contraEntryType === 'debit' ? $amount : 0,
                    'credit'         => $contraEntryType === 'credit' ? $amount : 0,
                    'description'    => $transaction->description,
                ]);
            }

            return $transaction;
        });
    }

    /**
     * Memastikan transaksi memiliki jurnal ledger (double-entry) yang seimbang.
     * Dapat dipanggil saat aktivasi transaksi atau saat rebuild/sync.
     */
    public function ensureLedgerEntries(Transaction $transaction): void
    {
        $amount = (float) $transaction->amount;
        if ($amount <= 0) {
            return;
        }

        // Cek apakah ledger yang ada sudah lengkap dan seimbang
        $existing = $transaction->ledgerEntries()->get();
        $sumDebit = (float) $existing->sum('debit');
        $sumCredit = (float) $existing->sum('credit');

        if ($existing->isNotEmpty() && abs($sumDebit - $amount) < 0.01 && abs($sumCredit - $amount) < 0.01) {
            return; // Sudah seimbang dan sesuai nominal transaksi
        }

        // Hapus entri lama yang tidak seimbang/kadaluarsa
        if ($existing->isNotEmpty()) {
            $transaction->ledgerEntries()->delete();
        }

        // 1. Jika memiliki transaction_type_id dan ada rules
        if ($transaction->transaction_type_id) {
            $type = $transaction->transactionType ?: TransactionType::find($transaction->transaction_type_id);
            if ($type && $type->rules()->count() > 0) {
                $rules = $type->rules;
                foreach ($rules as $rule) {
                    $ledgerAmount = 0;
                    switch ($rule->value_mode) {
                        case 'total':
                            $ledgerAmount = $amount;
                            break;
                        case 'fixed':
                            $ledgerAmount = (float) ($rule->fixed_amount ?: $amount);
                            break;
                        case 'remainder':
                            $otherSum = $rules->where('entry_type', $rule->entry_type)
                                ->where('id', '!=', $rule->id)
                                ->where('value_mode', 'fixed')
                                ->sum('fixed_amount');
                            $ledgerAmount = max(0, $amount - $otherSum);
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
                return;
            }
        }

        // 2. Fallback cerdas berdasarkan reference_number, tipe transaksi, atau deskripsi
        $ref  = $transaction->reference_number ?? '';
        $desc = $transaction->description ?? '';

        if (str_starts_with($ref, 'REG') || stripos($desc, 'Pendaftaran') !== false) {
            // Debit: Kas Utama (1101), Credit: Pendapatan Pendaftaran (4100)
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '1101',
                'debit'          => $amount,
                'credit'         => 0,
                'description'    => $transaction->description,
            ]);
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '4100',
                'debit'          => 0,
                'credit'         => $amount,
                'description'    => $transaction->description,
            ]);
        } elseif (str_starts_with($ref, 'CASH') || str_starts_with($ref, 'TOPUP') || stripos($desc, 'Setoran') !== false || stripos($desc, 'Top-Up') !== false) {
            // Debit: Kas Utama (1101) atau Rek Bank (1102), Credit: Tabungan Santri (2100)
            $debitCoa = ($transaction->channel === 'bank_transfer' || str_contains($ref, 'TRF')) ? '1102' : '1101';
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => $debitCoa,
                'debit'          => $amount,
                'credit'         => 0,
                'description'    => $transaction->description,
            ]);
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '2100',
                'debit'          => 0,
                'credit'         => $amount,
                'description'    => $transaction->description,
            ]);
        } elseif (str_starts_with($ref, 'WDR') || stripos($desc, 'Penarikan') !== false) {
            // Debit: Tabungan Santri (2100), Credit: Kas Utama (1101)
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '2100',
                'debit'          => $amount,
                'credit'         => 0,
                'description'    => $transaction->description,
            ]);
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '1101',
                'debit'          => 0,
                'credit'         => $amount,
                'description'    => $transaction->description,
            ]);
        } elseif (str_starts_with($ref, 'KOP') || stripos($desc, 'Koperasi') !== false) {
            // Debit: Tabungan Santri (2100), Credit: Kas/Outlet (1101)
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '2100',
                'debit'          => $amount,
                'credit'         => 0,
                'description'    => $transaction->description,
            ]);
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '1101',
                'debit'          => 0,
                'credit'         => $amount,
                'description'    => $transaction->description,
            ]);
        } elseif (str_starts_with($ref, 'DAPUR') || stripos($desc, 'Dapur') !== false || stripos($desc, 'Makan') !== false) {
            // Debit: Tabungan Santri (2100), Credit: Pendapatan Dapur/Bulanan (4300)
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '2100',
                'debit'          => $amount,
                'credit'         => 0,
                'description'    => $transaction->description,
            ]);
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '4300',
                'debit'          => 0,
                'credit'         => $amount,
                'description'    => $transaction->description,
            ]);
        } elseif (str_starts_with($ref, 'PAY') || str_starts_with($ref, 'PKG')) {
            // Debit: Tabungan Santri (2100) atau Kas, Credit: Pendapatan Operasional (4200)
            $debitCoa = $transaction->source_account ? '2100' : '1101';
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => $debitCoa,
                'debit'          => $amount,
                'credit'         => 0,
                'description'    => $transaction->description,
            ]);
            TransactionLedger::create([
                'transaction_id' => $transaction->id,
                'coa_code'       => '4200',
                'debit'          => 0,
                'credit'         => $amount,
                'description'    => $transaction->description,
            ]);
        }
    }

    /**
     * Menerapkan mutasi saldo ke rekening terkait berdasarkan data transaksi.
     */
    public function applyBalanceMovement(Transaction $transaction)
    {
        return DB::transaction(function () use ($transaction) {
            if ($transaction->source_account) {
                $src = Account::with('product')->where('account_number', $transaction->source_account)->lockForUpdate()->firstOrFail();
                if ($src->status !== 'AKTIF') {
                    throw new \Exception("Transaksi ditolak: Rekening ({$src->account_number}) tidak aktif (Status: {$src->status}).");
                }

                // Proteksi Overdraft (Saldo Minus) & Saldo Minimum Mengendap
                $minBalance = (float) ($src->product->minimum_balance ?? 0);
                if (($src->balance - $transaction->amount) < $minBalance) {
                    $saldoFormat = 'Rp ' . number_format($src->balance, 0, ',', '.');
                    $pesan = "Transaksi ditolak: Saldo rekening ({$src->account_number}) tidak mencukupi. Saldo saat ini: {$saldoFormat}";
                    if ($minBalance > 0) {
                        $minFormat = 'Rp ' . number_format($minBalance, 0, ',', '.');
                        $pesan .= " (Saldo minimum mengendap: {$minFormat})";
                    }
                    throw new \Exception($pesan);
                }

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
                if ($dst->status !== 'AKTIF') {
                    throw new \Exception("Transaksi ditolak: Rekening penerima ({$dst->account_number}) tidak aktif (Status: {$dst->status}).");
                }
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
