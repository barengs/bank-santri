<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\PaymentRecord;
use App\Models\TopUpRequest;
use App\Models\KoperasiTransaction;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $today = today();
        $month = now()->startOfMonth();

        // Ringkasan rekening
        $totalAktif  = Account::where('status', 'AKTIF')->count();
        $totalSaldo  = Account::where('status', 'AKTIF')->sum('balance');

        // Top-up hari ini
        $topUpToday  = TopUpRequest::whereDate('created_at', $today)
            ->where('status', 'success')->sum('amount');
        $topUpPending = TopUpRequest::where('status', 'waiting_verification')->count();

        // Pembayaran bulan ini
        $paymentMonth = PaymentRecord::where('status', 'paid')
            ->whereDate('paid_at', '>=', $month)->sum('total_amount');

        // Transaksi koperasi hari ini
        $koperasiToday = KoperasiTransaction::whereDate('created_at', $today)->sum('amount');
        $koperasiCount = KoperasiTransaction::whereDate('created_at', $today)->count();

        // Mutasi 7 hari terakhir (untuk grafik)
        $last7Days = AccountMovement::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(CASE WHEN type = "credit" THEN amount ELSE 0 END) as total_credit'),
                DB::raw('SUM(CASE WHEN type = "debit" THEN amount ELSE 0 END) as total_debit')
            )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top-up terbaru (5)
        $recentTopUps = TopUpRequest::with('account')
            ->latest()->limit(5)->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'rekening' => [
                    'total_aktif' => $totalAktif,
                    'total_saldo' => $totalSaldo,
                ],
                'topup' => [
                    'today_amount'  => $topUpToday,
                    'pending_count' => $topUpPending,
                ],
                'payment' => [
                    'month_amount' => $paymentMonth,
                ],
                'koperasi' => [
                    'today_amount' => $koperasiToday,
                    'today_count'  => $koperasiCount,
                ],
                'chart_7days'   => $last7Days,
                'recent_topups' => $recentTopUps,
            ],
        ]);
    }
}
