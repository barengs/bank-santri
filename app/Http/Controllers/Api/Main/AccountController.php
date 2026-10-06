<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AccountController extends Controller
{
    /**
     * Helper to get sanitized SMPT base URL.
     */
    protected function smptBaseUrl(): string
    {
        $smptUrl = config('services.smpt.url') ?? env('SMPT_API_URL') ?? env('SMPT_URL', 'http://localhost:8000');
        $smptUrl = rtrim($smptUrl, '/');
        if (str_ends_with($smptUrl, '/api')) {
            $smptUrl = substr($smptUrl, 0, -4);
        }
        return $smptUrl;
    }

    /**
     * Helper to create a configured HTTP client for SMPT requests.
     */
    protected function smptHttp(?Request $request = null)
    {
        $http = Http::acceptJson()->timeout(15);

        $internalKey = config('services.smpt.internal_key')
            ?? env('INTERNAL_API_KEY')
            ?? env('SMPT_INTERNAL_KEY')
            ?? env('BANK_SANTRI_INTERNAL_KEY', 'smpt-banksantri-internal-secret-2026');

        if ($internalKey) {
            $http = $http->withHeaders([
                'X-Internal-Key' => $internalKey,
            ]);
        }

        // Forward user bearer token if present
        $token = $request?->bearerToken() ?? request()?->bearerToken();
        if ($token) {
            $http = $http->withToken($token);
        }

        return $http;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $search  = $request->get('search');
        $isInstansi = $request->get('is_instansi');
        $productId  = $request->get('product_id');
        $status     = $request->get('status');

        $query = Account::with('product');

        if ($productId) {
            $query->where('product_id', $productId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('account_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });

            // If no local results, try auto-provisioning from SMPT
            $count = (clone $query)->count();
            if ($count === 0 && strlen($search) >= 3) {
                try {
                    $smptUrl = $this->smptBaseUrl();
                    $studentRes = $this->smptHttp($request)->get("{$smptUrl}/api/main/student", [
                        'search' => $search,
                        'per_page' => 10
                    ]);

                    if ($studentRes->successful()) {
                        $students = $studentRes->json('data.data') ?? [];
                        if (count($students) > 0) {
                            $product = Product::where('is_active', true)->first() ?? Product::first();
                            $productId = $product ? $product->id : 1;

                            foreach ($students as $student) {
                                $nis = $student['nis'] ?? null;
                                if ($nis && !Account::where('account_number', $nis)->exists()) {
                                    // Fetch card number if exists
                                    $cardNumber = null;
                                    try {
                                        $cardRes = $this->smptHttp($request)->get("{$smptUrl}/api/main/student/card/{$nis}");
                                        if ($cardRes->successful()) {
                                            $cardData = $cardRes->json('data.card');
                                            if ($cardData && isset($cardData['card_number'])) {
                                                $cardNumber = $cardData['card_number'];
                                            }
                                        }
                                    } catch (\Exception $cardEx) {
                                        Log::warning('Auto-provision in index search: Failed to fetch card for NIS ' . $nis . ': ' . $cardEx->getMessage());
                                    }

                                    // Create local account
                                    Account::create([
                                        'account_number' => $nis,
                                        'customer_id'    => $student['id'],
                                        'customer_name'  => trim($student['first_name'] . ' ' . ($student['last_name'] ?? '')),
                                        'product_id'     => $productId,
                                        'balance'        => 0,
                                        'status'         => 'AKTIF',
                                        'akad_type'      => 'wadiah',
                                        'card_number'    => $cardNumber,
                                        'open_date'      => now()->toDateString(),
                                    ]);
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to auto-provision in index search: " . $e->getMessage());
                }
            }
        }

        if ($isInstansi !== null && $isInstansi !== '') {
            if ($isInstansi == '1' || $isInstansi === true || $isInstansi === 'true') {
                $query->where('customer_id', 0);
            } elseif ($isInstansi == '0' || $isInstansi === false || $isInstansi === 'false') {
                $query->where('customer_id', '>', 0);
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate($perPage)->withQueryString(),
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
        ], [
            'account_number.unique' => "Santri '{$request->customer_name}' dengan NIS '{$request->account_number}' sudah memiliki rekening terdaftar di Bank Santri.",
            'card_number.unique'    => "Nomor kartu '{$request->card_number}' sudah terdaftar pada rekening lain.",
            'product_id.exists'     => 'Produk tabungan yang dipilih tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors()
            ], 422);
        }

        $cardNumber = $request->card_number;

        // Auto-fetch card number from SMPT if it exists (skip for internal requests to avoid deadlocks on single-threaded dev servers)
        if (empty($cardNumber) && !$request->hasHeader('X-Internal-Key')) {
            try {
                $smptUrl = $this->smptBaseUrl();
                $cardRes = $this->smptHttp($request)->get("{$smptUrl}/api/main/student/card/{$request->account_number}");
                if ($cardRes->successful()) {
                    $cardData = $cardRes->json('data.card');
                    if ($cardData && isset($cardData['card_number'])) {
                        $cardNumber = $cardData['card_number'];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch student card from SMPT: ' . $e->getMessage());
            }
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
            ->where(function ($q) use ($accountNumber) {
                $q->where('account_number', $accountNumber)
                  ->orWhere('card_number', $accountNumber);
            })
            ->first();

        if (!$account) {
            // Auto-provision from SMPT if it's a student NIS or Card Number
            try {
                $smptUrl = $this->smptBaseUrl();
                
                $matchedStudent = null;
                $cardNumber = null;

                // 1. Coba cari kartu di SMPT berdasarkan identifier (bisa NIS atau Card Number)
                try {
                    $cardRes = $this->smptHttp()->get("{$smptUrl}/api/main/student/card/{$accountNumber}");
                    if ($cardRes->successful()) {
                        $cardData = $cardRes->json('data.card');
                        if ($cardData) {
                            $cardNumber = $cardData['card_number'] ?? null;
                            $matchedStudent = $cardData['student'] ?? null;
                        }
                    }
                } catch (\Exception $cardEx) {
                    Log::warning("Auto-provision: Failed to lookup card for {$accountNumber}: " . $cardEx->getMessage());
                }

                // 2. Jika tidak ketemu dari kartu, coba cari data murid berdasarkan pencarian (NIS/Nama)
                if (!$matchedStudent) {
                    $studentRes = $this->smptHttp()->get("{$smptUrl}/api/main/student", [
                        'search' => $accountNumber,
                        'per_page' => 10
                    ]);

                    if ($studentRes->successful()) {
                        $students = $studentRes->json('data.data') ?? [];
                        foreach ($students as $student) {
                            if (isset($student['nis']) && $student['nis'] === $accountNumber) {
                                $matchedStudent = $student;
                                break;
                            }
                        }
                    }
                }

                if ($matchedStudent) {
                    $actualNis = $matchedStudent['nis'];

                    // Cek ulang apakah rekening dengan NIS ini sebenarnya sudah ada?
                    $account = Account::with(['product', 'topUpRequests' => fn($q) => $q->latest()->limit(5)])
                        ->where('account_number', $actualNis)
                        ->first();

                    if ($account) {
                        // Jika rekening ada tapi card_number kosong/berbeda, update dengan yang baru
                        if ($cardNumber && $account->card_number !== $cardNumber) {
                            $account->update(['card_number' => $cardNumber]);
                        }
                    } else {
                        // Find default product
                        $product = Product::where('is_active', true)->first() ?? Product::first();
                        $productId = $product ? $product->id : 1;

                        // Jika card number belum didapat, coba fetch dari SMPT menggunakan NIS
                        if (!$cardNumber) {
                            try {
                                $cardRes = $this->smptHttp()->get("{$smptUrl}/api/main/student/card/{$actualNis}");
                                if ($cardRes->successful()) {
                                    $cardData = $cardRes->json('data.card');
                                    if ($cardData && isset($cardData['card_number'])) {
                                        $cardNumber = $cardData['card_number'];
                                    }
                                }
                            } catch (\Exception $cardEx) {
                                Log::warning('Auto-provision: Failed to fetch card for NIS ' . $actualNis . ': ' . $cardEx->getMessage());
                            }
                        }

                        // Create local account
                        $account = Account::create([
                            'account_number' => $actualNis,
                            'customer_id'    => $matchedStudent['id'],
                            'customer_name'  => trim($matchedStudent['first_name'] . ' ' . ($matchedStudent['last_name'] ?? '')),
                            'product_id'     => $productId,
                            'balance'        => 0,
                            'status'         => 'AKTIF',
                            'akad_type'      => 'wadiah',
                            'card_number'    => $cardNumber,
                            'open_date'      => now()->toDateString(),
                        ]);

                        // Load relations
                        $account->load(['product', 'topUpRequests' => fn($q) => $q->latest()->limit(5)]);
                        
                        Log::info("Auto-provisioned student account for NIS: {$actualNis}");
                    }

                    // Attach the student data directly
                    $account->student = $matchedStudent;
                }
            } catch (\Exception $e) {
                Log::error("Failed to auto-provision account for {$accountNumber}: " . $e->getMessage());
            }
        }

        if (!$account) {
            abort(404, "Rekening atau nomor kartu tidak ditemukan.");
        }

        if ($account->customer_id != 0 && !isset($account->student)) {
            try {
                $smptUrl = $this->smptBaseUrl();
                $studentRes = $this->smptHttp()->get("{$smptUrl}/api/main/student/{$account->customer_id}");
                if ($studentRes->successful()) {
                    $account->student = $studentRes->json('data');
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch student from SMPT: ' . $e->getMessage());
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
            'daily_withdrawal_limit' => 'sometimes|nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        if ($request->status === 'TUTUP' && $account->balance > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menutup rekening dengan saldo aktif. Silakan lakukan penarikan saldo terlebih dahulu.'
            ], 422);
        }

        $account->update($request->only(['product_id', 'status', 'card_number', 'daily_withdrawal_limit']));

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
            $smptUrl = $this->smptBaseUrl();
            $response = $this->smptHttp($request)->get("{$smptUrl}/api/main/student", [
                'search' => $search,
                'per_page' => 15
            ]);

            if ($response->successful()) {
                $payload = $response->json();
                
                // Coba enrich data dengan flag has_account jika hasil pencarian valid
                if (isset($payload['data']['data']) && is_array($payload['data']['data'])) {
                    $students = $payload['data']['data'];
                    $nises = collect($students)->pluck('nis')->filter()->values();
                    
                    if ($nises->isNotEmpty()) {
                        $existingAccounts = Account::whereIn('account_number', $nises)
                            ->get(['account_number', 'status'])
                            ->keyBy('account_number');
                            
                        foreach ($students as &$student) {
                            $nis = $student['nis'] ?? null;
                            if ($nis && $existingAccounts->has($nis)) {
                                $student['has_account'] = true;
                                $student['account_status'] = $existingAccounts[$nis]->status;
                            } else {
                                $student['has_account'] = false;
                            }
                        }
                        $payload['data']['data'] = $students;
                    }
                }
                
                return response()->json($payload);
            }

            Log::error('SMPT search failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'url' => "{$smptUrl}/api/main/student"
            ]);

            $errorMessage = $response->json('message') ?? 'Failed to reach SMPT (HTTP ' . $response->status() . ')';
            return response()->json([
                'status' => 'error',
                'message' => $errorMessage,
                'details' => $response->json()
            ], $response->status() >= 400 && $response->status() < 600 ? $response->status() : 502);
        } catch (\Exception $e) {
            Log::error('SMPT search exception: ' . $e->getMessage());
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

    /**
     * Show account details via internal API.
     */
    public function showInternal(string $accountNumber)
    {
        $account = Account::with(['product'])->where('account_number', $accountNumber)->first();
        if (!$account) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rekening atau NIS tidak ditemukan.'
            ], 404);
        }
        return response()->json([
            'status' => 'success',
            'data' => $account
        ]);
    }

    /**
     * Cetak Rekening Koran (Mutasi) format PDF
     */
    public function printRekeningKoran(Request $request, string $accountNumber)
    {
        $account = Account::with('product')->where('account_number', $accountNumber)->firstOrFail();
        
        $startDate = $request->get('start_date');
        $endDate   = $request->get('end_date');
        $month     = $request->get('month');
        $year      = $request->get('year');

        $query = \App\Models\AccountMovement::where('account_number', $accountNumber)
            ->with('transaction');

        if ($startDate && $endDate) {
            $query->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
        } elseif ($month && $year) {
            $query->whereMonth('created_at', $month)
                  ->whereYear('created_at', $year);
        } else {
            // Default 1 bulan terakhir jika tidak ada filter
            $startDate = now()->subMonth()->format('Y-m-d');
            $endDate = now()->format('Y-m-d');
            $query->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
        }

        $movements = $query->orderBy('created_at', 'asc')->get();

        // Hitung Saldo Awal (sebelum record mutasi pertama pada periode yang dipilih)
        $firstMovementDate = $startDate ?? ($month ? "$year-$month-01" : now()->subMonth()->format('Y-m-d'));
        
        // Asumsi AccountMovement menyimpan balance_after yang akurat,
        // saldo awal = balance_after transaksi sebelumnya
        $previousMovement = \App\Models\AccountMovement::where('account_number', $accountNumber)
            ->whereDate('created_at', '<', $firstMovementDate)
            ->orderBy('created_at', 'desc')
            ->first();

        $openingBalance = $previousMovement ? $previousMovement->balance_after : 0;

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.rekening-koran', [
            'account'        => $account,
            'movements'      => $movements,
            'openingBalance' => $openingBalance,
            'filters'        => $request->only(['start_date', 'end_date', 'month', 'year']),
            'generated_at'   => now()->format('d M Y H:i:s'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('Rekening_Koran_' . $accountNumber . '_' . now()->format('YmdHis') . '.pdf');
    }
}
