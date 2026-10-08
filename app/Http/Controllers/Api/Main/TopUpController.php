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
            'payment_package_id' => 'nullable|exists:payment_packages,id',
            'bill_ids'           => 'nullable|array',
            'bill_ids.*'         => 'integer|exists:bills,id',
            'addon_item_ids'     => 'nullable|array',
            'addon_item_ids.*'   => 'integer|exists:transaction_items,id',
            'amount'             => 'required|numeric|min:1000',
            'notes'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        // Jika input dari teller memiliki bill_ids (Artinya opsi Bayar Tagihan Paket dipilih)
        if ($request->has('bill_ids') && count($request->bill_ids) > 0) {
            try {
                $result = app(\App\Services\BillingService::class)->payBillsCash(
                    $request->account_number,
                    $request->bill_ids,
                    $request->notes,
                    auth('api')->id()
                );

                return response()->json([
                    'status'  => 'success',
                    'message' => 'Pembayaran tunai tagihan berhasil. Sisa tunggakan Rp ' . number_format((float) $result['remaining_arrears'], 0, ',', '.'),
                    'data'    => $result,
                ], 201);
            } catch (\Exception $e) {
                return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
            }
        }

        // Jika tidak ada bill_ids (Artinya opsi Top-Up Tabungan atau Paket Regular + Addon)
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
            if ($request->payment_package_id) {
                try {
                    app(\App\Services\PaymentService::class)->processPayment(
                        $request->account_number,
                        $request->payment_package_id,
                        $topUp->id,
                        "Pelunasan otomatis dari Top-Up Tunai [{$topUp->payment_ref}]"
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Top-up berhasil, tapi paket belum terbayar: ' . $e->getMessage(), [
                        'account_number'     => $request->account_number,
                        'payment_package_id' => $request->payment_package_id,
                        'top_up_ref'         => $topUp->payment_ref,
                    ]);
                    $paymentWarning = $e->getMessage();
                }
            }

            // Step 3: Proses item Add-on jika dipilih
            $processedAddons = [];
            if (!empty($request->addon_item_ids)) {
                $addonItems = \App\Models\TransactionItem::whereIn('id', $request->addon_item_ids)
                    ->where('is_active', true)
                    ->get();

                foreach ($addonItems as $addon) {
                    try {
                        app(\App\Services\AccountingService::class)->recordPackageItemTransaction(
                            $addon,
                            (float) $addon->default_amount,
                            $request->account_number,
                            $addon->destination_account,
                            "Biaya Add-On: {$addon->item_name} [{$topUp->payment_ref}]",
                            'cash',
                            ['reference_number' => $topUp->payment_ref . '-ADD' . $addon->id]
                        );
                        $processedAddons[] = [
                            'id'     => $addon->id,
                            'name'   => $addon->item_name,
                            'amount' => (float) $addon->default_amount,
                        ];
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning("Gagal memproses add-on {$addon->item_name}: " . $e->getMessage());
                    }
                }
            }

            return response()->json([
                'status'          => 'success',
                'message'         => 'Top-up tunai berhasil.' . ($paymentWarning ? ' Catatan: ' . $paymentWarning : ($request->payment_package_id ? ' Pembayaran paket diproses.' : '')),
                'data'            => array_merge($topUp->toArray(), [
                    'addons' => $processedAddons,
                ]),
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
                $paymentWarning = null;
                if ($topUp->payment_package_id) {
                    try {
                        app(\App\Services\PaymentService::class)->processPayment(
                            $topUp->account_number,
                            $topUp->payment_package_id,
                            $topUp->id,
                            "Pelunasan otomatis dari Bank Transfer [{$topUp->payment_ref}]"
                        );
                    } catch (\Exception $e) {
                        // Log warning saja — top-up tabungan berhasil, tapi paket tidak terbayar
                        \Illuminate\Support\Facades\Log::warning('Verifikasi transfer berhasil, tapi pelunasan paket gagal: ' . $e->getMessage(), [
                            'top_up_id' => $topUp->id,
                        ]);
                        $paymentWarning = $e->getMessage();
                    }
                }

                return response()->json([
                    'status'          => 'success',
                    'message'         => 'Top-up berhasil diverifikasi.' . ($paymentWarning ? " Catatan: {$paymentWarning}" : ($topUp->payment_package_id ? " Pembayaran paket diproses." : "")),
                    'data'            => $topUp,
                    'payment_warning' => $paymentWarning,
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Verifikasi top-up gagal saat mencatat jurnal kas: ' . $e->getMessage(),
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
