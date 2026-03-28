<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\TransactionType;
use Illuminate\Http\Request;

class TransactionTypeController extends Controller
{
    public function index(Request $request)
    {
        $types = TransactionType::when($request->category, fn($q, $c) => $q->where('category', $c))
            ->paginate($request->get('per_page', 15));

        return response()->json(['status' => 'success', 'data' => $types]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'               => 'required|string|unique:transaction_types,code',
            'name'               => 'required|string|max:255',
            'category'           => 'required|in:transfer,payment,cash_operation,fee,topup',
            'is_debit'           => 'required|boolean',
            'is_credit'          => 'required|boolean',
            'default_debit_coa'  => 'nullable|string',
            'default_credit_coa' => 'nullable|string',
        ]);

        return response()->json(['status' => 'success', 'data' => TransactionType::create($request->all())], 201);
    }

    public function show(string $id)
    {
        return response()->json(['status' => 'success', 'data' => TransactionType::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $type = TransactionType::findOrFail($id);
        $type->update($request->all());
        return response()->json(['status' => 'success', 'data' => $type]);
    }

    public function destroy(string $id)
    {
        $type = TransactionType::findOrFail($id);
        if ($type->transactions()->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus tipe transaksi yang sudah digunakan.'], 409);
        }
        $type->delete();
        return response()->json(['status' => 'success', 'message' => 'Tipe transaksi berhasil dihapus.']);
    }
}
