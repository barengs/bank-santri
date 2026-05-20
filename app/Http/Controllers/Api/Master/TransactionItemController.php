<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransactionItemController extends Controller
{
    public function index(Request $request)
    {
        $items = TransactionItem::when($request->search, fn($q, $s) => $q->where('item_name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->get('per_page', 15));

        return response()->json(['status' => 'success', 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_name'      => 'required|string|max:255',
            'default_amount' => 'required|numeric|min:0',
            'coa_code'       => 'required|string|exists:chart_of_accounts,coa_code',
            'entry_type'     => 'required|in:debit,credit',
            'value_mode'     => 'required|in:total,fixed,remainder',
            'destination_account' => 'nullable|string|exists:accounts,account_number',
            'description'    => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $item = TransactionItem::create($request->all());

        return response()->json(['status' => 'success', 'data' => $item], 201);
    }

    public function show(string $id)
    {
        return response()->json(['status' => 'success', 'data' => TransactionItem::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $item = TransactionItem::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'item_name'      => 'sometimes|string|max:255',
            'default_amount' => 'sometimes|numeric|min:0',
            'coa_code'       => 'sometimes|string|exists:chart_of_accounts,coa_code',
            'entry_type'     => 'sometimes|in:debit,credit',
            'value_mode'     => 'sometimes|in:total,fixed,remainder',
            'destination_account' => 'nullable|string|exists:accounts,account_number',
            'description'    => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $item->update($request->all());

        return response()->json(['status' => 'success', 'data' => $item]);
    }

    public function destroy(string $id)
    {
        $item = TransactionItem::findOrFail($id);
        $item->delete();

        return response()->json(['status' => 'success', 'message' => 'Item berhasil dihapus.']);
    }
}
