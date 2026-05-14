<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\TransactionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionTypeController extends Controller
{
    public function index(Request $request)
    {
        $types = TransactionType::with('rules.coa', 'rules.transactionItem')
            ->when($request->category, fn($q, $c) => $q->where('category', $c))
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->paginate($request->get('per_page', 15));

        return response()->json(['status' => 'success', 'data' => $types]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'               => 'required|string|unique:transaction_types,code',
            'name'               => 'required|string|max:255',
            'category'           => 'required|in:transfer,payment,cash_operation,fee,topup',
            'rules'              => 'nullable|array',
            'rules.*.coa_code'   => 'required|string|exists:chart_of_accounts,coa_code',
            'rules.*.entry_type' => 'required|in:debit,credit',
            'rules.*.value_mode' => 'required|in:total,fixed,remainder',
            'rules.*.fixed_amount' => 'nullable|numeric|min:0',
            'rules.*.transaction_item_id' => 'nullable|exists:transaction_items,id',
        ]);

        return DB::transaction(function() use ($request) {
            $type = TransactionType::create($request->only([
                'code', 'name', 'category'
            ]));

            if ($request->has('rules')) {
                foreach ($request->rules as $rule) {
                    $type->rules()->create($rule);
                }
            }

            return response()->json(['status' => 'success', 'data' => $type->load('rules')], 201);
        });
    }

    public function show(string $id)
    {
        return response()->json(['status' => 'success', 'data' => TransactionType::with('rules.coa', 'rules.transactionItem')->findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $type = TransactionType::findOrFail($id);
        
        $request->validate([
            'code'               => 'sometimes|string|unique:transaction_types,code,' . $id,
            'name'               => 'sometimes|string|max:255',
            'category'           => 'sometimes|in:transfer,payment,cash_operation,fee,topup',
            'rules'              => 'nullable|array',
        ]);

        return DB::transaction(function() use ($request, $type) {
            $type->update($request->only([
                'code', 'name', 'category'
            ]));

            if ($request->has('rules')) {
                $type->rules()->delete();
                foreach ($request->rules as $rule) {
                    $type->rules()->create($rule);
                }
            }

            return response()->json(['status' => 'success', 'data' => $type->load('rules')]);
        });
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
