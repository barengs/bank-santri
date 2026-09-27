<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::when($request->search, fn($q, $s) => $q->where('product_name', 'like', "%{$s}%"))
            ->get();

        return response()->json(['status' => 'success', 'data' => $products]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_code' => 'required|string|max:20|unique:products,product_code',
            'product_name' => 'required|string|max:100',
            'product_type' => 'required|in:Tabungan,Deposito,Pinjaman',
            'interest_rate'          => 'nullable|numeric|min:0|max:100',
            'admin_fee'              => 'nullable|numeric|min:0',
            'opening_fee'            => 'required|numeric|min:0',
            'minimum_balance'        => 'nullable|numeric|min:0',
            'daily_withdrawal_limit' => 'nullable|numeric|min:0',
            'is_active'              => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $product = Product::create($request->all());
        return response()->json(['status' => 'success', 'data' => $product], 201);
    }

    public function show(string $id)
    {
        return response()->json(['status' => 'success', 'data' => Product::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'product_code'           => 'sometimes|string|max:20|unique:products,product_code,' . $id,
            'product_name'           => 'sometimes|string|max:100',
            'product_type'           => 'sometimes|in:Tabungan,Deposito,Pinjaman',
            'interest_rate'          => 'nullable|numeric|min:0|max:100',
            'admin_fee'              => 'nullable|numeric|min:0',
            'opening_fee'            => 'nullable|numeric|min:0',
            'minimum_balance'        => 'nullable|numeric|min:0',
            'daily_withdrawal_limit' => 'nullable|numeric|min:0',
            'is_active'              => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $product->update($request->all());
        return response()->json(['status' => 'success', 'data' => $product]);
    }

    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        if ($product->accounts()->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Produk sudah digunakan oleh rekening.'], 409);
        }
        $product->delete();
        return response()->json(['status' => 'success', 'message' => 'Produk berhasil dihapus.']);
    }

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\Master\ProductExport, 'laporan_produk_' . date('Y-m-d_H-i-s') . '.xlsx');
    }

    public function backup()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\Master\ProductBackupExport, 'backup_produk_' . date('Y-m-d_H-i-s') . '.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\Master\ProductTemplateExport, 'template_produk.xlsx');
    }

    public function import(\Illuminate\Http\Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:10240']);
        $import = new \App\Imports\Master\ProductImport();
        \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
        $success = $import->getSuccessCount();
        $fail = $import->getFailureCount();
        return response()->json([
            'status' => 'success',
            'message' => "Import selesai: $success berhasil, $fail gagal.",
            'data' => [
                'success_count' => $success,
                'failure_count' => $fail,
                'errors' => $import->getErrors()
            ]
        ]);
    }
}
