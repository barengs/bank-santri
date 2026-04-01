<?php

namespace App\Http\Controllers\Api\Main;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\TransactionLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Laporan Jurnal Umum (Global Bank)
     */
    public function jurnalUmum(Request $request)
    {
        $startDate = $request->get('start_date', date('Y-m-d'));
        $endDate   = $request->get('end_date', date('Y-m-d'));

        $ledgers = TransactionLedger::with(['transaction.transactionType'])
            ->join('chart_of_accounts', 'transaction_ledgers.coa_code', '=', 'chart_of_accounts.coa_code')
            ->select('transaction_ledgers.*', 'chart_of_accounts.account_name')
            ->whereDate('transaction_ledgers.created_at', '>=', $startDate)
            ->whereDate('transaction_ledgers.created_at', '<=', $endDate)
            ->orderBy('transaction_ledgers.created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json(['status' => 'success', 'data' => $ledgers]);
    }

    /**
     * Laporan Mutasi per Nasabah (Detail Santri)
     */
    public function mutasiNasabah(Request $request, string $accountNumber)
    {
        $startDate = $request->get('start_date', now()->subMonth()->format('Y-m-d'));
        $endDate   = $request->get('end_date', date('Y-m-d'));

        $account = Account::where('account_number', $accountNumber)->firstOrFail();

        $movements = AccountMovement::where('account_number', $accountNumber)
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'account' => $account,
            'data'   => $movements
        ]);
    }

    /**
     * Rekapitulasi Saldo Bank (Kewajiban)
     */
    public function rekapSaldo()
    {
        $summary = Account::join('products', 'accounts.product_id', '=', 'products.id')
            ->select('products.product_name', DB::raw('count(*) as total_accounts'), DB::raw('sum(balance) as total_balance'))
            ->groupBy('products.product_name')
            ->get();

        $totalAll = Account::sum('balance');

        return response()->json([
            'status' => 'success',
            'data'   => $summary,
            'total_all' => $totalAll
        ]);
    }

    /**
     * Rekapitulasi Harian Kasir (Tutup Buku)
     */
    public function rekapKasir(Request $request)
    {
        $date = $request->get('date', date('Y-m-d'));

        $income = DB::table('transactions')
            ->join('transaction_types', 'transactions.transaction_type_id', '=', 'transaction_types.id')
            ->whereDate('transactions.created_at', $date)
            ->where('transactions.status', 'success')
            ->where('transaction_types.is_credit', true)
            ->select('transaction_types.name', DB::raw('sum(amount) as total'))
            ->groupBy('transaction_types.name')
            ->get();

        $expense = DB::table('transactions')
            ->join('transaction_types', 'transactions.transaction_type_id', '=', 'transaction_types.id')
            ->whereDate('transactions.created_at', $date)
            ->where('transactions.status', 'success')
            ->where('transaction_types.is_debit', true)
            ->select('transaction_types.name', DB::raw('sum(amount) as total'))
            ->groupBy('transaction_types.name')
            ->get();

        return response()->json([
            'status' => 'success',
            'date'   => $date,
            'income' => $income,
            'expense' => $expense,
            'net'    => $income->sum('total') - $expense->sum('total')
        ]);
    }
}
