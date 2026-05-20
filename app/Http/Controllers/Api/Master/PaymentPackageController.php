<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\PaymentPackage;
use App\Models\PaymentPackageItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentPackageController extends Controller
{
    /**
     * List semua paket pembayaran
     */
    public function index(Request $request)
    {
        $packages = PaymentPackage::with('items')
            ->when($request->search, fn($q, $s) => $q->where('package_name', 'like', "%{$s}%"))
            ->when(isset($request->is_active), fn($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)))
            ->latest()
            ->paginate($request->get('per_page', 15));

        return response()->json(['status' => 'success', 'data' => $packages]);
    }

    /**
     * Buat paket baru beserta items
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'package_code'          => 'required|string|max:30|unique:payment_packages,package_code',
            'package_name'          => 'required|string|max:150',
            'description'           => 'nullable|string',
            'academic_year'         => 'nullable|string|max:20',
            'semester'              => 'nullable|in:ganjil,genap',
            'is_active'             => 'boolean',
            'items'                     => 'required|array|min:1',
            'items.*.transaction_item_id' => 'required_unless:items.*.category,saku|nullable|exists:transaction_items,id',
            'items.*.item_name'         => 'required|string|max:150',
            'items.*.category'          => 'required|in:pendidikan,asrama,konsumsi,kesehatan,saku,lainnya',
            'items.*.amount'            => 'required|numeric|min:0',
            'items.*.is_saku'           => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $package = PaymentPackage::create([
                'package_code'  => $request->package_code,
                'package_name'  => $request->package_name,
                'description'   => $request->description,
                'academic_year' => $request->academic_year,
                'semester'      => $request->semester,
                'is_active'     => $request->get('is_active', true),
                'total_amount'  => 0,
                'saku_amount'   => 0,
            ]);

            foreach ($request->items as $item) {
                $isSaku = (bool) ($item['is_saku'] ?? ($item['category'] === 'saku'));
                $package->items()->create([
                    'transaction_item_id' => $item['transaction_item_id'] ?? null,
                    'item_name'           => $item['item_name'],
                    'category'            => $item['category'],
                    'amount'              => $item['amount'],
                    'is_saku'             => $isSaku,
                ]);
            }

            $package->recalculateTotals();

            return response()->json([
                'status'  => 'success',
                'message' => 'Paket pembayaran berhasil dibuat.',
                'data'    => $package->load('items'),
            ], 201);
        });
    }

    /**
     * Detail paket beserta items
     */
    public function show(string $id)
    {
        $package = PaymentPackage::with(['items', 'paymentRecords' => fn($q) => $q->latest()->limit(10)])
            ->findOrFail($id);

        return response()->json(['status' => 'success', 'data' => $package]);
    }

    /**
     * Update paket dan items-nya
     */
    public function update(Request $request, string $id)
    {
        $package = PaymentPackage::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'package_code'      => 'sometimes|string|max:30|unique:payment_packages,package_code,' . $id,
            'package_name'      => 'sometimes|string|max:150',
            'description'       => 'nullable|string',
            'academic_year'     => 'nullable|string|max:20',
            'semester'          => 'nullable|in:ganjil,genap',
            'is_active'         => 'sometimes|boolean',
            'items'                       => 'sometimes|array|min:1',
            'items.*.transaction_item_id' => 'required_unless:items.*.category,saku|nullable|exists:transaction_items,id',
            'items.*.item_name'           => 'required_with:items|string|max:150',
            'items.*.category'            => 'required_with:items|in:pendidikan,asrama,konsumsi,kesehatan,saku,lainnya',
            'items.*.amount'              => 'required_with:items|numeric|min:0',
            'items.*.is_saku'             => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request, $package) {
            $package->update($request->only([
                'package_code', 'package_name', 'description',
                'academic_year', 'semester', 'is_active',
            ]));

            if ($request->has('items')) {
                $package->items()->delete();
                foreach ($request->items as $item) {
                    $isSaku = (bool) ($item['is_saku'] ?? ($item['category'] === 'saku'));
                    $package->items()->create([
                        'transaction_item_id' => $item['transaction_item_id'] ?? null,
                        'item_name'           => $item['item_name'],
                        'category'            => $item['category'],
                        'amount'              => $item['amount'],
                        'is_saku'             => $isSaku,
                    ]);
                }
                $package->recalculateTotals();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Paket berhasil diperbarui.',
                'data'    => $package->load('items'),
            ]);
        });
    }

    /**
     * Hapus paket (hanya jika belum ada transaksi pembayaran)
     */
    public function destroy(string $id)
    {
        $package = PaymentPackage::findOrFail($id);

        if ($package->paymentRecords()->exists()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Paket tidak dapat dihapus karena sudah terdapat riwayat pembayaran.',
            ], 409);
        }

        $package->delete();

        return response()->json(['status' => 'success', 'message' => 'Paket berhasil dihapus.']);
    }
}
