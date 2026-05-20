<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $search  = $request->get('search');
        $isInstansi = $request->get('is_instansi');

        $query = Account::with('product');

        if ($search) {
            $query->where('account_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
        }

        if ($isInstansi) {
            $query->where('customer_id', 0);
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
            // card_number from request is no longer strictly used/required from UI, but keep validation if passed internally
            'card_number'    => 'nullable|string|unique:accounts,card_number',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $cardNumber = $request->card_number;

        // Auto-fetch card number from SMPT if it exists
        try {
            $smptUrl = config('services.smpt.url');
            $cardRes = Http::get("{$smptUrl}/api/main/student/card/{$request->account_number}");
            if ($cardRes->successful()) {
                $cardData = $cardRes->json('data.card');
                if ($cardData && isset($cardData['card_number'])) {
                    $cardNumber = $cardData['card_number'];
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to fetch student card from SMPT: ' . $e->getMessage());
        }

        $account = Account::create([
            'account_number' => $request->account_number,  // = NIS santri
            'customer_id'    => $request->customer_id,
            'customer_name'  => $request->customer_name,
            'product_id'     => $request->product_id,
            'balance'        => 0,
            'status'         => 'AKTIF',
            'akad_type'      => $request->akad_type ?? 'wadiah',
            'card_number'    => $cardNumber,
            'open_date'      => now()->toDateString(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Rekening berhasil dibuat. Nomor rekening santri: ' . $account->account_number,
            'data'    => $account->load('product'),
        ], 201);
    }

    public function storeInstansi(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name'  => 'required|string',
            'product_id'     => 'required|exists:products,id',
            'akad_type'      => 'nullable|in:wadiah,mudharabah',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        // Generate account_number automatically based on product_id
        $prefix = str_pad($request->product_id, 3, '0', STR_PAD_LEFT);
        $randomNumber = mt_rand(1000000, 9999999); // 7 digits
        $accountNumber = $prefix . $randomNumber;
        
        // Ensure uniqueness
        while(Account::where('account_number', $accountNumber)->exists()) {
            $randomNumber = mt_rand(1000000, 9999999);
            $accountNumber = $prefix . $randomNumber;
        }

        $account = Account::create([
            'account_number' => $accountNumber,
            'customer_id'    => 0, // 0 indicates non-student/institutional account
            'customer_name'  => $request->customer_name,
            'product_id'     => $request->product_id,
            'balance'        => 0,
            'status'         => 'AKTIF',
            'akad_type'      => $request->akad_type ?? 'wadiah',
            'open_date'      => now()->toDateString(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Rekening Instansi berhasil dibuat.',
            'data'    => $account->load('product'),
        ], 201);
    }

    public function show(string $accountNumber)
    {
        $account = Account::with(['product', 'topUpRequests' => fn($q) => $q->latest()->limit(5)])
            ->where('account_number', $accountNumber)
            ->firstOrFail();

        if ($account->customer_id != 0) {
            try {
                $smptUrl = config('services.smpt.url');
                $studentRes = Http::get("{$smptUrl}/api/main/student/{$account->customer_id}");
                if ($studentRes->successful()) {
                    $account->student = $studentRes->json('data');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to fetch student from SMPT: ' . $e->getMessage());
            }
        }

        return response()->json(['status' => 'success', 'data' => $account]);
    }

    public function update(Request $request, string $accountNumber)
    {
        $account = Account::where('account_number', $accountNumber)->firstOrFail();
        $validator = Validator::make($request->all(), [
            'product_id' => 'sometimes|exists:products,id',
            'status'     => 'sometimes|in:AKTIF,TIDAK AKTIF,TUTUP,TERBLOKIR,DIBEKUKAN',
            'card_number' => 'sometimes|nullable|string|unique:accounts,card_number,' . $account->account_number . ',account_number',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $account->update($request->only(['product_id', 'status', 'card_number']));

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

    /**
     * Proxy search for students from SMPT microservice.
     */
    public function smptSearch(Request $request)
    {
        $search = $request->get('search');
        try {
            $smptUrl = config('services.smpt.url');
            $response = Http::get("{$smptUrl}/api/main/student", [
                'search' => $search,
                'per_page' => 10
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }
            
            return response()->json(['status' => 'error', 'message' => 'Failed to reach SMPT'], 502);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Internal update for account details (e.g. card_number).
     */
    public function updateInternal(Request $request, string $accountNumber)
    {
        $account = Account::where('account_number', $accountNumber)->first();
        
        if (!$account) {
            return response()->json(['status' => 'error', 'message' => 'Account not found'], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'card_number' => 'sometimes|nullable|string|unique:accounts,card_number,' . $account->account_number . ',account_number',
            'status'      => 'sometimes|in:AKTIF,TIDAK AKTIF,TUTUP,TERBLOKIR,DIBEKUKAN',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $account->update($request->only(['card_number', 'status']));

        return response()->json([
            'status' => 'success',
            'message' => 'Internal account update successful',
            'data' => $account
        ]);
    }
}
