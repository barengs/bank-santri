<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\TransactionLedger;
use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingReportController extends Controller
{
    /**
     * Jurnal Umum - Semua entry buku besar (Double-Entry General Journal)
     */
    public function journal(Request $request)
    {
        $perPage   = (int) $request->get('per_page', 20);
        $perPage   = ($perPage <= 0) ? 20 : min($perPage, 500);
        $startDate = $request->get('start_date');
        $endDate   = $request->get('end_date');

        $query = TransactionLedger::with(['transaction', 'coa'])
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->select('transaction_ledgers.*')
            ->orderBy('transactions.created_at', 'desc');

        if (!empty($startDate)) {
            $query->whereDate('transactions.created_at', '>=', $startDate);
        }
        if (!empty($endDate)) {
            $query->whereDate('transactions.created_at', '<=', $endDate);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate($perPage)
        ]);
    }

    /**
     * Neraca Saldo (Trial Balance)
     */
    public function trialBalance(Request $request)
    {
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $ledgers = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->join('chart_of_accounts', 'transaction_ledgers.coa_code', '=', 'chart_of_accounts.coa_code')
            ->whereDate('transactions.created_at', '<=', $endDate)
            ->select(
                'chart_of_accounts.coa_code',
                'chart_of_accounts.account_name as coa_name',
                'chart_of_accounts.account_type',
                DB::raw('SUM(transaction_ledgers.debit) as total_debit'),
                DB::raw('SUM(transaction_ledgers.credit) as total_credit')
            )
            ->groupBy('chart_of_accounts.coa_code', 'chart_of_accounts.account_name', 'chart_of_accounts.account_type')
            ->orderBy('chart_of_accounts.coa_code')
            ->get();

        $data = $ledgers->map(function ($row) {
            $isDebitNormal = in_array(strtolower($row->account_type ?? ''), ['asset', 'expense']);
            $balance = $isDebitNormal
                ? ($row->total_debit - $row->total_credit)
                : ($row->total_credit - $row->total_debit);

            return [
                'coa_code'     => $row->coa_code,
                'coa_name'     => $row->coa_name,
                'account_type' => $row->account_type,
                'debit'        => (float) $row->total_debit,
                'credit'       => (float) $row->total_credit,
                'balance'      => (float) $balance,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $data,
            'meta'   => [
                'total_debit'  => (float) $data->sum('debit'),
                'total_credit' => (float) $data->sum('credit'),
                'is_balanced'  => abs($data->sum('debit') - $data->sum('credit')) < 0.01,
            ]
        ]);
    }

    /**
     * Laporan Laba Rugi (Profit & Loss)
     */
    public function profitLoss(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate   = $request->get('end_date', now()->format('Y-m-d'));

        $ledgers = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->join('chart_of_accounts', 'transaction_ledgers.coa_code', '=', 'chart_of_accounts.coa_code')
            ->whereBetween('transactions.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->whereIn('chart_of_accounts.account_type', ['revenue', 'expense'])
            ->select(
                'chart_of_accounts.account_type',
                'chart_of_accounts.coa_code',
                'chart_of_accounts.account_name as coa_name',
                DB::raw('SUM(transaction_ledgers.credit) as total_credit'),
                DB::raw('SUM(transaction_ledgers.debit) as total_debit')
            )
            ->groupBy('chart_of_accounts.account_type', 'chart_of_accounts.coa_code', 'chart_of_accounts.account_name')
            ->orderBy('chart_of_accounts.coa_code')
            ->get();

        $revenue = $ledgers->where('account_type', 'revenue')->map(function ($row) {
            return [
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'balance'  => (float) ($row->total_credit - $row->total_debit),
            ];
        })->values();

        $expense = $ledgers->where('account_type', 'expense')->map(function ($row) {
            return [
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'balance'  => (float) ($row->total_debit - $row->total_credit),
            ];
        })->values();

        $totalRevenue = (float) $revenue->sum('balance');
        $totalExpense = (float) $expense->sum('balance');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'revenue'       => $revenue,
                'expense'       => $expense,
                'total_revenue' => $totalRevenue,
                'total_expense' => $totalExpense,
                'net_profit'    => $totalRevenue - $totalExpense,
            ]
        ]);
    }

    /**
     * Neraca (Balance Sheet)
     */
    public function balanceSheet(Request $request)
    {
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $ledgers = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->join('chart_of_accounts', 'transaction_ledgers.coa_code', '=', 'chart_of_accounts.coa_code')
            ->whereDate('transactions.created_at', '<=', $endDate)
            ->whereIn('chart_of_accounts.account_type', ['asset', 'liability', 'equity'])
            ->select(
                'chart_of_accounts.account_type',
                'chart_of_accounts.coa_code',
                'chart_of_accounts.account_name as coa_name',
                DB::raw('SUM(transaction_ledgers.debit) as total_debit'),
                DB::raw('SUM(transaction_ledgers.credit) as total_credit')
            )
            ->groupBy('chart_of_accounts.account_type', 'chart_of_accounts.coa_code', 'chart_of_accounts.account_name')
            ->orderBy('chart_of_accounts.coa_code')
            ->get();

        $assets = $ledgers->where('account_type', 'asset')->map(function ($row) {
            return [
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'balance'  => (float) ($row->total_debit - $row->total_credit),
            ];
        })->values();

        $liabilities = $ledgers->where('account_type', 'liability')->map(function ($row) {
            return [
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'balance'  => (float) ($row->total_credit - $row->total_debit),
            ];
        })->values();

        $equity = $ledgers->where('account_type', 'equity')->map(function ($row) {
            return [
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'balance'  => (float) ($row->total_credit - $row->total_debit),
            ];
        })->values();

        // Hitung Laba (Rugi) Periode Berjalan dari pendapatan dan beban sampai endDate
        $plQuery = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->join('chart_of_accounts', 'transaction_ledgers.coa_code', '=', 'chart_of_accounts.coa_code')
            ->whereDate('transactions.created_at', '<=', $endDate)
            ->whereIn('chart_of_accounts.account_type', ['revenue', 'expense'])
            ->select(
                'chart_of_accounts.account_type',
                DB::raw('SUM(transaction_ledgers.credit) as total_credit'),
                DB::raw('SUM(transaction_ledgers.debit) as total_debit')
            )
            ->groupBy('chart_of_accounts.account_type')
            ->get();

        $revRow = $plQuery->where('account_type', 'revenue')->first();
        $expRow = $plQuery->where('account_type', 'expense')->first();
        $curRevenue = (float) (($revRow?->total_credit ?? 0) - ($revRow?->total_debit ?? 0));
        $curExpense = (float) (($expRow?->total_debit ?? 0) - ($expRow?->total_credit ?? 0));
        $currentEarnings = $curRevenue - $curExpense;

        if (abs($currentEarnings) > 0.001) {
            $equity->push([
                'coa_code' => '3999',
                'coa_name' => 'Laba (Rugi) Periode Berjalan',
                'balance'  => (float) $currentEarnings,
            ]);
        }

        $totalAssets = (float) $assets->sum('balance');
        $totalLiabilities = (float) $liabilities->sum('balance');
        $totalEquity = (float) $equity->sum('balance');
        $totalLiabAndEquity = $totalLiabilities + $totalEquity;

        return response()->json([
            'status' => 'success',
            'data'   => [
                'assets'                         => $assets,
                'liabilities'                    => $liabilities,
                'equity'                         => $equity,
                'total_assets'                   => $totalAssets,
                'total_liabilities'              => $totalLiabilities,
                'total_equity'                   => $totalEquity,
                'total_liabilities_and_equity'   => $totalLiabAndEquity,
                'is_balanced'                    => abs($totalAssets - $totalLiabAndEquity) < 1,
            ]
        ]);
    }
}
