<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChartOfAccountController extends Controller
{
    private function mapLevelToInt($levelStr) {
        $map = ['HEADER' => 1, 'SUBHEADER' => 2, 'DETAIL' => 3];
        return $map[strtoupper($levelStr)] ?? 3;
    }

    private function mapLevelToStr($levelInt) {
        $map = [1 => 'HEADER', 2 => 'SUBHEADER', 3 => 'DETAIL'];
        return $map[$levelInt] ?? 'DETAIL';
    }

    private function formatCoa($coa) {
        $arr = $coa->toArray();
        $arr['level'] = $this->mapLevelToStr($arr['level'] ?? 3);
        $arr['account_type'] = strtoupper($arr['account_type'] ?? 'ASSET');
        return $arr;
    }

    private function buildTree(array $data, ?string $parentCoaCode = null): array
    {
        $tree = [];
        foreach ($data as $item) {
            if ($item['parent_coa_code'] === $parentCoaCode) {
                $children = $this->buildTree($data, $item['coa_code']);
                if (!empty($children)) {
                    $item['children'] = $children;
                }
                $tree[] = $item;
            }
        }
        return $tree;
    }

    public function index(Request $request)
    {
        $coa = ChartOfAccount::orderBy('coa_code')->get()->map(function($c) {
            return $this->formatCoa($c);
        })->toArray();

        $tree = $this->buildTree($coa);
        return response()->json(['status' => 'success', 'data' => $tree]);
    }

    public function headerAccounts()
    {
        $coa = ChartOfAccount::whereIn('level', [1, 2])->orderBy('coa_code')->get()->map(function($c) {
            return $this->formatCoa($c);
        });
        return response()->json(['status' => 'success', 'data' => $coa]);
    }

    public function detailAccounts()
    {
        $coa = ChartOfAccount::where('level', 3)->orderBy('coa_code')->get()->map(function($c) {
            return $this->formatCoa($c);
        });
        return response()->json(['status' => 'success', 'data' => $coa]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'coa_code'        => 'required|string|max:20|unique:chart_of_accounts,coa_code',
            'account_name'    => 'required|string|max:100',
            'account_type'    => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE,asset,liability,equity,revenue,expense',
            'parent_coa_code' => 'nullable|exists:chart_of_accounts,coa_code',
            'level'           => 'required|in:HEADER,SUBHEADER,DETAIL,header,subheader,detail',
            'is_postable'     => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['level'] = $this->mapLevelToInt($request->level);
        $data['account_type'] = strtolower($request->account_type);

        $coa = ChartOfAccount::create($data);
        return response()->json(['status' => 'success', 'data' => $this->formatCoa($coa)], 201);
    }

    public function show(string $coaCode)
    {
        $coa = ChartOfAccount::findOrFail($coaCode);
        return response()->json(['status' => 'success', 'data' => $this->formatCoa($coa)]);
    }

    public function update(Request $request, string $coaCode)
    {
        $coa = ChartOfAccount::findOrFail($coaCode);
        
        $validator = Validator::make($request->all(), [
            'account_name'    => 'sometimes|string|max:100',
            'account_type'    => 'sometimes|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE,asset,liability,equity,revenue,expense',
            'parent_coa_code' => 'nullable|exists:chart_of_accounts,coa_code',
            'level'           => 'sometimes|in:HEADER,SUBHEADER,DETAIL,header,subheader,detail',
            'is_postable'     => 'boolean',
            'is_active'       => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $data = $request->only(['account_name', 'account_type', 'parent_coa_code', 'level', 'is_postable', 'is_active']);
        if (isset($data['level'])) {
            $data['level'] = $this->mapLevelToInt($data['level']);
        }
        if (isset($data['account_type'])) {
            $data['account_type'] = strtolower($data['account_type']);
        }

        $coa->update($data);
        return response()->json(['status' => 'success', 'data' => $this->formatCoa($coa)]);
    }

    public function destroy(string $coaCode)
    {
        $coa = ChartOfAccount::findOrFail($coaCode);
        if (ChartOfAccount::where('parent_coa_code', $coaCode)->exists()) {
             return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus COA yang memiliki child.'], 400);
        }
        $coa->delete();
        return response()->json(['status' => 'success', 'message' => 'COA berhasil dihapus.']);
    }
}
