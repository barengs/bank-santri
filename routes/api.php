<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SecurityController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Main\AccountController;
use App\Http\Controllers\Api\Main\TopUpController;
use App\Http\Controllers\Api\Main\TransactionController;
use App\Http\Controllers\Api\Main\TransactionTypeController;
use App\Http\Controllers\Api\Main\PaymentController;
use App\Http\Controllers\Api\Master\ProductController;
use App\Http\Controllers\Api\Master\ChartOfAccountController;
use App\Http\Controllers\Api\Master\PaymentPackageController;
use App\Http\Controllers\Api\Master\SettingController;
use App\Http\Controllers\Api\Koperasi\KoperasiController;

/*
|--------------------------------------------------------------------------
| Bank Santri API Routes
|--------------------------------------------------------------------------
*/

// Auth routes
Route::group(['middleware' => ['api'], 'prefix' => 'auth'], function () {
    Route::post('login',   [AuthController::class, 'login']);
    Route::post('logout',  [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('profile',  [AuthController::class, 'me']);
});

// Master Data (butuh auth)
Route::group(['prefix' => 'master', 'middleware' => ['autoprovision', 'auth:api']], function () {
    // Product Export / Import / Backup
    Route::get('product/export', [ProductController::class, 'export']);
    Route::get('product/backup', [ProductController::class, 'backup']);
    Route::get('product/import/template', [ProductController::class, 'downloadTemplate']);
    Route::post('product/import', [ProductController::class, 'import']);
    Route::apiResource('product', ProductController::class);

    // Chart of Account Export / Import / Backup
    Route::get('chart-of-account/export', [ChartOfAccountController::class, 'export']);
    Route::get('chart-of-account/backup', [ChartOfAccountController::class, 'backup']);
    Route::get('chart-of-account/import/template', [ChartOfAccountController::class, 'downloadTemplate']);
    Route::post('chart-of-account/import', [ChartOfAccountController::class, 'import']);
    Route::get('chart-of-account/header-accounts', [ChartOfAccountController::class, 'headerAccounts']);
    Route::get('chart-of-account/detail-accounts', [ChartOfAccountController::class, 'detailAccounts']);
    Route::apiResource('chart-of-account', ChartOfAccountController::class);

    // Transaction Item Export / Import / Backup
    Route::get('transaction-item/export', [\App\Http\Controllers\Api\Master\TransactionItemController::class, 'export']);
    Route::get('transaction-item/backup', [\App\Http\Controllers\Api\Master\TransactionItemController::class, 'backup']);
    Route::get('transaction-item/import/template', [\App\Http\Controllers\Api\Master\TransactionItemController::class, 'downloadTemplate']);
    Route::post('transaction-item/import', [\App\Http\Controllers\Api\Master\TransactionItemController::class, 'import']);
    Route::apiResource('transaction-item', \App\Http\Controllers\Api\Master\TransactionItemController::class);

    Route::apiResource('user', UserController::class);

    // Paket Pembayaran Export / Import / Backup
    Route::get('payment-package/export', [PaymentPackageController::class, 'export']);
    Route::get('payment-package/backup', [PaymentPackageController::class, 'backup']);
    Route::get('payment-package/import/template', [PaymentPackageController::class, 'downloadTemplate']);
    Route::post('payment-package/import', [PaymentPackageController::class, 'import']);
    Route::apiResource('payment-package', PaymentPackageController::class);

    // Konfigurasi / Setting
    Route::get('setting', [SettingController::class, 'index']);
    Route::put('setting', [SettingController::class, 'update']);
});

// Main Bank Operations (butuh auth)
Route::group(['prefix' => 'main', 'middleware' => ['autoprovision', 'auth:api']], function () {

    // Dashboard
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);

    // Rekening santri & Instansi
    Route::get('account/smpt-search', [AccountController::class, 'smptSearch']);
    Route::post('account/instansi', [AccountController::class, 'storeInstansi']);
    Route::apiResource('account', AccountController::class);

    // Transaksi
    Route::get('transaction/print',            [TransactionController::class, 'printPdf']);
    Route::get('transaction/{id}/print',       [TransactionController::class, 'printDetailPdf']);
    Route::post('transaction/cash-deposit',    [TransactionController::class, 'cashDeposit']);
    Route::post('transaction/cash-withdrawal', [TransactionController::class, 'cashWithdrawal']);
    Route::post('transaction/fund-transfer',   [TransactionController::class, 'fundTransfer']);
    Route::post('transaction/{id}/reverse',    [TransactionController::class, 'reverseTransaction']);
    Route::put('transaction/{id}/activate',   [TransactionController::class, 'activate']);
    Route::get('transaction/account/{accountNumber}/last-7-days', [TransactionController::class, 'getLast7DaysTransactions']);
    Route::get('account/{accountNumber}/transactions', [TransactionController::class, 'getByAccount']);
    Route::apiResource('transaction',      TransactionController::class);
    Route::apiResource('transaction-type', TransactionTypeController::class);

    // Top-Up Multi-Channel
    Route::get('top-up',                         [TopUpController::class, 'index']);
    Route::get('top-up/account/{accountNumber}', [TopUpController::class, 'byAccount']);
    Route::post('top-up/cash',                   [TopUpController::class, 'cashTopUp']);
    Route::post('top-up/bank-transfer',          [TopUpController::class, 'bankTransferTopUp']);
    Route::post('top-up/{id}/verify',            [TopUpController::class, 'verify']);
    Route::post('top-up/{id}/reject',            [TopUpController::class, 'reject']);

    // Pembayaran Paket
    Route::get('payment',                              [PaymentController::class, 'index']);
    Route::post('payment',                             [PaymentController::class, 'store']);
    Route::get('payment/{id}',                         [PaymentController::class, 'show']);
    Route::get('payment/account/{accountNumber}',      [PaymentController::class, 'byAccount']);

    // Laporan Perbankan (Mini Bank)
    Route::group(['prefix' => 'report'], function () {
        Route::get('jurnal-umum',              [\App\Http\Controllers\Api\Main\ReportController::class, 'jurnalUmum']);
        Route::get('mutasi-nasabah/{account}', [\App\Http\Controllers\Api\Main\ReportController::class, 'mutasiNasabah']);
        Route::get('rekap-saldo',              [\App\Http\Controllers\Api\Main\ReportController::class, 'rekapSaldo']);
        Route::get('rekap-kasir',              [\App\Http\Controllers\Api\Main\ReportController::class, 'rekapKasir']);
    });

    // Riwayat transaksi koperasi (akses admin via JWT)
    Route::get('koperasi/transactions', [KoperasiController::class, 'transactions']);

    // Manajemen Merchant Koperasi
    Route::get('koperasi/merchants',                [\App\Http\Controllers\Api\Main\KoperasiMerchantController::class, 'index']);
    Route::post('koperasi/merchants',               [\App\Http\Controllers\Api\Main\KoperasiMerchantController::class, 'store']);
    Route::put('koperasi/merchants/{id}',           [\App\Http\Controllers\Api\Main\KoperasiMerchantController::class, 'update']);
    Route::delete('koperasi/merchants/{id}',        [\App\Http\Controllers\Api\Main\KoperasiMerchantController::class, 'destroy']);
    Route::post('koperasi/merchants/{id}/rotate',   [\App\Http\Controllers\Api\Main\KoperasiMerchantController::class, 'rotateKey']);
});

// Koperasi & Dapur Outlet API — autentikasi via X-Koperasi-Key header (tidak butuh JWT)
Route::group(['prefix' => 'koperasi', 'middleware' => ['koperasi.key']], function () {
    Route::get('config',              [KoperasiController::class, 'config']);
    Route::get('check/{identifier}',  [KoperasiController::class, 'check']);
    Route::post('debit',              [KoperasiController::class, 'debit']);
    Route::get('transactions',        [KoperasiController::class, 'transactions']);
});

// Midtrans Webhook (public — validasi via signature di dalam method)
Route::post('midtrans/webhook', [TopUpController::class, 'midtransWebhook']);

// Internal Service-to-Service Routes (SMPT <-> Bank Santri)
// Diproteksi oleh X-Internal-Key header, bukan JWT
Route::group(['prefix' => 'internal', 'middleware' => ['internal.key']], function () {
    // Buat rekening santri saat pendaftaran (dipanggil oleh SMPT)
    Route::post('account', [AccountController::class, 'store']);
    Route::put('account/{accountNumber}', [AccountController::class, 'updateInternal']);
    Route::get('product/{id}', [ProductController::class, 'show']);
    Route::post('transaction', [\App\Http\Controllers\Api\Main\TransactionController::class, 'storeInternal']);
    Route::put('transaction/{id}/activate', [TransactionController::class, 'activate']);
    Route::get('account/{accountNumber}', [AccountController::class, 'showInternal']);
    Route::get('account/{accountNumber}/transactions', [\App\Http\Controllers\Api\Main\TransactionController::class, 'getByAccountInternal']);
});

// Protected Security & Admin Routes
Route::group(['middleware' => ['auth:api']], function () {
    // Sidebar dynamic loading
    Route::get('sidebar', [SecurityController::class, 'sidebar']);
    
    // Security Management (Admin only)
    Route::group(['prefix' => 'security'], function() {
        Route::get('menus', [SecurityController::class, 'getMenus']);
        Route::get('roles', [SecurityController::class, 'getRoles']);
        Route::post('roles', [SecurityController::class, 'storeRole']);
        Route::put('roles/{id}', [SecurityController::class, 'updateRole']);
        Route::delete('roles/{id}', [SecurityController::class, 'destroyRole']);
        Route::post('roles/{id}/sync-menus', [SecurityController::class, 'syncRoleMenus']);
        Route::get('permissions', [SecurityController::class, 'getPermissions']);
        Route::get('activity-logs', [\App\Http\Controllers\Api\ActivityLogController::class, 'index']);
    });

    // Accounting Reports
    Route::prefix('reports')->middleware(['auth:api'])->group(function () {
        Route::get('journal', [\App\Http\Controllers\Api\Reports\AccountingReportController::class, 'journal']);
        Route::get('general-ledger', [\App\Http\Controllers\Api\Reports\AccountingReportController::class, 'generalLedger']);
        Route::get('trial-balance', [\App\Http\Controllers\Api\Reports\AccountingReportController::class, 'trialBalance']);
        Route::get('profit-loss', [\App\Http\Controllers\Api\Reports\AccountingReportController::class, 'profitLoss']);
        Route::get('balance-sheet', [\App\Http\Controllers\Api\Reports\AccountingReportController::class, 'balanceSheet']);
        Route::get('reconciliation', [\App\Http\Controllers\Api\Reports\AccountingReportController::class, 'savingsReconciliation']);
    });
});
