<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
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
Route::group(['middleware' => ['api', 'autoprovision'], 'prefix' => 'auth'], function () {
    Route::post('login',   [AuthController::class, 'login']);
    Route::post('logout',  [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('profile',  [AuthController::class, 'me']);
});

// Master Data (butuh auth)
Route::group(['prefix' => 'master', 'middleware' => ['autoprovision', 'auth:api']], function () {
    Route::apiResource('product', ProductController::class);
    Route::get('chart-of-account/header-accounts', [ChartOfAccountController::class, 'headerAccounts']);
    Route::get('chart-of-account/detail-accounts', [ChartOfAccountController::class, 'detailAccounts']);
    Route::apiResource('chart-of-account', ChartOfAccountController::class);
    Route::apiResource('transaction-item', \App\Http\Controllers\Api\Master\TransactionItemController::class);

    // Paket Pembayaran
    Route::apiResource('payment-package', PaymentPackageController::class);

    // Konfigurasi / Setting
    Route::get('setting', [SettingController::class, 'index']);
    Route::put('setting', [SettingController::class, 'update']);
});

// Main Bank Operations (butuh auth)
Route::group(['prefix' => 'main', 'middleware' => ['autoprovision', 'auth:api']], function () {

    // Dashboard
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);

    // Rekening santri
    Route::get('account/smpt-search', [AccountController::class, 'smptSearch']);
    Route::apiResource('account', AccountController::class);

    // Transaksi
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

// Koperasi — autentikasi via X-Koperasi-Key header (tidak butuh JWT)
Route::group(['prefix' => 'koperasi', 'middleware' => ['koperasi.key']], function () {
    Route::get('check/{nis}',   [KoperasiController::class, 'check']);
    Route::post('debit',        [KoperasiController::class, 'debit']);
    Route::get('transactions',  [KoperasiController::class, 'transactions']);
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
});
