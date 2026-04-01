<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\PaymentPackage;
use App\Models\PaymentRecord;
use App\Models\PaymentRecordItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * List semua pembayaran (admin) dengan filter
     */
    public function index(Request $request)
    {
        $payments = PaymentRecord::with(['account', 'package', 'items'])
            ->when($request->account_number, fn($q, $an) => $q->where('account_number', $an))
            ->when($request->package_id, fn($q, $pid) => $q->where('package_id', $pid))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate($request->get('per_page', 20));

        return response()->json(['status' => 'success', 'data' => $payments]);
    }

    /**
     * Riwayat pembayaran per rekening santri
     */
    public function byAccount(string $accountNumber, Request $request)
    {
        $payments = PaymentRecord::with(['package.items', 'items'])
            ->where('account_number', $accountNumber)
            ->latest()
            ->paginate($request->get('per_page', 20));

        return response()->json(['status' => 'success', 'data' => $payments]);
    }

    /**
     * Detail pembayaran
     */
    public function show(string $id)
    {
        $payment = PaymentRecord::with(['account', 'package.items', 'items', 'topUpRequest'])
            ->findOrFail($id);

        return response()->json(['status' => 'success', 'data' => $payment]);
    }

    /**
     * Proses pembayaran paket dari saldo rekening santri.
     *
     * Alur:
     * 1. Validasi rekening aktif dan saldo mencukupi
     * 2. Item non-saku → langsung dieksekusi (debit dari balance)
     * 3. Item saku → dikreditkan kembali ke account sebagai "uang saku"
     *    (semantik: sudah terpisah dari dana paket, tetap di rekening)
     * 4. Catat payment_record + payment_record_items
     * 5. Catat account_movement
        public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number'    => 'required|exists:accounts,account_number',
            'package_id'        => 'required|exists:payment_packages,id',
            'top_up_request_id' => 'nullable|exists:top_up_requests,id',
            'notes'             => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $record = app(\App\Services\PaymentService::class)->processPayment(
                $request->account_number,
                $request->package_id,
                $request->top_up_request_id,
                $request->notes
            );

            return response()->json([
                'status'  => 'success',
                'message' => "Pembayaran paket berhasil diproses.",
                'data'    => $record->load(['items', 'package']),
                'balance' => [
                    'after' => Account::where('account_number', $request->account_number)->value('balance'),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}
