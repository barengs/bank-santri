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
     * Jurnal Umum - Semua entry buku besar
     */
    public function journal(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = TransactionLedger::with(['transaction', 'coa'])
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->select('transaction_ledgers.*')
            ->orderBy('transactions.created_at', 'desc');

        if ($startDate) $query->whereDate('transactions.created_at', '>=', $startDate);
        if ($endDate) $query->whereDate('transactions.created_at', '<=', $endDate);

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
                'chart_of_accounts.coa_name',
                'chart_of_accounts.normal_balance',
                DB::raw('SUM(debit) as total_debit'),
                DB::raw('SUM(credit) as total_credit')
            )
            ->groupBy('chart_of_accounts.coa_code', 'chart_of_accounts.coa_name', 'chart_of_accounts.normal_balance')
            ->orderBy('chart_of_accounts.coa_code')
            ->get();

        $data = $ledgers->map(function ($row) {
            $balance = $row->total_debit - $row->total_credit;
            
            // Adjust based on normal balance
            if ($row->normal_balance === 'credit') {
                $balance = $row->total_credit - $row->total_debit;
            }

            return [
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'debit'    => $row->total_debit,
                'credit'   => $row->total_credit,
                'balance'  => $balance
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $data,
            'meta'   => [
                'total_debit'  => $data->sum('debit'),
                'total_credit' => $data->sum('credit')
            ]
        ]);
    }

    /**
     * Laporan Laba Rugi (Profit & Loss)
     */
    public function profitLoss(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $ledgers = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->join('chart_of_accounts', 'transaction_ledgers.coa_code', '=', 'chart_of_accounts.coa_code')
            ->whereBetween('transactions.created_at', [$startDate, $endDate])
            ->whereIn('chart_of_accounts.group', ['Pendapatan', 'Beban'])
            ->select(
                'chart_of_accounts.group',
                'chart_of_accounts.coa_code',
                'chart_of_accounts.coa_name',
                DB::raw('SUM(credit) - SUM(debit) as balance') // Usually Revenue - Expense
            )
            ->groupBy('chart_of_accounts.group', 'chart_of_accounts.coa_code', 'chart_of_accounts.coa_name')
            ->get();

        $revenue = $ledgers->where('group', 'Pendapatan');
        $expense = $ledgers->where('group', 'Beban');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'revenue'       => $revenue->values(),
                'expense'       => $expense->values(),
                'total_revenue' => $revenue->sum('balance'),
                'total_expense' => abs($expense->sum('balance')), // Expenses are usually debit, so sum will be negative in (Credit - Debit) formula
                'net_profit'    => $revenue->sum('balance') + $expense->sum('balance')
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
            ->whereIn('chart_of_accounts.group', ['Aset', 'Liabilitas', 'Ekuitas'])
            ->select(
                'chart_of_accounts.group',
                'chart_of_accounts.coa_code',
                'chart_of_accounts.coa_name',
                'chart_of_accounts.normal_balance',
                DB::raw('SUM(debit) as total_debit'),
                DB::raw('SUM(credit) as total_credit')
            )
            ->groupBy('chart_of_accounts.group', 'chart_of_accounts.coa_code', 'chart_of_accounts.coa_name', 'chart_of_accounts.normal_balance')
            ->get();

        $data = $ledgers->map(function($row) {
            $balance = $row->normal_balance === 'debit' 
                ? $row->total_debit - $row->total_credit 
                : $row->total_credit - $row->total_debit;
            
            return [
                'group'    => $row->group,
                'coa_code' => $row->coa_code,
                'coa_name' => $row->coa_name,
                'balance'  => $balance
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'assets'      => $data->where('group', 'Aset')->values(),
                'liabilities' => $data->where('group', 'Liabilitas')->values(),
                'equity'      => $data->where('group', 'Ekuitas')->values(),
                'total_assets'      => $data->where('group', 'Aset')->sum('balance'),
                'total_liabilities' => $data->where('group', 'Liabilitas')->sum('balance'),
                'total_equity'      => $data->where('group', 'Ekuitas')->sum('balance'),
            ]
        ]);
    }
}
