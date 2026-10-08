<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Product;
use App\Models\TransactionItem;
use App\Models\TransactionLedger;
use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        $search    = $request->get('search');

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
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('transaction_ledgers.description', 'like', "%{$search}%")
                  ->orWhere('transaction_ledgers.coa_code', 'like', "%{$search}%")
                  ->orWhere('transactions.reference_number', 'like', "%{$search}%");
            });
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

    /**
     * Buku Besar (General Ledger per Account)
     */
    public function generalLedger(Request $request)
    {
        // Default to Kas Utama if no COA code is provided
        $coaCode = $request->get('coa_code', '1101');
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        $coa = ChartOfAccount::where('coa_code', $coaCode)->first();

        if (!$coa) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun COA tidak ditemukan'
            ], 404);
        }

        $isDebitNormal = in_array(strtolower($coa->account_type), ['asset', 'expense']);

        // Calculate Opening Balance (Saldo Awal) before start_date
        $openingQuery = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->where('transaction_ledgers.coa_code', $coaCode)
            ->whereDate('transactions.created_at', '<', $startDate)
            ->select(
                DB::raw('SUM(transaction_ledgers.debit) as total_debit'),
                DB::raw('SUM(transaction_ledgers.credit) as total_credit')
            )->first();

        $openingDebit = (float) ($openingQuery->total_debit ?? 0);
        $openingCredit = (float) ($openingQuery->total_credit ?? 0);
        
        $openingBalance = $isDebitNormal 
            ? ($openingDebit - $openingCredit)
            : ($openingCredit - $openingDebit);

        // Get Transactions within the period
        $entriesQuery = DB::table('transaction_ledgers')
            ->join('transactions', 'transaction_ledgers.transaction_id', '=', 'transactions.id')
            ->where('transaction_ledgers.coa_code', $coaCode)
            ->whereBetween('transactions.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'transactions.created_at as date',
                'transactions.reference_number',
                'transaction_ledgers.description',
                'transaction_ledgers.debit',
                'transaction_ledgers.credit'
            )
            ->orderBy('transactions.created_at', 'asc')
            ->orderBy('transaction_ledgers.id', 'asc')
            ->get();

        $runningBalance = $openingBalance;
        $totalDebitPeriod = 0;
        $totalCreditPeriod = 0;

        $entries = $entriesQuery->map(function ($row) use (&$runningBalance, &$totalDebitPeriod, &$totalCreditPeriod, $isDebitNormal) {
            $debit = (float) $row->debit;
            $credit = (float) $row->credit;
            
            $totalDebitPeriod += $debit;
            $totalCreditPeriod += $credit;

            if ($isDebitNormal) {
                $runningBalance += ($debit - $credit);
            } else {
                $runningBalance += ($credit - $debit);
            }

            return [
                'date' => $row->date,
                'reference_number' => $row->reference_number,
                'description' => $row->description,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $runningBalance
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'account' => [
                    'coa_code' => $coa->coa_code,
                    'account_name' => $coa->account_name,
                    'account_type' => $coa->account_type,
                    'normal_balance' => $isDebitNormal ? 'Debit' : 'Kredit'
                ],
                'summary' => [
                    'opening_balance' => $openingBalance,
                    'total_debit_period' => $totalDebitPeriod,
                    'total_credit_period' => $totalCreditPeriod,
                    'closing_balance' => $runningBalance
                ],
                'entries' => $entries
            ]
        ]);
    }

    /**
     * Rekonsiliasi Tabungan Santri (Sub-ledger vs GL 2100)
     */
    public function savingsReconciliation(Request $request)
    {
        // 1. Get Sub-ledger (Total Saldo Nasabah di tabel accounts)
        $subLedgerTotal = (float) \App\Models\Account::sum('balance');
        $totalAccounts = \App\Models\Account::count();

        // 2. Get General Ledger for Tabungan Santri (COA 2100)
        $glQuery = DB::table('transaction_ledgers')
            ->where('coa_code', '2100')
            ->select(
                DB::raw('SUM(credit) as total_credit'),
                DB::raw('SUM(debit) as total_debit')
            )->first();
        
        $glCredit = (float) ($glQuery->total_credit ?? 0);
        $glDebit = (float) ($glQuery->total_debit ?? 0);
        
        // Tabungan Santri is Liability, normal balance is Credit
        $glTotal = $glCredit - $glDebit;

        $difference = round($subLedgerTotal - $glTotal, 2);

        return response()->json([
            'status' => 'success',
            'data' => [
                'sub_ledger' => [
                    'total_accounts' => $totalAccounts,
                    'total_balance' => $subLedgerTotal,
                    'last_updated' => now()->toDateTimeString()
                ],
                'general_ledger' => [
                    'coa_code' => '2100',
                    'coa_name' => 'Tabungan Santri',
                    'total_debit' => $glDebit,
                    'total_credit' => $glCredit,
                    'total_balance' => $glTotal
                ],
                'reconciliation' => [
                    'difference' => $difference,
                    'is_balanced' => abs($difference) < 0.01,
                    'status_message' => abs($difference) < 0.01 ? 'SINKRON' : 'TIDAK SINKRON (TERDAPAT SELISIH)'
                ]
            ]
        ]);
    }

    /**
     * Data Rekapitulasi Produk Bank & Rincian Transaksi
     */
    public function rekapitulasi(Request $request)
    {
        $productId = $request->get('product_id');
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate   = $request->get('end_date', now()->format('Y-m-d'));
        $category  = $request->get('category'); // all, or specific type
        $transactionItemId = $request->get('transaction_item_id');

        // 1. Rekapitulasi per Produk Bank
        $productsQuery = Product::withCount(['accounts as total_accounts' => function ($q) {
            $q->where('status', '!=', 'TUTUP');
        }])
        ->withSum('accounts as total_balance', 'balance');

        if (!empty($productId)) {
            $productsQuery->where('id', $productId);
        }

        $allProducts = $productsQuery->get();

        // Hitung mutasi kredit (masuk) dan debit (keluar) sekaligus per produk dengan GROUP BY (1 query cepat)
        $groupedMovementsQuery = DB::table('account_movements')
            ->join('accounts', 'account_movements.account_number', '=', 'accounts.account_number')
            ->leftJoin('transactions', 'account_movements.transaction_id', '=', 'transactions.id')
            ->whereBetween('account_movements.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'accounts.product_id',
                DB::raw("SUM(CASE WHEN account_movements.type = 'credit' THEN account_movements.amount ELSE 0 END) as total_credit"),
                DB::raw("SUM(CASE WHEN account_movements.type = 'debit' THEN account_movements.amount ELSE 0 END) as total_debit")
            )
            ->groupBy('accounts.product_id');

        if (!empty($productId)) {
            $groupedMovementsQuery->where('accounts.product_id', $productId);
        }

        if (!empty($category) && $category !== 'all') {
            $groupedMovementsQuery->where('account_movements.type', $category);
        }

        $movementsStats = $this->applyTransactionItemFilter($groupedMovementsQuery, $transactionItemId)
            ->get()
            ->keyBy('product_id');

        $products = $allProducts->map(function ($p) use ($movementsStats) {
            $stat = $movementsStats->get($p->id);
            $p->total_credit = (float) ($stat->total_credit ?? 0);
            $p->total_debit  = (float) ($stat->total_debit ?? 0);
            $p->net_change   = $p->total_credit - $p->total_debit;
            return $p;
        });

        // 2. Rincian Transaksi / Mutasi
        $movementsQuery = DB::table('account_movements')
            ->join('accounts', 'account_movements.account_number', '=', 'accounts.account_number')
            ->join('products', 'accounts.product_id', '=', 'products.id')
            ->leftJoin('transactions', 'account_movements.transaction_id', '=', 'transactions.id')
            ->whereBetween('account_movements.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'account_movements.id',
                'account_movements.created_at',
                'account_movements.account_number',
                'accounts.customer_name',
                'products.product_name',
                'products.id as product_id',
                'account_movements.type',
                'account_movements.amount',
                'account_movements.balance_before',
                'account_movements.balance_after',
                'account_movements.description',
                'transactions.reference_number',
                'transactions.channel'
            );

        if (!empty($productId)) {
            $movementsQuery->where('accounts.product_id', $productId);
        }

        if (!empty($category) && $category !== 'all') {
            $movementsQuery->where('account_movements.type', $category);
        }

        $movementsQuery = $this->applyTransactionItemFilter($movementsQuery, $transactionItemId);

        $perPage = (int) $request->get('per_page', 25);
        $perPage = ($perPage <= 0) ? 25 : min($perPage, 500);
        $transactionsList = $movementsQuery->orderBy('account_movements.created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'filters' => [
                    'product_id' => $productId,
                    'transaction_item_id' => $transactionItemId,
                    'start_date' => $startDate,
                    'end_date'   => $endDate,
                    'category'   => $category,
                ],
                'summary' => [
                    'total_accounts' => (int) $products->sum('total_accounts'),
                    'total_balance'  => (float) $products->sum('total_balance'),
                    'total_masuk'    => (float) $products->sum('total_credit'),
                    'total_keluar'   => (float) $products->sum('total_debit'),
                    'net_change'     => (float) $products->sum('net_change'),
                ],
                'products'     => $products,
                'transactions' => $transactionsList
            ]
        ]);
    }

    /**
     * Cetak PDF Rekapitulasi dengan Kolom Tanda Tangan Pejabat Bank
     */
    public function printRekapitulasi(Request $request)
    {
        $productId = $request->get('product_id');
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate   = $request->get('end_date', now()->format('Y-m-d'));
        $category  = $request->get('category');
        $transactionItemId = $request->get('transaction_item_id');

        $selectedProduct = $productId ? Product::find($productId) : null;
        $selectedTransactionItem = $transactionItemId ? TransactionItem::find($transactionItemId) : null;

        // Rekap per Produk
        $productsQuery = Product::withCount(['accounts as total_accounts' => function ($q) {
            $q->where('status', '!=', 'TUTUP');
        }])
        ->withSum('accounts as total_balance', 'balance');

        if (!empty($productId)) {
            $productsQuery->where('id', $productId);
        }

        $allProducts = $productsQuery->get();

        $groupedMovementsQuery = DB::table('account_movements')
            ->join('accounts', 'account_movements.account_number', '=', 'accounts.account_number')
            ->leftJoin('transactions', 'account_movements.transaction_id', '=', 'transactions.id')
            ->whereBetween('account_movements.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'accounts.product_id',
                DB::raw("SUM(CASE WHEN account_movements.type = 'credit' THEN account_movements.amount ELSE 0 END) as total_credit"),
                DB::raw("SUM(CASE WHEN account_movements.type = 'debit' THEN account_movements.amount ELSE 0 END) as total_debit")
            )
            ->groupBy('accounts.product_id');

        if (!empty($productId)) {
            $groupedMovementsQuery->where('accounts.product_id', $productId);
        }

        if (!empty($category) && $category !== 'all') {
            $groupedMovementsQuery->where('account_movements.type', $category);
        }

        $movementsStats = $this->applyTransactionItemFilter($groupedMovementsQuery, $transactionItemId)
            ->get()
            ->keyBy('product_id');

        $products = $allProducts->map(function ($p) use ($movementsStats) {
            $stat = $movementsStats->get($p->id);
            $p->total_credit = (float) ($stat->total_credit ?? 0);
            $p->total_debit  = (float) ($stat->total_debit ?? 0);
            $p->net_change   = $p->total_credit - $p->total_debit;
            return $p;
        });

        // Rincian Transaksi (maksimal 300 untuk PDF)
        $movementsQuery = DB::table('account_movements')
            ->join('accounts', 'account_movements.account_number', '=', 'accounts.account_number')
            ->join('products', 'accounts.product_id', '=', 'products.id')
            ->leftJoin('transactions', 'account_movements.transaction_id', '=', 'transactions.id')
            ->whereBetween('account_movements.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'account_movements.id',
                'account_movements.created_at',
                'account_movements.account_number',
                'accounts.customer_name',
                'products.product_name',
                'account_movements.type',
                'account_movements.amount',
                'account_movements.balance_before',
                'account_movements.balance_after',
                'account_movements.description',
                'transactions.reference_number'
            );

        if (!empty($productId)) {
            $movementsQuery->where('accounts.product_id', $productId);
        }

        if (!empty($category) && $category !== 'all') {
            $movementsQuery->where('account_movements.type', $category);
        }

        $movementsQuery = $this->applyTransactionItemFilter($movementsQuery, $transactionItemId);

        $transactions = $movementsQuery->orderBy('account_movements.created_at', 'desc')->limit(300)->get();

        $summary = [
            'total_accounts' => (int) $products->sum('total_accounts'),
            'total_balance'  => (float) $products->sum('total_balance'),
            'total_masuk'    => (float) $products->sum('total_credit'),
            'total_keluar'   => (float) $products->sum('total_debit'),
            'net_change'     => (float) $products->sum('net_change'),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.rekapitulasi', [
            'products'         => $products,
            'transactions'     => $transactions,
            'summary'          => $summary,
            'selectedProduct'  => $selectedProduct,
            'selectedTransactionItem' => $selectedTransactionItem,
            'category'         => $category,
            'startDate'        => $startDate,
            'endDate'          => $endDate,
            'generated_at'     => now()->translatedFormat('d F Y H:i:s'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('Rekapitulasi_BankSantri_' . date('Ymd_His') . '.pdf');
    }

    /**
     * Terapkan filter Rincian Transaksi (Master Transaction Item) pada query mutasi rekening.
     * Menggunakan strategi pencarian ganda (keyword deskripsi, payment_record_items, & transaction_rules)
     * untuk memastikan kecocokan mutlak meskipun ada perbedaan penulisan atau transaksi manual.
     */
    private function applyTransactionItemFilter($query, $transactionItemId)
    {
        if (empty($transactionItemId)) {
            return $query;
        }

        static $cachedMatchingTxIds = null;
        static $cachedKeywords = null;
        static $cachedItem = null;

        $item = TransactionItem::find($transactionItemId);

        if (!$item) {
            // ID tidak valid -> kosongkan laporan
            return $query->whereRaw('1 = 0');
        }

        if ($cachedItem === null || $cachedItem->id != $transactionItemId) {
            $cachedItem = $item;
            
            $keywords = [];
            $rawName = trim($item->item_name);
            $keywords[] = $rawName;

            if (str_contains($rawName, "'")) $keywords[] = str_replace("'", "’", $rawName);
            if (str_contains($rawName, "’")) $keywords[] = str_replace("’", "'", $rawName);

            if (str_contains($rawName, '(')) {
                $parts = explode('(', $rawName);
                $acronym = trim($parts[0]);
                if (mb_strlen($acronym) >= 2) $keywords[] = $acronym;
                $inside = trim(rtrim($parts[1] ?? '', ')'));
                if (mb_strlen($inside) >= 3) {
                    $keywords[] = $inside;
                    if (str_contains($inside, "'")) $keywords[] = str_replace("'", "’", $inside);
                    if (str_contains($inside, "’")) $keywords[] = str_replace("’", "'", $inside);
                }
            }

            $pkgNames = DB::table('payment_package_items')
                ->where('transaction_item_id', $item->id)
                ->pluck('item_name')->toArray();

            $recNames = DB::table('payment_record_items')
                ->where('transaction_item_id', $item->id)
                ->pluck('item_name')->toArray();

            foreach (array_merge($pkgNames, $recNames) as $alias) {
                $alias = trim($alias);
                if (mb_strlen($alias) >= 2) {
                    $keywords[] = $alias;
                }
            }

            if (stripos($rawName, 'saku') !== false) {
                $keywords[] = 'uang saku';
                $keywords[] = 'uang saku santri';
            }

            $cachedKeywords = array_values(array_unique(array_filter($keywords)));

            // Pre-calculate matching transaction IDs to avoid heavy correlated subqueries
            // C) Transaction rules
            $matchingTxIds = DB::table('transactions')
                ->join('transaction_rules as tr', 'tr.transaction_type_id', '=', 'transactions.transaction_type_id')
                ->where('tr.transaction_item_id', $item->id)
                ->pluck('transactions.id')->toArray();
            
            // B) Payment records
            $priRecords = DB::table('payment_record_items as pri')
                ->join('payment_records as pr', 'pr.id', '=', 'pri.payment_record_id')
                ->where('pri.transaction_item_id', $item->id)
                ->select('pr.reference_number as pr_ref', 'pri.package_item_id', 'pri.id as pri_id', 'pri.item_name')
                ->get();
            
            if ($priRecords->count() > 0) {
                $prRefs = $priRecords->pluck('pr_ref')->unique()->values()->toArray();
                $priByRef = $priRecords->groupBy('pr_ref');

                $txQuery = DB::table('transactions')->select('id', 'reference_number', 'description');
                $txQuery->where(function ($q) use ($priRecords) {
                    foreach ($priRecords as $pri) {
                        $q->orWhere('reference_number', $pri->pr_ref . '-' . $pri->package_item_id)
                          ->orWhere('reference_number', $pri->pr_ref . '-' . $pri->pri_id);
                    }
                });

                $matchedTxs = $txQuery->get();
                $matchingTxIds = array_merge($matchingTxIds, $matchedTxs->pluck('id')->toArray());

                if (!empty($prRefs)) {
                    $prefixTxs = DB::table('transactions')->select('id', 'reference_number', 'description')
                        ->where(function ($q) use ($prRefs) {
                            foreach ($prRefs as $prRef) {
                                $q->orWhere('reference_number', 'like', $prRef . '-%');
                            }
                        })
                        ->get();

                    foreach ($prefixTxs as $tx) {
                        $matchedByPrefix = false;
                        foreach ($priByRef as $prRef => $priors) {
                            if (!str_starts_with($tx->reference_number, $prRef . '-')) {
                                continue;
                            }
                            foreach ($priors as $pri) {
                                if (stripos($tx->description ?? '', $pri->item_name) !== false) {
                                    $matchedByPrefix = true;
                                    break 2;
                                }
                            }
                        }
                        if ($matchedByPrefix) {
                            $matchingTxIds[] = $tx->id;
                        }
                    }
                }
            }
            
            $cachedMatchingTxIds = array_values(array_unique(array_filter($matchingTxIds)));
        }

        return $query->where(function ($q) use ($cachedKeywords, $cachedMatchingTxIds) {
            // Match descriptions and keywords
            $q->where(function ($descQuery) use ($cachedKeywords) {
                foreach ($cachedKeywords as $kw) {
                    $pattern = '%' . addcslashes(mb_strtolower($kw), '%_\\') . '%';
                    $descQuery->orWhereRaw('LOWER(COALESCE(account_movements.description, \'\')) LIKE ?', [$pattern])
                              ->orWhereRaw('LOWER(COALESCE(transactions.description, \'\')) LIKE ?', [$pattern]);
                }
            });

            // Match pre-calculated related transactions (rules & payment records)
            if (!empty($cachedMatchingTxIds)) {
                $q->orWhereIn('transactions.id', $cachedMatchingTxIds);
                $q->orWhereIn('account_movements.transaction_id', $cachedMatchingTxIds);
            }
        });
    }
}
