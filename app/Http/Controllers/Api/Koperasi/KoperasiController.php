<?php

namespace App\Http\Controllers\Api\Koperasi;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\KoperasiTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class KoperasiController extends Controller
{
    /**
     * Cek rekening santri berdasarkan NIS (scan QR Code / input manual).
     * Mengembalikan nama, saldo, dan foto santri.
     */
    public function check(string $nis)
    {
        $account = Account::where('account_number', $nis)->first();

        if (!$account) {
            return response()->json([
                'status'  => 'error',
                'message' => "NIS {$nis} tidak terdaftar dalam sistem.",
            ], 404);
        }

        if ($account->status !== 'AKTIF') {
            return response()->json([
                'status'  => 'error',
                'message' => "Rekening santri tidak aktif.",
            ], 422);
        }

        // Ambil data santri dari SMPT
        $studentData = null;
        try {
            $smptUrl = env('SMPT_URL', 'http://localhost:8000');
            $res = Http::timeout(5)->get("{$smptUrl}/api/main/student/{$account->customer_id}");
            if ($res->successful()) {
                $studentData = $res->json('data');
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Koperasi: Gagal ambil data santri dari SMPT: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'account_number' => $account->account_number,
                'customer_name'  => $account->customer_name,
                'balance'        => $account->balance,
                'balance_formatted' => 'Rp ' . number_format($account->balance, 0, ',', '.'),
                'student'        => $studentData,
            ],
        ]);
    }

    /**
     * Proses transaksi debit di koperasi via QR Code / NIS.
     */
    public function debit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number'   => 'required|exists:accounts,account_number',
            'amount'           => 'required|numeric|min:100',
            'item_description' => 'nullable|string|max:255',
            'outlet_name'      => 'nullable|string|max:100',
            'cashier_note'     => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $ref = 'KOP-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            try {
                // 1. Catat Transaksi Perbankan & Jurnal COA (Double-Entry)
                $transaction = app(\App\Services\AccountingService::class)->recordTransaction(
                    'COOP-BUY', // Make sure this code exists
                    $request->amount,
                    $request->account_number,
                    null,
                    "Belanja Koperasi — " . ($request->item_description ?? 'Pembelian') . " [{$ref}]",
                    'koperasi',
                    ['reference_number' => $ref]
                );

                // 2. Catat Transaksi Koperasi (Internal Audit Unit Koperasi)
                // Note: Balance before/after di tabel ini sekarang dihitung dari state di AccountingService
                $accountAfter = Account::where('account_number', $request->account_number)->first();
                
                $kTrx = KoperasiTransaction::create([
                    'account_number'   => $request->account_number,
                    'reference_number' => $ref,
                    'amount'           => $request->amount,
                    'balance_before'   => $accountAfter->balance + $request->amount,
                    'balance_after'    => $accountAfter->balance,
                    'outlet_name'      => $request->outlet_name ?? 'Koperasi Pesantren',
                    'item_description' => $request->item_description,
                    'cashier_note'     => $request->cashier_note,
                ]);

                return response()->json([
                    'status'  => 'success',
                    'message' => 'Transaksi berhasil. Saldo sisa: Rp ' . number_format($accountAfter->balance, 0, ',', '.'),
                    'data'    => [
                        'reference_number'  => $ref,
                        'account_number'    => $request->account_number,
                        'customer_name'     => $accountAfter->customer_name,
                        'amount'            => $request->amount,
                        'balance_before'    => $accountAfter->balance + $request->amount,
                        'balance_after'     => $accountAfter->balance,
                        'item_description'  => $request->item_description,
                        'outlet_name'       => $kTrx->outlet_name,
                        'transaction_time'  => now()->toDateTimeString(),
                    ],
                ], 201);

            } catch (\Exception $e) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Gagal memproses transaksi: ' . $e->getMessage(),
                ], 422);
            }
        });
    }

    /**
     * Riwayat transaksi koperasi (untuk kasir / admin)
     */
    public function transactions(Request $request)
    {
        $trx = KoperasiTransaction::with('account')
            ->when($request->account_number, fn($q, $an) => $q->where('account_number', $an))
            ->latest()
            ->paginate($request->get('per_page', 20));

        return response()->json(['status' => 'success', 'data' => $trx]);
    }
}
