<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\TopUpRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class TopUpController extends Controller
{
    /**
     * List semua top-up request (admin)
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $status  = $request->get('status');
        $channel = $request->get('channel');

        $query = TopUpRequest::with('account')->latest();

        if ($status)  $query->where('status', $status);
        if ($channel) $query->where('channel', $channel);

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate($perPage),
        ]);
    }

    /**
     * Riwayat top-up per santri
     */
    public function byAccount(string $accountNumber)
    {
        $requests = TopUpRequest::where('account_number', $accountNumber)
            ->latest()->paginate(20);

        return response()->json(['status' => 'success', 'data' => $requests]);
    }

    /**
     * Top-up tunai oleh teller/admin (langsung berhasil)
     */
    public function cashTopUp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|exists:accounts,account_number',
            'amount'         => 'required|numeric|min:1000',
            'notes'          => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $account = Account::where('account_number', $request->account_number)
                ->lockForUpdate()->firstOrFail();

            // Buat record top-up
            $topUp = TopUpRequest::create([
                'account_number' => $request->account_number,
                'amount'         => $request->amount,
                'channel'        => 'cash',
                'status'         => 'success',
                'payment_ref'    => 'CASH-' . date('YmdHis') . rand(100, 999),
                'verified_by'    => auth('api')->id(),
                'verified_at'    => now(),
                'notes'          => $request->notes,
            ]);

            // Update saldo
            $account->balance += $request->amount;
            $account->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'Top-up tunai berhasil. Saldo baru: Rp ' . number_format($account->balance, 0, ',', '.'),
                'data'    => $topUp,
            ], 201);
        });
    }

    /**
     * Top-up via transfer bank — wali upload bukti
     */
    public function bankTransferTopUp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|exists:accounts,account_number',
            'amount'         => 'required|numeric|min:10000',
            'payment_proof'  => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'notes'          => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $proofPath = $request->file('payment_proof')->store('top-up-proofs', 'public');
        $ref = 'TRF-' . date('YmdHis') . rand(100, 999);

        $topUp = TopUpRequest::create([
            'account_number' => $request->account_number,
            'amount'         => $request->amount,
            'channel'        => 'bank_transfer',
            'status'         => 'waiting_verification',
            'payment_ref'    => $ref,
            'payment_proof'  => $proofPath,
            'notes'          => $request->notes,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Bukti transfer diterima. Menunggu verifikasi admin.',
            'data'    => $topUp,
        ], 201);
    }

    /**
     * Admin verifikasi top-up transfer bank
     */
    public function verify(Request $request, int $id)
    {
        $topUp = TopUpRequest::where('id', $id)
            ->where('status', 'waiting_verification')
            ->firstOrFail();

        return DB::transaction(function () use ($topUp, $request) {
            $account = Account::where('account_number', $topUp->account_number)
                ->lockForUpdate()->firstOrFail();

            $topUp->update([
                'status'      => 'success',
                'verified_by' => auth('api')->id(),
                'verified_at' => now(),
                'notes'       => $request->notes ?? $topUp->notes,
            ]);

            $account->balance += $topUp->amount;
            $account->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'Top-up berhasil diverifikasi. Saldo santri telah bertambah.',
                'data'    => $topUp,
            ]);
        });
    }

    /**
     * Admin tolak top-up yang sudah diajukan
     */
    public function reject(Request $request, int $id)
    {
        $topUp = TopUpRequest::where('id', $id)
            ->whereIn('status', ['waiting_verification', 'pending'])
            ->firstOrFail();

        $topUp->update([
            'status'      => 'failed',
            'verified_by' => auth('api')->id(),
            'verified_at' => now(),
            'notes'       => $request->notes ?? 'Ditolak oleh admin.',
        ]);

        return response()->json(['status' => 'success', 'message' => 'Top-up berhasil ditolak.', 'data' => $topUp]);
    }
}
