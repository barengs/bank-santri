<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BillController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    /**
     * List semua tagihan dengan filter
     */
    public function index(Request $request)
    {
        $bills = Bill::with(['account', 'package'])
            ->when($request->account_number, fn($q, $an) => $q->where('account_number', $an))
            ->when($request->bill_period, fn($q, $bp) => $q->where('bill_period', $bp))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest('bill_period')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data'   => $bills,
        ]);
    }

    /**
     * Preview sebelum staf menerbitkan tagihan batch
     */
    public function preview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bill_period' => 'required|date_format:Y-m',
            'package_id'  => 'required|exists:payment_packages,id',
            'due_date'    => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $preview = $this->billingService->previewGeneration(
                $request->bill_period,
                (int) $request->package_id,
                $request->due_date
            );

            return response()->json([
                'status' => 'success',
                'data'   => $preview,
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Terbitkan tagihan secara batch oleh staf bendahara
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bill_period'      => 'required|date_format:Y-m',
            'package_id'       => 'required|exists:payment_packages,id',
            'due_date'         => 'nullable|date',
            'target_accounts'  => 'nullable|array',
            'target_accounts.*'=> 'exists:accounts,account_number',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $result = $this->billingService->generateBills(
                $request->bill_period,
                (int) $request->package_id,
                $request->due_date,
                auth('api')->id(),
                $request->get('target_accounts', [])
            );

            return response()->json([
                'status'  => 'success',
                'message' => "Tagihan periode {$request->bill_period} berhasil diterbitkan.",
                'data'    => $result,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Detail satu tagihan beserta riwayat pembayaran
     */
    public function show($id)
    {
        $bill = Bill::with(['account', 'package', 'payments.paymentRecord'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $bill,
        ]);
    }

    /**
     * Tagihan dan ringkasan tunggakan per rekening santri
     */
    public function byAccount(string $accountNumber)
    {
        $summary = $this->billingService->getArrearsSummary($accountNumber);

        return response()->json([
            'status' => 'success',
            'data'   => $summary,
        ]);
    }

    /**
     * Trigger update status tagihan yang lewat jatuh tempo menjadi overdue
     */
    public function markOverdue()
    {
        $updated = Bill::markOverdue();

        return response()->json([
            'status'  => 'success',
            'message' => "Berhasil memperbarui {$updated} tagihan menjadi overdue.",
            'updated' => $updated,
        ]);
    }

    /**
     * API Internal: Ringkasan tunggakan per rekening santri (Tanpa JWT, butuh X-Internal-Key)
     */
    public function getArrearsInternal(string $accountNumber)
    {
        $summary = $this->billingService->getArrearsSummary($accountNumber);

        return response()->json([
            'status' => 'success',
            'data'   => $summary,
        ]);
    }

    /**
     * Pembayaran tunai tagihan oleh teller (Kasir).
     * Teller memasukkan NIS, memilih bulan tagihan dari daftar tunggakan,
     * uang tunai langsung melunasi tagihan terpilih TANPA masuk ke saldo tabungan santri.
     *
     * POST /api/main/bills/pay-cash
     * Body: { account_number, bill_ids: [1,2], notes? }
     */
    public function payCash(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|exists:accounts,account_number',
            'bill_ids'       => 'required|array|min:1',
            'bill_ids.*'     => 'integer|exists:bills,id',
            'notes'          => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $result = $this->billingService->payBillsCash(
                $request->account_number,
                $request->bill_ids,
                $request->notes,
                auth('api')->id()
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Pembayaran tunai tagihan berhasil. '
                    . ($result['has_arrears']
                        ? "Sisa tunggakan Rp " . number_format((float) $result['remaining_arrears'], 0, ',', '.')
                            . " ({$result['overdue_months']} bulan)."
                        : 'Seluruh tagihan telah LUNAS.'),
                'data'    => $result,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}
