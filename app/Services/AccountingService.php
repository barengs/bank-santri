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
                        $coaCode = $rule->coa_code;
                        // Jika ada rekening tujuan (misal rekening koperasi), dana tidak keluar fisik dari bank melainkan berpindah ke simpanan koperasi (2100)
                        if (!empty($transaction->destination_account) && $rule->entry_type === 'credit' && in_array($rule->coa_code, ['1101', '1102'])) {
                            $coaCode = '2100';
                        }

                        TransactionLedger::create([
                            'transaction_id' => $transaction->id,
                            'coa_code'       => $coaCode,
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

    /**
     * Sinkronisasi package_snapshot pada tagihan (bills) yang belum lunas
     * ketika Master TransactionItem diperbarui (destination_account atau coa_code berubah).
     */
    public function syncUnpaidBillSnapshots(TransactionItem $item): int
    {
        $bills = \App\Models\Bill::whereIn('status', [
            \App\Models\Bill::STATUS_UNPAID,
            \App\Models\Bill::STATUS_PARTIAL,
            \App\Models\Bill::STATUS_OVERDUE,
        ])->get();

        $updatedCount = 0;

        foreach ($bills as $bill) {
            $snapshot = $bill->package_snapshot;
            if (!is_array($snapshot) || empty($snapshot['items']) || !is_array($snapshot['items'])) {
                continue;
            }

            $changed = false;
            foreach ($snapshot['items'] as &$snapItem) {
                $snapItemId = $snapItem['transaction_item_id'] ?? null;
                if ($snapItemId && (int) $snapItemId === (int) $item->id) {
                    if (($snapItem['destination_account'] ?? null) !== $item->destination_account
                        || ($snapItem['coa_code'] ?? null) !== $item->coa_code) {
                        $snapItem['destination_account'] = $item->destination_account;
                        $snapItem['coa_code'] = $item->coa_code;
                        $changed = true;
                    }
                }
            }
            unset($snapItem);

            if ($changed) {
                $bill->package_snapshot = $snapshot;
                $bill->save();
                $updatedCount++;
            }
        }

        return $updatedCount;
    }

    /**
     * Cari seluruh transaksi berstatus 'success' milik suatu TransactionItem
     * yang belum memiliki rekening tujuan (destination_account IS NULL)
     * dan belum pernah dikreditkan ke rekening manapun di account_movements.
     */
    public function findUnclaimedItemTransactions(TransactionItem $item)
    {
        // Kumpulkan semua variasi nama item (dari master, payment_package_items, dan payment_record_items)
        $itemNames = [trim($item->item_name)];

        $pkgNames = DB::table('payment_package_items')
            ->where('transaction_item_id', $item->id)
            ->where('is_saku', false)
            ->pluck('item_name')
            ->toArray();

        $recNames = DB::table('payment_record_items')
            ->where('transaction_item_id', $item->id)
            ->where('is_saku', false)
            ->pluck('item_name')
            ->toArray();

        foreach (array_merge($pkgNames, $recNames) as $alias) {
            $alias = trim((string) $alias);
            if ($alias !== '') {
                $itemNames[] = $alias;
            }
        }
        $itemNames = array_values(array_unique($itemNames));

        // 1. Cari ID transaksi yang cocok melalui payment_record_items
        $matchedTxIds = [];
        $priRecords = DB::table('payment_record_items as pri')
            ->join('payment_records as pr', 'pr.id', '=', 'pri.payment_record_id')
            ->where('pri.transaction_item_id', $item->id)
            ->where('pri.is_saku', false)
            ->select('pr.reference_number as pr_ref', 'pri.package_item_id', 'pri.id as pri_id', 'pri.item_name')
            ->get();

        if ($priRecords->isNotEmpty()) {
            $exactRefs = [];
            foreach ($priRecords as $pri) {
                if (!empty($pri->pr_ref)) {
                    if (!empty($pri->package_item_id)) {
                        $exactRefs[] = $pri->pr_ref . '-' . $pri->package_item_id;
                    }
                    $exactRefs[] = $pri->pr_ref . '-' . $pri->pri_id;
                }
            }
            $exactRefs = array_values(array_unique($exactRefs));

            if (!empty($exactRefs)) {
                $ids = DB::table('transactions')
                    ->whereIn('reference_number', $exactRefs)
                    ->pluck('id')
                    ->toArray();
                $matchedTxIds = array_merge($matchedTxIds, $ids);
            }
        }

        return Transaction::with(['sourceAccount:account_number,customer_name'])
            ->where('status', 'success')
            ->where(function ($q) {
                $q->whereNull('destination_account')
                  ->orWhere('destination_account', '');
            })
            ->where('amount', '>', 0)
            ->whereDoesntHave('movements', function ($q) {
                $q->where('type', 'credit');
            })
            ->where(function ($q) use ($item, $itemNames, $matchedTxIds) {
                // a) ID dari payment_record_items
                if (!empty($matchedTxIds)) {
                    $q->orWhereIn('id', $matchedTxIds);
                }

                // b) Referensi Add-On (-ADD{id})
                $q->orWhere('reference_number', 'like', '%-ADD' . $item->id);

                // c) Pola deskripsi standar dari PaymentService, BillingService, dan TopUpController
                foreach ($itemNames as $name) {
                    $lowerName = mb_strtolower($name);
                    $escaped = addcslashes($lowerName, '%_\\');

                    $q->orWhereRaw('LOWER(description) LIKE ?', ['pembayaran ' . $escaped . ' [%'])
                      ->orWhereRaw('LOWER(description) LIKE ?', ['pelunasan [%] - ' . $escaped . ' (santri:%'])
                      ->orWhereRaw('LOWER(description) LIKE ?', ['biaya add-on: ' . $escaped . ' [%'])
                      ->orWhereRaw('LOWER(description) = ?', [$lowerName]);
                }
            })
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Klaim / pindahkan dana dari seluruh transaksi rincian item yang belum memiliki
     * destination_account ke Rekening Instansi tujuan.
     */
    public function claimUnclaimedItemTransactions(TransactionItem $item, ?string $targetAccountNumber = null): array
    {
        $destAccountNumber = $targetAccountNumber ?: $item->destination_account;

        if (empty($destAccountNumber)) {
            throw new \Exception("Rekening instansi tujuan belum ditentukan untuk rincian '{$item->item_name}'.");
        }

        return DB::transaction(function () use ($item, $destAccountNumber) {
            $dstAccount = Account::where('account_number', $destAccountNumber)
                ->lockForUpdate()
                ->first();

            if (!$dstAccount) {
                throw new \Exception("Rekening tujuan ({$destAccountNumber}) tidak ditemukan.");
            }

            if ($dstAccount->status !== 'AKTIF') {
                throw new \Exception("Rekening tujuan ({$dstAccount->account_number} - {$dstAccount->customer_name}) tidak aktif (Status: {$dstAccount->status}).");
            }

            // Pastikan master item juga menyimpan destination_account ini
            if ($item->destination_account !== $destAccountNumber) {
                $item->destination_account = $destAccountNumber;
                $item->save();
            }

            // Sinkronkan tagihan yang belum lunas
            $this->syncUnpaidBillSnapshots($item);

            $transactions = $this->findUnclaimedItemTransactions($item);

            if ($transactions->isEmpty()) {
                return [
                    'claimed_count'        => 0,
                    'total_claimed_amount' => 0.0,
                    'destination_account'  => $dstAccount->account_number,
                    'destination_name'     => $dstAccount->customer_name,
                    'balance_before'       => (float) $dstAccount->balance,
                    'balance_after'        => (float) $dstAccount->balance,
                    'transactions'         => [],
                ];
            }

            $balanceBeforeAll = (float) $dstAccount->balance;
            $runningBalance   = $balanceBeforeAll;
            $totalClaimed     = 0.0;
            $claimedDetails   = [];

            foreach ($transactions as $tx) {
                // Lock transaksi untuk mencegah race condition / double claim
                $lockedTx = Transaction::where('id', $tx->id)->lockForUpdate()->first();
                if (!$lockedTx || !empty($lockedTx->destination_account)) {
                    continue;
                }

                $alreadyCredited = AccountMovement::where('transaction_id', $lockedTx->id)
                    ->where('type', 'credit')
                    ->exists();
                if ($alreadyCredited) {
                    continue;
                }

                $amount = (float) $lockedTx->amount;
                $before = $runningBalance;
                $runningBalance += $amount;
                $totalClaimed   += $amount;

                // 1. Update destination_account pada transaksi
                $lockedTx->destination_account = $dstAccount->account_number;
                $lockedTx->save();

                // 2. Buat mutasi masuk (credit) pada Rekening Instansi
                AccountMovement::create([
                    'account_number' => $dstAccount->account_number,
                    'transaction_id' => $lockedTx->id,
                    'amount'         => $amount,
                    'type'           => 'credit',
                    'balance_before' => $before,
                    'balance_after'  => $runningBalance,
                    'description'    => $lockedTx->description,
                ]);

                // 3. Sinkronkan coa_code pada jurnal (ledger) sisi item jika coa_code master sudah diperbaiki
                if (!empty($item->coa_code)) {
                    $contraCoa = $lockedTx->source_account ? '2100' : '1101';
                    $itemLedger = TransactionLedger::where('transaction_id', $lockedTx->id)
                        ->where(function ($q) use ($item) {
                            if ($item->entry_type === 'credit') {
                                $q->where('credit', '>', 0);
                            } else {
                                $q->where('debit', '>', 0);
                            }
                        })
                        ->first();

                    if ($itemLedger && $itemLedger->coa_code !== $item->coa_code) {
                        $itemLedger->coa_code = $item->coa_code;
                        $itemLedger->save();
                    }
                }

                $claimedDetails[] = [
                    'id'               => $lockedTx->id,
                    'reference_number' => $lockedTx->reference_number,
                    'source_account'   => $lockedTx->source_account,
                    'amount'           => $amount,
                    'description'      => $lockedTx->description,
                    'date'             => $lockedTx->created_at?->toDateTimeString(),
                ];
            }

            // 4. Simpan saldo akhir Rekening Instansi
            $dstAccount->balance = $runningBalance;
            $dstAccount->save();

            return [
                'claimed_count'        => count($claimedDetails),
                'total_claimed_amount' => $totalClaimed,
                'destination_account'  => $dstAccount->account_number,
                'destination_name'     => $dstAccount->customer_name,
                'balance_before'       => $balanceBeforeAll,
                'balance_after'        => (float) $dstAccount->balance,
                'transactions'         => $claimedDetails,
            ];
        });
    }
}
