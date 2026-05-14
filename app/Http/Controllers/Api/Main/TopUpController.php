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
            'account_number'     => 'required|exists:accounts,account_number',
            'payment_package_id' => 'required|exists:payment_packages,id',
            'amount'             => 'required|numeric|min:1000',
            'notes'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            // Buat record top-up (audit trail frontend)
            $topUp = TopUpRequest::create([
                'account_number'     => $request->account_number,
                'payment_package_id' => $request->payment_package_id,
                'amount'             => $request->amount,
                'channel'            => 'cash',
                'status'             => 'success',
                'payment_ref'        => 'CASH-' . date('YmdHis') . rand(100, 999),
                'verified_by'        => auth('api')->id(),
                'verified_at'        => now(),
                'notes'              => $request->notes,
            ]);

            // Step 1: Catat transaksi perbankan & Jurnal COA (WAJIB SUKSES)
            $transaction = app(\App\Services\AccountingService::class)->recordTransaction(
                'TOPUP-CASH',
                $request->amount,
                null,
                $request->account_number,
                $request->notes ?? 'Top-up tunai via kasir',
                'cash',
                ['reference_number' => $topUp->payment_ref]
            );

            // Step 2: Pemicu otomatis pembayaran paket (OPSIONAL - tidak rollback top-up jika gagal)
            $paymentWarning = null;
            try {
                app(\App\Services\PaymentService::class)->processPayment(
                    $request->account_number,
                    $request->payment_package_id,
                    $topUp->id,
                    "Pelunasan otomatis dari Top-Up Tunai [{$topUp->payment_ref}]"
                );
            } catch (\Exception $e) {
                // Log warning saja — top-up tetap berhasil, paket belum terbayar
                \Illuminate\Support\Facades\Log::warning('Top-up berhasil, tapi paket belum terbayar: ' . $e->getMessage(), [
                    'account_number'     => $request->account_number,
                    'payment_package_id' => $request->payment_package_id,
                    'top_up_ref'         => $topUp->payment_ref,
                ]);
                $paymentWarning = $e->getMessage();
            }

            return response()->json([
                'status'          => 'success',
                'message'         => 'Top-up tunai berhasil.' . ($paymentWarning ? ' Catatan: ' . $paymentWarning : ' Pembayaran paket diproses.'),
                'data'            => $topUp,
                'payment_warning' => $paymentWarning,
            ], 201);
        });
    }

    /**
     * Top-up via transfer bank — wali upload bukti
     */
    public function bankTransferTopUp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number'     => 'required|exists:accounts,account_number',
            'payment_package_id' => 'required|exists:payment_packages,id',
            'amount'             => 'required|numeric|min:10000',
            'payment_proof'      => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'notes'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $proofPath = $request->file('payment_proof')->store('top-up-proofs', 'public');
        $ref = 'TRF-' . date('YmdHis') . rand(100, 999);

        $topUp = TopUpRequest::create([
            'account_number'     => $request->account_number,
            'payment_package_id' => $request->payment_package_id,
            'amount'             => $request->amount,
            'channel'            => 'bank_transfer',
            'status'             => 'waiting_verification',
            'payment_ref'        => $ref,
            'payment_proof'      => $proofPath,
            'notes'              => $request->notes,
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
            $topUp->update([
                'status'      => 'success',
                'verified_by' => auth('api')->id(),
                'verified_at' => now(),
                'notes'       => $request->notes ?? $topUp->notes,
            ]);

            try {
                // Catat transaksi perbankan & Jurnal COA
                app(\App\Services\AccountingService::class)->recordTransaction(
                    'TOPUP-TRF', // Make sure this code exists in transaction_types
                    $topUp->amount,
                    null,
                    $topUp->account_number,
                    $topUp->notes ?? 'Top-up transfer bank terverifikasi',
                    'bank_transfer',
                    ['reference_number' => $topUp->payment_ref]
                );

                // Pemicu otomatis pembayaran paket jika ada
                if ($topUp->payment_package_id) {
                    app(\App\Services\PaymentService::class)->processPayment(
                        $topUp->account_number,
                        $topUp->payment_package_id,
                        $topUp->id,
                        "Pelunasan otomatis dari Bank Transfer [{$topUp->payment_ref}]"
                    );
                }

                return response()->json([
                    'status'  => 'success',
                    'message' => 'Top-up berhasil diverifikasi dan pembayaran diproses.',
                    'data'    => $topUp,
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Verifikasi berhasil, namun gagal mencatat jurnal keuangan: ' . $e->getMessage(),
                ], 422);
            }
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

    /**
     * Webhook Midtrans — stub, siap diaktifkan setelah konfigurasi Midtrans.
     * Validasi signature key akan ditambahkan saat integrasi penuh.
     */
    public function midtransWebhook(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Midtrans Webhook received', $request->all());

        // TODO: Implementasi penuh setelah konfigurasi Midtrans:
        // 1. Validasi signature: hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey)
        // 2. Jika transaction_status === 'settlement' → verifikasi top-up terkait
        // 3. Update TopUpRequest status → success, update balance

        return response()->json(['status' => 'ok'], 200);
    }
}
