<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $search  = $request->get('search');

        $query = Account::with('product');

        if ($search) {
            $query->where('account_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate($perPage),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|string|unique:accounts,account_number',  // NIS santri
            'customer_id'    => 'required|integer',
            'customer_name'  => 'required|string',
            'product_id'     => 'required|exists:products,id',
            'akad_type'      => 'nullable|in:wadiah,mudharabah',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $account = Account::create([
            'account_number' => $request->account_number,  // = NIS santri
            'customer_id'    => $request->customer_id,
            'customer_name'  => $request->customer_name,
            'product_id'     => $request->product_id,
            'balance'        => 0,
            'status'         => 'AKTIF',
            'akad_type'      => $request->akad_type ?? 'wadiah',
            'open_date'      => now()->toDateString(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Rekening berhasil dibuat. Nomor rekening santri: ' . $account->account_number,
            'data'    => $account->load('product'),
        ], 201);
    }

    public function show(string $accountNumber)
    {
        $account = Account::with(['product', 'topUpRequests' => fn($q) => $q->latest()->limit(5)])
            ->where('account_number', $accountNumber)
            ->firstOrFail();

        return response()->json(['status' => 'success', 'data' => $account]);
    }

    public function update(Request $request, string $accountNumber)
    {
        $account = Account::where('account_number', $accountNumber)->firstOrFail();
        $validator = Validator::make($request->all(), [
            'product_id' => 'sometimes|exists:products,id',
            'status'     => 'sometimes|in:AKTIF,TIDAK AKTIF,TUTUP,TERBLOKIR,DIBEKUKAN',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $account->update($request->only(['product_id', 'status']));

        if ($request->status === 'TUTUP') {
            $account->close_date = now()->toDateString();
            $account->save();
        }

        return response()->json(['status' => 'success', 'data' => $account]);
    }

    public function destroy(string $accountNumber)
    {
        $account = Account::where('account_number', $accountNumber)->firstOrFail();

        if ($account->balance > 0) {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus rekening dengan saldo aktif.'], 409);
        }

        $account->delete();
        return response()->json(['status' => 'success', 'message' => 'Rekening berhasil dihapus.']);
    }
}
