<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\Transaction;
use App\Models\TransactionLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    /**
     * List transaksi dengan filter
     */
    public function index(Request $request)
    {
        $transactions = Transaction::with(['sourceAccount', 'destinationAccount', 'transactionType'])
            ->when($request->status, fn($q, $s)  => $q->where('status', $s))
            ->when($request->channel, fn($q, $c) => $q->where('channel', $c))
            ->latest()
            ->paginate($request->get('per_page', 20));

        return response()->json(['status' => 'success', 'data' => $transactions]);
    }

    public function show(string $id)
    {
        $transaction = Transaction::with(['ledgerEntries', 'sourceAccount', 'destinationAccount', 'transactionType'])
            ->findOrFail($id);

        return response()->json(['status' => 'success', 'data' => $transaction]);
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
            $transaction = app(\App\Services\AccountingService::class)->recordTransaction(
                'CASH-DEP',
                $request->amount,
                null,
                $request->account_number,
                $request->description ?? 'Setoran tunai',
                'teller'
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Setoran tunai berhasil diproses.',
                'data'    => $transaction,
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
            $transaction = app(\App\Services\AccountingService::class)->recordTransaction(
                'CASH-WDR',
                $request->amount,
                $request->account_number,
                null,
                $request->description ?? 'Penarikan tunai',
                'teller'
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Penarikan tunai berhasil diproses.',
                'data'    => $transaction,
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
            $transaction = app(\App\Services\AccountingService::class)->recordTransaction(
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
}
