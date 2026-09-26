<?php

namespace App\Http\Controllers\Api\Koperasi;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\KoperasiTransaction;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class KoperasiController extends Controller
{
    /**
     * Mengambil konfigurasi merchant & aturan dinamis sesi makan dapur.
     */
    public function config(Request $request)
    {
        $merchant = $request->get('koperasi_merchant');

        // Ambil konfigurasi sesi makan dari database
        $sessionsSetting = Setting::where('key', 'dapur_meal_sessions')->value('value');
        $sessions = $sessionsSetting ? json_decode($sessionsSetting, true) : [
            ['id' => 'pagi',  'name' => 'Makan Pagi (Sarapan)', 'start_time' => '06:00', 'end_time' => '08:30', 'price' => 10000, 'is_active' => true],
            ['id' => 'siang', 'name' => 'Makan Siang',          'start_time' => '11:30', 'end_time' => '13:45', 'price' => 12000, 'is_active' => true],
            ['id' => 'malam', 'name' => 'Makan Malam',          'start_time' => '17:30', 'end_time' => '19:45', 'price' => 12000, 'is_active' => true],
        ];

        $preventDoubleTapSetting = Setting::where('key', 'dapur_prevent_double_tap')->value('value');
        $preventDoubleTap = $preventDoubleTapSetting === null ? true : (bool) $preventDoubleTapSetting;

        // Tentukan sesi makan aktif saat ini
        $nowTime = now()->format('H:i');
        $activeSession = null;
        foreach ($sessions as $session) {
            if (($session['is_active'] ?? true) && $nowTime >= $session['start_time'] && $nowTime <= $session['end_time']) {
                $activeSession = $session;
                break;
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'merchant' => $merchant ? [
                    'id'   => $merchant->id,
                    'name' => $merchant->name,
                ] : null,
                'server_time'   => now()->toDateTimeString(),
                'server_hour'   => $nowTime,
                'dapur_rules'   => [
                    'prevent_double_tap' => $preventDoubleTap,
                    'active_session'     => $activeSession,
                    'is_session_open'    => $activeSession !== null,
                    'sessions'           => $sessions,
                ],
            ],
        ]);
    }

    /**
     * Cek rekening santri berdasarkan NIS atau nomor kartu RFID.
     * Mengembalikan data saldo, limit belanja harian, foto santri, dan status sesi makan.
     */
    public function check(Request $request, string $identifier)
    {
        $outletType = $request->query('outlet_type', 'koperasi');

        // 1. Cari rekening berdasarkan NIS (account_number) atau RFID (card_number)
        $account = Account::with('product')
            ->where('account_number', $identifier)
            ->orWhere('card_number', $identifier)
            ->first();

        if (!$account) {
            return response()->json([
                'status'  => 'error',
                'message' => "Santri dengan kartu / identitas {$identifier} tidak ditemukan.",
            ], 404);
        }

        if ($account->status !== 'AKTIF') {
            return response()->json([
                'status'  => 'error',
                'message' => "Rekening santri tidak aktif (Status: {$account->status}).",
            ], 422);
        }

        // 2. Ambil data profil & foto santri dari SMPT
        $studentData = null;
        try {
            $smptUrl = config('services.smpt.url');
            $internalKey = config('services.smpt.key') ?: config('services.bank_santri.key');
            $res = Http::timeout(4)
                ->withHeaders(['X-Internal-Key' => $internalKey])
                ->get("{$smptUrl}/api/main/student/{$account->customer_id}");
            if ($res->successful()) {
                $studentData = $res->json('data');
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Koperasi: Gagal ambil foto santri dari SMPT: ' . $e->getMessage());
        }

        // 3. Hitung limit harian santri
        $dailyLimit = (float) ($account->daily_withdrawal_limit ?? $account->product->daily_withdrawal_limit ?? 0);
        $spentToday = 0;
        if ($dailyLimit > 0) {
            $spentToday = (float) Transaction::where('source_account', $account->account_number)
                ->where('status', 'success')
                ->whereDate('created_at', now()->toDateString())
                ->whereHas('type', function ($q) {
                    $q->whereIn('code', ['WDR-SANTRI', 'CASH-WDR', 'COOP-BUY', 'COOP-MEAL']);
                })
                ->sum('amount');
        }
        $remainingLimit = $dailyLimit > 0 ? max(0, $dailyLimit - $spentToday) : null;
        $minBalance = (float) ($account->product->minimum_balance ?? 0);
        $withdrawableBalance = max(0, (float) $account->balance - $minBalance);

        // 4. Khusus Dapur Umum: Cek Sesi Makan Aktif & Riwayat Tap Hari Ini
        $kitchenStatus = null;
        if ($outletType === 'dapur') {
            $nowTime = now()->format('H:i');
            $sessionsSetting = Setting::where('key', 'dapur_meal_sessions')->value('value');
            $sessions = $sessionsSetting ? json_decode($sessionsSetting, true) : [];
            $activeSession = null;
            foreach ($sessions as $s) {
                if (($s['is_active'] ?? true) && $nowTime >= $s['start_time'] && $nowTime <= $s['end_time']) {
                    $activeSession = $s;
                    break;
                }
            }

            $alreadyTapped = false;
            $lastTap = null;
            if ($activeSession) {
                $lastTap = KoperasiTransaction::where('account_number', $account->account_number)
                    ->whereDate('created_at', now()->toDateString())
                    ->where(function ($q) use ($activeSession) {
                        $q->where('outlet_name', 'like', "%{$activeSession['id']}%")
                          ->orWhere('cashier_note', 'like', "%session:{$activeSession['id']}%");
                    })
                    ->latest()
                    ->first();
                $alreadyTapped = $lastTap !== null;
            }

            $kitchenStatus = [
                'active_session'     => $activeSession,
                'is_session_open'    => $activeSession !== null,
                'already_tapped'     => $alreadyTapped,
                'last_tap_time'      => $lastTap ? $lastTap->created_at->format('H:i:s') : null,
                'suggested_price'    => $activeSession['price'] ?? 12000,
                'can_claim'          => $activeSession !== null && !$alreadyTapped && ($withdrawableBalance >= ($activeSession['price'] ?? 12000)),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'account_number'      => $account->account_number,
                'card_number'         => $account->card_number,
                'customer_name'       => $account->customer_name,
                'balance'             => (float) $account->balance,
                'balance_formatted'   => 'Rp ' . number_format($account->balance, 0, ',', '.'),
                'minimum_balance'     => $minBalance,
                'withdrawable_balance'=> $withdrawableBalance,
                'daily_limit'         => $dailyLimit,
                'spent_today'         => $spentToday,
                'remaining_daily_limit'=> $remainingLimit,
                'student'             => $studentData,
                'kitchen_status'      => $kitchenStatus,
            ],
        ]);
    }

    /**
     * Proses transaksi debit (belanja koperasi atau konsumsi dapur umum).
     * Transaksi berbasis nominal total.
     */
    public function debit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier'       => 'nullable|string',
            'account_number'   => 'nullable|string',
            'amount'           => 'required|numeric|min:100',
            'outlet_type'      => 'nullable|in:koperasi,dapur',
            'meal_session'     => 'nullable|string|max:50',
            'outlet_name'      => 'nullable|string|max:100',
            'item_description' => 'nullable|string|max:255',
            'cashier_note'     => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $identifier = $request->account_number ?: $request->identifier;
        if (!$identifier) {
            return response()->json(['status' => 'error', 'message' => 'NIS atau Nomor Kartu wajib disertakan.'], 422);
        }

        $account = Account::with('product')
            ->where('account_number', $identifier)
            ->orWhere('card_number', $identifier)
            ->first();

        if (!$account) {
            return response()->json(['status' => 'error', 'message' => "Akun atau kartu santri {$identifier} tidak ditemukan."], 404);
        }

        if ($account->status !== 'AKTIF') {
            return response()->json(['status' => 'error', 'message' => "Rekening santri tidak aktif."], 422);
        }

        $outletType = $request->outlet_type ?? 'koperasi';
        $amount = (float) $request->amount;

        // 1. Validasi Proteksi Saldo Mengendap / Overdraft
        $minBalance = (float) ($account->product->minimum_balance ?? 0);
        if (($account->balance - $amount) < $minBalance) {
            $sisaBoleh = max(0, (float) $account->balance - $minBalance);
            return response()->json([
                'status'  => 'error',
                'code'    => 'INSUFFICIENT_BALANCE',
                'message' => "Saldo tidak mencukupi. Saldo tersedia: Rp " . number_format($sisaBoleh, 0, ',', '.') . " (Saldo mengendap Rp " . number_format($minBalance, 0, ',', '.') . ").",
            ], 422);
        }

        // 2. Validasi Limit Harian Uang Saku
        $dailyLimit = (float) ($account->daily_withdrawal_limit ?? $account->product->daily_withdrawal_limit ?? 0);
        if ($dailyLimit > 0) {
            $spentToday = (float) Transaction::where('source_account', $account->account_number)
                ->where('status', 'success')
                ->whereDate('created_at', now()->toDateString())
                ->whereHas('type', function ($q) {
                    $q->whereIn('code', ['WDR-SANTRI', 'CASH-WDR', 'COOP-BUY', 'COOP-MEAL']);
                })
                ->sum('amount');

            if (($spentToday + $amount) > $dailyLimit) {
                $sisaKuota = max(0, $dailyLimit - $spentToday);
                return response()->json([
                    'status'  => 'error',
                    'code'    => 'DAILY_LIMIT_EXCEEDED',
                    'message' => "Transaksi melebihi batas limit harian (Maksimal Rp " . number_format($dailyLimit, 0, ',', '.') . "/hari). Sisa kuota hari ini: Rp " . number_format($sisaKuota, 0, ',', '.') . ".",
                ], 422);
            }
        }

        // 3. Khusus Dapur: Validasi Anti Double-Tap Dinamis
        $mealSession = $request->meal_session;
        if ($outletType === 'dapur') {
            $preventDoubleTapSetting = Setting::where('key', 'dapur_prevent_double_tap')->value('value');
            $preventDoubleTap = $preventDoubleTapSetting === null ? true : (bool) $preventDoubleTapSetting;

            if ($preventDoubleTap && $mealSession) {
                $alreadyTapped = KoperasiTransaction::where('account_number', $account->account_number)
                    ->whereDate('created_at', now()->toDateString())
                    ->where(function ($q) use ($mealSession) {
                        $q->where('outlet_name', 'like', "%{$mealSession}%")
                          ->orWhere('cashier_note', 'like', "%session:{$mealSession}%");
                    })
                    ->latest()
                    ->first();

                if ($alreadyTapped) {
                    return response()->json([
                        'status'  => 'error',
                        'code'    => 'ALREADY_TAPPED_THIS_SESSION',
                        'message' => "Santri {$account->customer_name} sudah mengambil porsi makan sesi {$mealSession} hari ini pada pukul " . $alreadyTapped->created_at->format('H:i') . ".",
                    ], 422);
                }
            }
        }

        return DB::transaction(function () use ($account, $amount, $outletType, $mealSession, $request) {
            $prefix = $outletType === 'dapur' ? 'DAPUR' : 'KOP';
            $ref = $prefix . '-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            // Tentukan Type Code Syariah
            $typeCode = $outletType === 'dapur' ? 'COOP-MEAL' : 'COOP-BUY';
            $defaultDesc = $outletType === 'dapur'
                ? "Makan Dapur Umum " . ($mealSession ? ucfirst($mealSession) : '')
                : "Belanja Koperasi";
            $desc = $request->item_description ?? $defaultDesc;

            $outletName = $request->outlet_name ?: ($outletType === 'dapur' ? "Dapur Umum [{$mealSession}]" : "Koperasi Pesantren");
            $cashierNote = $request->cashier_note ?: ($mealSession ? "session:{$mealSession}" : null);

            // 1. Eksekusi Double-Entry Accounting
            app(AccountingService::class)->recordTransaction(
                $typeCode,
                $amount,
                $account->account_number,
                null,
                "{$desc} [{$ref}]",
                'koperasi',
                ['reference_number' => $ref]
            );

            // 2. Audit Trail Log Koperasi
            $authUser = null;
            try {
                if (auth('api')->check()) {
                    $authUser = auth('api')->user();
                }
            } catch (\Throwable $e) {}

            $userId = $authUser ? $authUser->id : ($request->user_id ?? null);
            $cashierName = $authUser ? $authUser->name : ($request->cashier_name ?: 'Petugas Kasir');

            $accountAfter = Account::where('account_number', $account->account_number)->first();

            $kTrx = KoperasiTransaction::create([
                'account_number'   => $account->account_number,
                'user_id'          => $userId,
                'cashier_name'     => $cashierName,
                'reference_number' => $ref,
                'amount'           => $amount,
                'balance_before'   => $accountAfter->balance + $amount,
                'balance_after'    => $accountAfter->balance,
                'outlet_name'      => $outletName,
                'item_description' => $desc,
                'cashier_note'     => $cashierNote,
            ]);

            // 3. Catat Spatie Activity Log untuk Audit Trail
            try {
                activity('koperasi')
                    ->causedBy($authUser)
                    ->performedOn($account)
                    ->withProperties([
                        'reference_number' => $ref,
                        'amount'           => $amount,
                        'outlet_name'      => $outletName,
                        'cashier_name'     => $cashierName,
                        'user_id'          => $userId,
                        'balance_after'    => $accountAfter->balance,
                    ])
                    ->log("Transaksi {$desc} sebesar Rp " . number_format($amount, 0, ',', '.') . " [{$ref}] oleh kasir {$cashierName}");
            } catch (\Throwable $e) {}

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi berhasil diproses.',
                'data'    => [
                    'reference_number'   => $ref,
                    'account_number'     => $account->account_number,
                    'customer_name'      => $account->customer_name,
                    'cashier_name'       => $cashierName,
                    'user_id'            => $userId,
                    'amount'             => $amount,
                    'amount_formatted'   => 'Rp ' . number_format($amount, 0, ',', '.'),
                    'balance_before'     => (float) ($accountAfter->balance + $amount),
                    'balance_after'      => (float) $accountAfter->balance,
                    'balance_formatted'  => 'Rp ' . number_format($accountAfter->balance, 0, ',', '.'),
                    'outlet_type'        => $outletType,
                    'outlet_name'        => $kTrx->outlet_name,
                    'item_description'   => $desc,
                    'meal_session'       => $mealSession,
                    'transaction_time'   => now()->toDateTimeString(),
                ],
            ], 201);
        });
    }

    /**
     * Riwayat transaksi kasir koperasi & dapur umum.
     */
    public function transactions(Request $request)
    {
        $query = KoperasiTransaction::with(['account', 'user'])
            ->when($request->account_number, fn($q, $an) => $q->where('account_number', $an))
            ->when($request->user_id, fn($q, $uid) => $q->where('user_id', $uid))
            ->when($request->outlet_type, function ($q, $ot) {
                if ($ot === 'dapur') {
                    $q->where('outlet_name', 'like', '%Dapur%');
                } else {
                    $q->where('outlet_name', 'not like', '%Dapur%');
                }
            })
            ->when($request->date, fn($q, $d) => $q->whereDate('created_at', $d))
            ->latest();

        $todayTotal = (float) (clone $query)->whereDate('created_at', now()->toDateString())->sum('amount');
        $todayCount = (clone $query)->whereDate('created_at', now()->toDateString())->count();

        $trx = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'summary' => [
                'today_total_amount' => $todayTotal,
                'today_count'        => $todayCount,
            ],
            'data'   => $trx,
        ]);
    }
}
