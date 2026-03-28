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
            ->paginate($request->get('per_page', 15));

        return response()->json(['status' => 'success', 'data' => $products]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_code' => 'required|string|max:20|unique:products,product_code',
            'product_name' => 'required|string|max:100',
            'product_type' => 'required|in:Tabungan,Deposito,Pinjaman',
            'interest_rate'=> 'nullable|numeric|min:0|max:100',
            'admin_fee'    => 'nullable|numeric|min:0',
            'opening_fee'  => 'required|numeric|min:0',
            'is_active'    => 'boolean',
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
            'product_code' => 'sometimes|string|max:20|unique:products,product_code,' . $id,
            'product_name' => 'sometimes|string|max:100',
            'product_type' => 'sometimes|in:Tabungan,Deposito,Pinjaman',
            'interest_rate'=> 'nullable|numeric|min:0|max:100',
            'admin_fee'    => 'nullable|numeric|min:0',
            'opening_fee'  => 'nullable|numeric|min:0',
            'is_active'    => 'sometimes|boolean',
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
}
