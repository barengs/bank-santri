<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\Transaction;
use App\Models\TransactionLedger;
use App\Models\TransactionType;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    /**
     * List transaksi dengan filter
     */
    public function index(Request $request)
    {
        $transactions = Transaction::with(['sourceAccount:account_number,customer_name', 'destinationAccount:account_number,customer_name', 'transactionType:id,name,code'])
            ->when($request->account_number, function ($q, $an) {
                $q->where(function ($query) use ($an) {
                    $query->where('source_account', $an)
                          ->orWhere('destination_account', $an);
                });
            })
            ->when($request->status, fn($q, $s)  => $q->where('status', $s))
            ->when($request->channel, fn($q, $c) => $q->where('channel', $c))
            ->when($request->reference_number, fn($q, $r) => $q->where('reference_number', $r))
            ->when($request->search, function($q, $s) {
                $q->where(function($query) use ($s) {
                    $query->where('reference_number', 'like', "%{$s}%")
                          ->orWhere('description', 'like', "%{$s}%")
                          ->orWhere('amount', 'like', "%{$s}%");
                });
            })
            ->latest();

        $perPage = (int) $request->get('per_page', 10);
        $perPage = ($perPage <= 0) ? 10 : min($perPage, 500);
        $transactions = $transactions->paginate($perPage);

        // Flatten: tambah field _name agar frontend tidak perlu render object Eloquent
        $transactions->getCollection()->transform(function ($trx) {
            $trx->source_account_name      = $trx->sourceAccount?->customer_name;
            $trx->destination_account_name = $trx->destinationAccount?->customer_name;
            $trx->transaction_type_name    = $trx->transactionType?->name;
            // Buang relasi dari payload agar tidak ada object nested di response
            unset($trx->sourceAccount, $trx->destinationAccount, $trx->transactionType);
            return $trx;
        });

        return response()->json(['status' => 'success', 'data' => $transactions]);
    }

    public function show(string $id)
    {
        $transaction = Transaction::with(['ledgerEntries', 'sourceAccount', 'destinationAccount', 'transactionType'])
            ->findOrFail($id);

        return response()->json(['status' => 'success', 'data' => $transaction]);
    }

    /**
     * Store a generic transaction based on TransactionType rules.
     */
    public function store(Request $request)
    {
        $request->validate([
            'transaction_type_id' => 'required|exists:transaction_types,id',
            'amount'              => 'required|numeric|min:0',
            'source_account'      => 'nullable|exists:accounts,account_number',
            'destination_account' => 'nullable|exists:accounts,account_number',
            'description'         => 'nullable|string',
            'channel'             => 'nullable|string',
        ]);

        try {
            $type = TransactionType::findOrFail($request->transaction_type_id);

            $transaction = app(AccountingService::class)->recordTransaction(
                $type->code,
                $request->amount,
                $request->source_account,
                $request->destination_account,
                $request->description,
                $request->channel ?? 'teller'
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi berhasil diproses.',
                'data'    => $transaction,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Setoran tunai (Deposit) — akad Wadiah
     */
    public function cashDeposit(Request $request)
    {
        $request->validate([
            'account_number' => 'required|exists:accounts,account_number',
            'amount'         => 'required|numeric|min:1000',
            'description'    => 'nullable|string',
        ]);

        try {
            $typeCode = TransactionType::where('code', 'TOPUP-SANTRI')->exists() ? 'TOPUP-SANTRI' : 'CASH-DEP';

            $transaction = app(AccountingService::class)->recordTransaction(
                $typeCode,
                $request->amount,
                null,
                $request->account_number,
                $request->description ?? 'Setoran tunai',
                'teller'
            );

            $accountAfter = Account::with('product')->where('account_number', $request->account_number)->first();

            return response()->json([
                'status'  => 'success',
                'message' => 'Setoran tunai berhasil diproses.',
                'data'    => [
                    'transaction'    => $transaction,
                    'account'        => $accountAfter,
                    'balance_after'  => $accountAfter?->balance,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Penarikan tunai — akad Wadiah
     */
    public function cashWithdrawal(Request $request)
    {
        $request->validate([
            'account_number' => 'required|exists:accounts,account_number',
            'amount'         => 'required|numeric|min:1000',
            'description'    => 'nullable|string',
        ]);

        try {
            $account = Account::with('product')->where('account_number', $request->account_number)->firstOrFail();

            if ($account->status !== 'AKTIF') {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Rekening tidak aktif (Status: {$account->status})."
                ], 422);
            }

            // Validasi Limit Harian (Santri vs Non-Santri/Instansi)
            $dailyLimit = (float) ($account->daily_withdrawal_limit ?? $account->product->daily_withdrawal_limit ?? 0);

            if ($dailyLimit > 0) {
                $todayTotalWithdrawal = (float) Transaction::where('source_account', $account->account_number)
                    ->where('status', 'success')
                    ->whereDate('created_at', now()->toDateString())
                    ->whereHas('type', function ($q) {
                        $q->whereIn('code', ['WDR-SANTRI', 'CASH-WDR', 'COOP-BUY']);
                    })
                    ->sum('amount');

                if (($todayTotalWithdrawal + $request->amount) > $dailyLimit) {
                    $sisaKuota = max(0, $dailyLimit - $todayTotalWithdrawal);
                    $pesan = "Penarikan melebihi batas limit harian. Maksimal: Rp " . number_format($dailyLimit, 0, ',', '.') . 
                             " / hari. Sudah ditarik hari ini: Rp " . number_format($todayTotalWithdrawal, 0, ',', '.') . 
                             ". Sisa kuota hari ini: Rp " . number_format($sisaKuota, 0, ',', '.');
                    return response()->json(['status' => 'error', 'message' => $pesan], 422);
                }
            }

            $typeCode = TransactionType::where('code', 'WDR-SANTRI')->exists() ? 'WDR-SANTRI' : 'CASH-WDR';

            $transaction = app(AccountingService::class)->recordTransaction(
                $typeCode,
                $request->amount,
                $request->account_number,
                null,
                $request->description ?? 'Penarikan tunai',
                'teller'
            );

            $accountAfter = Account::with('product')->where('account_number', $request->account_number)->first();
            $todayTotalAfter = (float) Transaction::where('source_account', $account->account_number)
                ->where('status', 'success')
                ->whereDate('created_at', now()->toDateString())
                ->whereHas('type', function ($q) {
                    $q->whereIn('code', ['WDR-SANTRI', 'CASH-WDR', 'COOP-BUY']);
                })
                ->sum('amount');

            $sisaKuotaAfter = $dailyLimit > 0 ? max(0, $dailyLimit - $todayTotalAfter) : null;

            return response()->json([
                'status'  => 'success',
                'message' => 'Penarikan tunai berhasil diproses.',
                'data'    => [
                    'transaction'       => $transaction,
                    'account'           => $accountAfter,
                    'balance_before'    => $account->balance,
                    'balance_after'     => $accountAfter?->balance,
                    'daily_limit'       => $dailyLimit,
                    'today_withdrawal'  => $todayTotalAfter,
                    'remaining_quota'   => $sisaKuotaAfter,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Transfer antar rekening santri — akad Wadiah
     */
    public function fundTransfer(Request $request)
    {
        $request->validate([
            'source_account'      => 'required|exists:accounts,account_number',
            'destination_account' => 'required|exists:accounts,account_number|different:source_account',
            'amount'              => 'required|numeric|min:1000',
            'description'         => 'nullable|string',
        ]);

        try {
            $transaction = app(AccountingService::class)->recordTransaction(
                'FUND-TRF', // Make sure this exists
                $request->amount,
                $request->source_account,
                $request->destination_account,
                $request->description ?? 'Transfer antar rekening',
                'system'
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Transfer antar rekening berhasil diproses.',
                'data'    => $transaction,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Riwayat transaksi per rekening
     */
    public function getByAccount(string $accountNumber, Request $request)
    {
        $movements = AccountMovement::where('account_number', $accountNumber)
            ->latest()->paginate($request->get('per_page', 20));

        return response()->json(['status' => 'success', 'data' => $movements]);
    }

    /**
     * 7 hari terakhir per rekening
     */
    public function getLast7DaysTransactions(string $accountNumber)
    {
        $movements = AccountMovement::where('account_number', $accountNumber)
            ->where('created_at', '>=', now()->subDays(7))
            ->latest()->get();

        return response()->json(['status' => 'success', 'data' => $movements]);
    }

    /**
     * Reversal transaksi
     */
    public function reverseTransaction(Request $request, string $id)
    {
        return DB::transaction(function () use ($id, $request) {
            $original = Transaction::findOrFail($id);

            if ($original->status === 'reversed') {
                return response()->json(['status' => 'error', 'message' => 'Transaksi sudah pernah di-reverse.'], 409);
            }

            $ref = 'REV-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            // Buat jurnal reversal
            $reversal = Transaction::create([
                'id'                  => Str::uuid(),
                'source_account'      => $original->destination_account,
                'destination_account' => $original->source_account,
                'reference_number'    => $ref,
                'amount'              => $original->amount,
                'description'         => 'REVERSAL: ' . $original->reference_number . ' — ' . ($request->reason ?? ''),
                'status'              => 'success',
                'channel'             => 'system',
                'akad_type'           => $original->akad_type,
            ]);

            // Balik saldo
            if ($original->destination_account) {
                $destAcc = Account::where('account_number', $original->destination_account)->lockForUpdate()->firstOrFail();
                $dBefore = $destAcc->balance;
                $destAcc->balance -= $original->amount;
                $destAcc->save();
                AccountMovement::create([
                    'account_number' => $destAcc->account_number,
                    'transaction_id' => $reversal->id,
                    'amount'         => $original->amount,
                    'type'           => 'debit',
                    'balance_before' => $dBefore,
                    'balance_after'  => $destAcc->balance,
                    'description'    => $reversal->description,
                ]);
            }

            if ($original->source_account) {
                $srcAcc = Account::where('account_number', $original->source_account)->lockForUpdate()->firstOrFail();
                $sBefore = $srcAcc->balance;
                $srcAcc->balance += $original->amount;
                $srcAcc->save();
                AccountMovement::create([
                    'account_number' => $srcAcc->account_number,
                    'transaction_id' => $reversal->id,
                    'amount'         => $original->amount,
                    'type'           => 'credit',
                    'balance_before' => $sBefore,
                    'balance_after'  => $srcAcc->balance,
                    'description'    => $reversal->description,
                ]);
            }

            $original->update(['status' => 'reversed']);

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi berhasil di-reverse.',
                'data'    => $reversal,
            ]);
        });
    }

    /**
     * Aktivasi / Konfirmasi transaksi pending (misal pembayaran pendaftaran)
     */
    public function activate(Request $request, string $id)
    {
        $transaction = Transaction::findOrFail($id);

        if ($transaction->status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Hanya transaksi pending yang bisa diaktivasi.'], 400);
        }

        try {
            DB::transaction(function () use ($transaction, $request) {
                if ($request->has('amount')) {
                    $transaction->amount = $request->amount;
                }

                $transaction->status = 'success';
                $transaction->save();

                // Hanya terapkan mutasi saldo jika ini bukan transaksi tagihan registrasi.
                // Transaksi REG-* adalah catatan pendapatan bank (jurnal COA),
                // bukan debit/kredit langsung ke rekening santri.
                // Pelunasan biaya pendaftaran terjadi saat top-up + PaymentService.
                $isRegistrationTrx = str_starts_with($transaction->reference_number ?? '', 'REG');

                if (!$isRegistrationTrx) {
                    app(AccountingService::class)->applyBalanceMovement($transaction);
                }
            });

            // Pemicu callback ke SMPT jika ini transaksi registrasi
            $isRegistrationTrx = str_starts_with($transaction->reference_number ?? '', 'REG');
            if ($isRegistrationTrx) {
                try {
                    $smptUrl = config('services.smpt.url');
                    $smptInternalKey = config('services.smpt.internal_key');
                    
                    Http::withHeaders([
                        'X-Internal-Key' => $smptInternalKey,
                        'Accept'         => 'application/json',
                    ])->post("{$smptUrl}/api/internal/transaction/activate-callback", [
                        'reference_number' => $transaction->reference_number,
                        'amount'           => $transaction->amount,
                    ]);
                } catch (\Exception $callbackEx) {
                    Log::error('Failed to notify SMPT on registration payment callback: ' . $callbackEx->getMessage());
                }
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Pembayaran berhasil dikonfirmasi.',
                'data'    => $transaction->load(['sourceAccount', 'destinationAccount']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Store internal transaction from SMPT registration
     */
    public function storeInternal(Request $request) 
    {
        $request->validate([
            'transaction_type_id' => 'required|exists:transaction_types,id',
            'amount' => 'required|numeric',
            'source_account' => 'required|exists:accounts,account_number',
            'reference_number' => 'required|string',
            'channel' => 'required|string',
            'description' => 'required|string',
        ]);

        try {
            $type = TransactionType::findOrFail($request->transaction_type_id);

            $transaction = app(AccountingService::class)->recordTransaction(
                $type->code,
                $request->amount,
                $request->source_account,
                null, // destination_account
                $request->description,
                $request->channel,
                [
                    'reference_number' => $request->reference_number,
                    'status' => 'pending',
                ]
            );

            return response()->json([
                'status' => 'success',
                'data' => $transaction
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get transaction history for account via internal API.
     */
    public function getByAccountInternal(string $accountNumber, Request $request)
    {
        $movements = AccountMovement::where('account_number', $accountNumber)
            ->latest()
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $movements
        ]);
    }
}
