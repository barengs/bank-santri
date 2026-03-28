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
            'teller_id'      => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $account = Account::where('account_number', $request->account_number)->lockForUpdate()->firstOrFail();

            if (!in_array($account->status, ['AKTIF'])) {
                return response()->json(['status' => 'error', 'message' => 'Rekening tidak aktif.'], 422);
            }

            $ref = 'DEP-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            $transaction = Transaction::create([
                'id'                  => Str::uuid(),
                'destination_account' => $account->account_number,
                'reference_number'    => $ref,
                'amount'              => $request->amount,
                'description'         => $request->description ?? 'Setoran tunai',
                'status'              => 'success',
                'channel'             => 'teller',
                'akad_type'           => 'wadiah',
            ]);

            // Update saldo dan catat mutasi
            $balanceBefore = $account->balance;
            $account->balance += $request->amount;
            $account->save();

            AccountMovement::create([
                'account_number' => $account->account_number,
                'transaction_id' => $transaction->id,
                'amount'         => $request->amount,
                'type'           => 'credit',
                'balance_before' => $balanceBefore,
                'balance_after'  => $account->balance,
                'description'    => $transaction->description,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Setoran tunai berhasil. Saldo baru: Rp ' . number_format($account->balance, 0, ',', '.'),
                'data'    => $transaction,
            ], 201);
        });
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

        return DB::transaction(function () use ($request) {
            $account = Account::where('account_number', $request->account_number)->lockForUpdate()->firstOrFail();

            if ($account->status !== 'AKTIF') {
                return response()->json(['status' => 'error', 'message' => 'Rekening tidak aktif.'], 422);
            }

            if ($account->balance < $request->amount) {
                return response()->json(['status' => 'error', 'message' => 'Saldo tidak mencukupi.'], 422);
            }

            $ref = 'WDR-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            $transaction = Transaction::create([
                'id'             => Str::uuid(),
                'source_account' => $account->account_number,
                'reference_number' => $ref,
                'amount'         => $request->amount,
                'description'    => $request->description ?? 'Penarikan tunai',
                'status'         => 'success',
                'channel'        => 'teller',
                'akad_type'      => 'wadiah',
            ]);

            $balanceBefore  = $account->balance;
            $account->balance -= $request->amount;
            $account->save();

            AccountMovement::create([
                'account_number' => $account->account_number,
                'transaction_id' => $transaction->id,
                'amount'         => $request->amount,
                'type'           => 'debit',
                'balance_before' => $balanceBefore,
                'balance_after'  => $account->balance,
                'description'    => $transaction->description,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Penarikan berhasil. Saldo sisa: Rp ' . number_format($account->balance, 0, ',', '.'),
                'data'    => $transaction,
            ], 201);
        });
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

        return DB::transaction(function () use ($request) {
            $source = Account::where('account_number', $request->source_account)->lockForUpdate()->firstOrFail();
            $dest   = Account::where('account_number', $request->destination_account)->lockForUpdate()->firstOrFail();

            if ($source->status !== 'AKTIF') {
                return response()->json(['status' => 'error', 'message' => 'Rekening sumber tidak aktif.'], 422);
            }

            if ($source->balance < $request->amount) {
                return response()->json(['status' => 'error', 'message' => 'Saldo tidak mencukupi.'], 422);
            }

            $ref = 'TRF-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            $transaction = Transaction::create([
                'id'                  => Str::uuid(),
                'source_account'      => $source->account_number,
                'destination_account' => $dest->account_number,
                'reference_number'    => $ref,
                'amount'              => $request->amount,
                'description'         => $request->description ?? 'Transfer antar rekening',
                'status'              => 'success',
                'channel'             => 'system',
                'akad_type'           => 'wadiah',
            ]);

            // Debet source
            $srcBefore      = $source->balance;
            $source->balance -= $request->amount;
            $source->save();
            AccountMovement::create([
                'account_number' => $source->account_number,
                'transaction_id' => $transaction->id,
                'amount'         => $request->amount,
                'type'           => 'debit',
                'balance_before' => $srcBefore,
                'balance_after'  => $source->balance,
                'description'    => 'Transfer ke ' . $dest->account_number,
            ]);

            // Kredit destination
            $dstBefore    = $dest->balance;
            $dest->balance += $request->amount;
            $dest->save();
            AccountMovement::create([
                'account_number' => $dest->account_number,
                'transaction_id' => $transaction->id,
                'amount'         => $request->amount,
                'type'           => 'credit',
                'balance_before' => $dstBefore,
                'balance_after'  => $dest->balance,
                'description'    => 'Transfer dari ' . $source->account_number,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Transfer berhasil.',
                'data'    => $transaction,
            ], 201);
        });
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
