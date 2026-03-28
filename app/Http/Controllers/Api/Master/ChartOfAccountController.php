<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use Illuminate\Http\Request;

class ChartOfAccountController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->get('type');
        $query = ChartOfAccount::when($type, fn($q, $t) => $q->where('account_type', $t))
            ->orderBy('coa_code');

        return response()->json(['status' => 'success', 'data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'coa_code'        => 'required|string|max:20|unique:chart_of_accounts,coa_code',
            'account_name'    => 'required|string|max:100',
            'account_type'    => 'required|in:asset,liability,equity,revenue,expense,zis',
            'parent_coa_code' => 'nullable|exists:chart_of_accounts,coa_code',
            'level'           => 'nullable|integer|min:1|max:5',
            'is_postable'     => 'boolean',
        ]);

        $coa = ChartOfAccount::create($request->all());
        return response()->json(['status' => 'success', 'data' => $coa], 201);
    }

    public function show(string $coaCode)
    {
        return response()->json(['status' => 'success', 'data' => ChartOfAccount::findOrFail($coaCode)]);
    }

    public function update(Request $request, string $coaCode)
    {
        $coa = ChartOfAccount::findOrFail($coaCode);
        $coa->update($request->only(['account_name', 'account_type', 'parent_coa_code', 'level', 'is_postable', 'is_active']));
        return response()->json(['status' => 'success', 'data' => $coa]);
    }

    public function destroy(string $coaCode)
    {
        $coa = ChartOfAccount::findOrFail($coaCode);
        $coa->delete();
        return response()->json(['status' => 'success', 'message' => 'COA berhasil dihapus.']);
    }
}
