<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\PaymentPackage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BillingService
{
    /**
     * Preview tagihan sebelum diterbitkan oleh staf bendahara.
     */
    public function previewGeneration(string $billPeriod, int $packageId, ?string $dueDate = null): array
    {
        $package = PaymentPackage::with('items')->findOrFail($packageId);
        $accounts = Account::where('status', 'AKTIF')->get();

        $existingCount = Bill::where('bill_period', $billPeriod)
            ->whereIn('account_number', $accounts->pluck('account_number'))
            ->count();

        $targetCount = $accounts->count() - $existingCount;
        $totalEstimated = $targetCount * (float) $package->total_amount;

        return [
            'bill_period'         => $billPeriod,
            'package'             => [
                'id'           => $package->id,
                'name'         => $package->package_name,
                'total_amount' => (float) $package->total_amount,
                'items_count'  => $package->items->count(),
            ],
            'due_date'            => $dueDate ?? Carbon::parse($billPeriod . '-10')->addMonth()->toDateString(),
            'total_active_accounts' => $accounts->count(),
            'already_billed_count'  => $existingCount,
            'new_bills_count'       => $targetCount,
            'total_estimated'       => $totalEstimated,
        ];
    }

    /**
     * Terbitkan tagihan (Batch Generation) untuk periode tertentu.
     * Snapshot rincian paket dibekukan secara permanen.
     */
    public function generateBills(
        string $billPeriod,
        int $packageId,
        ?string $dueDate = null,
        ?int $issuedBy = null,
        array $targetAccounts = []
    ): array {
        $package = PaymentPackage::with(['items.transactionItem'])->findOrFail($packageId);

        $accountsQuery = Account::where('status', 'AKTIF');
        if (!empty($targetAccounts)) {
            $accountsQuery->whereIn('account_number', $targetAccounts);
        }
        $accounts = $accountsQuery->get();

        $snapshot = [
            'package_id'   => $package->id,
            'package_name' => $package->package_name,
            'total_amount' => (float) $package->total_amount,
            'saku_amount'  => (float) $package->saku_amount,
            'items'        => $package->items->map(fn($item) => [
                'id'                  => $item->id,
                'transaction_item_id' => $item->transaction_item_id,
                'coa_code'            => $item->transactionItem?->coa_code,
                'destination_account' => $item->transactionItem?->destination_account,
                'item_name'           => $item->item_name,
                'category'            => $item->category,
                'amount'              => (float) $item->amount,
                'is_saku'             => (bool) $item->is_saku,
            ])->toArray(),
        ];

        $calculatedDueDate = $dueDate ?? Carbon::parse($billPeriod . '-10')->addMonth()->toDateString();

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($accounts, $billPeriod, $package, $snapshot, $calculatedDueDate, $issuedBy, &$created, &$skipped) {
            foreach ($accounts as $acc) {
                $exists = Bill::where('account_number', $acc->account_number)
                    ->where('bill_period', $billPeriod)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Bill::create([
                    'account_number'   => $acc->account_number,
                    'package_id'       => $package->id,
                    'bill_period'      => $billPeriod,
                    'package_snapshot' => $snapshot,
                    'amount'           => $package->total_amount,
                    'paid_amount'      => 0,
                    'due_date'         => $calculatedDueDate,
                    'status'           => Bill::STATUS_UNPAID,
                    'issued_at'        => now(),
                    'issued_by'        => $issuedBy,
                ]);

                $created++;
            }
        });

        return [
            'bill_period' => $billPeriod,
            'created'     => $created,
            'skipped'     => $skipped,
            'amount_each' => (float) $package->total_amount,
            'total_value' => $created * (float) $package->total_amount,
        ];
    }

    /**
     * Alokasi pembayaran ke tagihan secara FIFO (tertua didahulukan).
     * Berguna jika wali santri membayar sebagian atau membayar lunas beberapa bulan sekaligus.
     */
    public function allocatePaymentFifo(string $accountNumber, ?int $paymentRecordId, float $paymentAmount): array
    {
        $unpaidBills = Bill::where('account_number', $accountNumber)
            ->whereIn('status', [Bill::STATUS_UNPAID, Bill::STATUS_PARTIAL, Bill::STATUS_OVERDUE])
            ->orderBy('bill_period', 'asc')
            ->get();

        $remainingToAllocate = $paymentAmount;
        $allocatedRecords = [];

        DB::transaction(function () use ($unpaidBills, &$remainingToAllocate, $paymentRecordId, &$allocatedRecords) {
            foreach ($unpaidBills as $bill) {
                if ($remainingToAllocate <= 0) {
                    break;
                }

                $need = (float) $bill->amount - (float) $bill->paid_amount;
                if ($need <= 0) {
                    continue;
                }

                $allocateThis = min($need, $remainingToAllocate);

                BillPayment::create([
                    'bill_id'           => $bill->id,
                    'payment_record_id' => $paymentRecordId,
                    'amount'            => $allocateThis,
                ]);

                $bill->paid_amount = (float) $bill->paid_amount + $allocateThis;
                $bill->syncStatus();

                $remainingToAllocate -= $allocateThis;

                $allocatedRecords[] = [
                    'bill_id'     => $bill->id,
                    'period'      => $bill->bill_period,
                    'allocated'   => $allocateThis,
                    'bill_status' => $bill->status,
                ];
            }
        });

        return [
            'total_payment'        => $paymentAmount,
            'allocated'            => $paymentAmount - $remainingToAllocate,
            'remaining_unassigned' => $remainingToAllocate,
            'allocations'          => $allocatedRecords,
        ];
    }

    /**
     * Hitung ringkasan tunggakan dan riwayat tagihan untuk satu santri.
     * Digunakan oleh SMPT (X-Internal-Key) dan Wali Santri.
     */
    public function getArrearsSummary(string $accountNumber): array
    {
        $today = now()->toDateString();

        $bills = Bill::where('account_number', $accountNumber)
            ->orderBy('bill_period', 'desc')
            ->get();

        $arrearsBills = $bills->filter(function ($bill) use ($today) {
            return in_array($bill->status, [Bill::STATUS_OVERDUE])
                || (in_array($bill->status, [Bill::STATUS_UNPAID, Bill::STATUS_PARTIAL]) && $bill->due_date && $bill->due_date->toDateString() < $today);
        });

        $totalArrears = $arrearsBills->sum(fn($b) => (float) $b->amount - (float) $b->paid_amount);
        $totalUnpaidCurrent = $bills->whereIn('status', [Bill::STATUS_UNPAID, Bill::STATUS_PARTIAL])
            ->sum(fn($b) => (float) $b->amount - (float) $b->paid_amount);

        return [
            'account_number'      => $accountNumber,
            'has_arrears'         => $arrearsBills->isNotEmpty(),
            'total_arrears'       => (float) $totalArrears,
            'overdue_months_count'=> $arrearsBills->count(),
            'oldest_overdue_period'=> $arrearsBills->sortBy('bill_period')->first()?->bill_period,
            'newest_overdue_period'=> $arrearsBills->sortByDesc('bill_period')->first()?->bill_period,
            'total_unpaid_all'    => (float) $totalUnpaidCurrent,
            'bills'               => $bills->map(fn($b) => [
                'id'          => $b->id,
                'period'      => $b->bill_period,
                'amount'      => (float) $b->amount,
                'paid_amount' => (float) $b->paid_amount,
                'remaining'   => (float) $b->amount - (float) $b->paid_amount,
                'due_date'    => $b->due_date?->toDateString(),
                'status'      => $b->status,
                'is_overdue'  => $b->is_overdue,
            ])->values(),
        ];
    }

    /**
     * Pelunasan tagihan paket secara tunai di kasir teller.
     * Uang tunai langsung melunasi tagihan yang dipilih (FIFO) dan dijurnal ke Kas & Pendapatan.
     * Saldo tabungan santri TIDAK DISENTUH.
     */
    public function payBillsCash(string $accountNumber, array $billIds, ?string $notes = null, ?int $processedBy = null): array
    {
        return DB::transaction(function () use ($accountNumber, $billIds, $notes, $processedBy) {
            $account = Account::where('account_number', $accountNumber)->firstOrFail();

            // Ambil semua tagihan santri yang belum lunas (urut tertua)
            $allUnpaid = Bill::where('account_number', $accountNumber)
                ->whereIn('status', [Bill::STATUS_UNPAID, Bill::STATUS_PARTIAL, Bill::STATUS_OVERDUE])
                ->orderBy('bill_period', 'asc')
                ->get();

            if ($allUnpaid->isEmpty()) {
                throw new \Exception('Santri ini tidak memiliki tagihan yang belum lunas.');
            }

            // Ambil tagihan yang dipilih
            $selectedBills = $allUnpaid->whereIn('id', $billIds)->values();

            if ($selectedBills->isEmpty()) {
                throw new \Exception('Tidak ada tagihan valid yang dipilih untuk dibayar.');
            }

            // Validasi FIFO: tagihan yang dipilih wajib merupakan urutan berurutan
            // dari bulan tertua tanpa ada yang terlewat (misal Maret & April, bukan Maret & Mei).
            $unpaidIds = $allUnpaid->pluck('id')->values();
            $expectedPrefix = $unpaidIds->take(count($billIds))->values();

            if ($expectedPrefix->diff($selectedBills->pluck('id')->values())->isNotEmpty()
                || $expectedPrefix->count() !== count($billIds)) {
                $oldestAvailable = $allUnpaid->first();
                throw new \Exception(
                    "Pembayaran harus berurutan dari bulan tertua. " .
                    "Silakan sertakan tagihan periode {$oldestAvailable->bill_period} terlebih dahulu (tanpa melompati bulan)."
                );
            }

            $selectedBills = $unpaidIds->take(count($billIds))
                ->map(fn($id) => $allUnpaid->firstWhere('id', $id))
                ->values();

            $totalCash = 0;
            $paidDetails = [];
            $ref = 'CASH-BILL-' . date('YmdHis') . '-' . strtoupper(\Illuminate\Support\Str::random(4));

            foreach ($selectedBills as $bill) {
                $needToPay = (float) $bill->amount - (float) $bill->paid_amount;
                if ($needToPay <= 0) {
                    continue;
                }

                $totalCash += $needToPay;

                // Catat alokasi pelunasan
                BillPayment::create([
                    'bill_id'           => $bill->id,
                    'payment_record_id' => null,
                    'amount'            => $needToPay,
                ]);

                $bill->paid_amount = (float) $bill->amount;
                $bill->status = Bill::STATUS_PAID;
                $bill->save();

                $paidDetails[] = [
                    'bill_id' => $bill->id,
                    'period'  => $bill->bill_period,
                    'amount'  => $needToPay,
                    'status'  => $bill->status,
                ];
            }

            $processedItems = [];

            foreach ($paidDetails as $detail) {
                $bill = $allUnpaid->firstWhere('id', $detail['bill_id']);
                $snapshot = $bill->package_snapshot ?? [];
                $snapshotTotal = (float) ($snapshot['total_amount'] ?? 0);
                $items = $snapshot['items'] ?? [];

                // Bagi proporsional jika ada pembayaran parsial sebelumnya pada tagihan ini
                $ratio = ($snapshotTotal > 0) ? ($detail['amount'] / $snapshotTotal) : 0;

                // Jika tagihan lama tanpa item snapshot (fallback legacy)
                if (empty($items)) {
                    $fallbackItem = new \App\Models\TransactionItem([
                        'item_name'           => "Tagihan Periode {$bill->bill_period}",
                        'coa_code'            => '4200',
                        'entry_type'          => 'credit',
                        'destination_account' => null,
                    ]);
                    app(\App\Services\AccountingService::class)->recordPackageItemTransaction(
                        $fallbackItem,
                        (float) $detail['amount'],
                        null, // kas teller (uang tunai langsung, tidak kurangi tabungan)
                        null,
                        "Pembayaran tunai tagihan [{$bill->bill_period}] (Santri: {$accountNumber})",
                        'teller',
                        ['reference_number' => $ref . '-B' . $bill->id]
                    );
                    continue;
                }

                foreach ($items as $snapItem) {
                    $itemAmount = round((float) ($snapItem['amount'] ?? 0) * $ratio, 2);
                    if ($itemAmount <= 0) {
                        continue;
                    }

                    // Jika komponen uang saku: kreditkan ke saldo rekening tabungan santri
                    if ($snapItem['is_saku'] ?? false) {
                        $sakuAccount = Account::where('account_number', $accountNumber)->lockForUpdate()->first();
                        if ($sakuAccount) {
                            $before = $sakuAccount->balance;
                            $sakuAccount->balance += $itemAmount;
                            $sakuAccount->save();

                            $txSaku = \App\Models\Transaction::create([
                                'id'                  => \Illuminate\Support\Str::uuid(),
                                'transaction_type_id' => null,
                                'source_account'      => null,
                                'destination_account' => $accountNumber,
                                'reference_number'    => $ref . '-SAKU-' . $bill->id,
                                'amount'              => $itemAmount,
                                'description'         => "Porsi Uang Saku Tagihan [{$bill->bill_period}]",
                                'status'              => 'success',
                                'channel'             => 'teller',
                                'akad_type'           => 'wadiah',
                            ]);

                            \App\Models\AccountMovement::create([
                                'account_number' => $accountNumber,
                                'transaction_id' => $txSaku->id,
                                'amount'         => $itemAmount,
                                'type'           => 'credit',
                                'balance_before' => $before,
                                'balance_after'  => $sakuAccount->balance,
                                'description'    => "Porsi Uang Saku dari Tagihan [{$bill->bill_period}]",
                            ]);

                            \App\Models\TransactionLedger::create([
                                'transaction_id' => $txSaku->id,
                                'coa_code'       => '1101', // Kas Utama
                                'debit'          => $itemAmount,
                                'credit'         => 0,
                                'description'    => $txSaku->description,
                            ]);

                            \App\Models\TransactionLedger::create([
                                'transaction_id' => $txSaku->id,
                                'coa_code'       => '2100', // Tabungan Santri
                                'debit'          => 0,
                                'credit'         => $itemAmount,
                                'description'    => $txSaku->description,
                            ]);
                        }
                        continue;
                    }

                    // Rekonstruksi TransactionItem dari snapshot untuk AccountingService
                    $snapDestAccount = $snapItem['destination_account'] ?? null;
                    $snapCoaCode     = $snapItem['coa_code'] ?? null;

                    // Fallback untuk tagihan lama: jika snapshot belum punya destination_account, cari dari master
                    if ((!$snapDestAccount || !$snapCoaCode) && !empty($snapItem['transaction_item_id'])) {
                        $masterItem = \App\Models\TransactionItem::find($snapItem['transaction_item_id']);
                        if ($masterItem) {
                            $snapDestAccount = $snapDestAccount ?: $masterItem->destination_account;
                            $snapCoaCode     = $snapCoaCode ?: $masterItem->coa_code;
                        }
                    }

                    $tItem = new \App\Models\TransactionItem([
                        'item_name'           => $snapItem['item_name'] ?? 'Tagihan',
                        'coa_code'            => $snapCoaCode ?: '4200',
                        'entry_type'          => 'credit',
                        'destination_account' => $snapDestAccount,
                    ]);

                    app(\App\Services\AccountingService::class)->recordPackageItemTransaction(
                        $tItem,
                        $itemAmount,
                        null, // uang disetor tunai (1101 Debit)
                        $tItem->destination_account, // Rekening institusi penerima
                        "Pelunasan [{$bill->bill_period}] - {$tItem->item_name} (Santri: {$accountNumber})",
                        'teller',
                        ['reference_number' => $ref . '-B' . $bill->id . '-' . ($snapItem['id'] ?? rand(10,99))]
                    );
                }
            }

            // Hitung sisa tunggakan setelah transaksi
            $newSummary = $this->getArrearsSummary($accountNumber);

            return [
                'reference_number'  => $ref,
                'account_number'    => $accountNumber,
                'total_paid'        => $totalCash,
                'paid_bills'        => $paidDetails,
                'remaining_arrears' => $newSummary['total_arrears'],
                'has_arrears'       => $newSummary['has_arrears'],
                'overdue_months'    => $newSummary['overdue_months_count'],
            ];
        });
    }
}
