<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Main\AccountController;
use App\Http\Controllers\Api\Main\TopUpController;
use App\Http\Controllers\Api\Main\TransactionController;
use App\Http\Controllers\Api\Main\TransactionTypeController;
use App\Http\Controllers\Api\Master\ProductController;
use App\Http\Controllers\Api\Master\ChartOfAccountController;

/*
|--------------------------------------------------------------------------
| Bank Santri API Routes
|--------------------------------------------------------------------------
*/

// Auth routes
Route::group(['middleware' => 'api', 'prefix' => 'auth'], function () {
    Route::post('login',   [AuthController::class, 'login']);
    Route::post('logout',  [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('profile',  [AuthController::class, 'me']);
});

// Master Data
Route::group(['prefix' => 'master', 'middleware' => ['auth:api']], function () {
    Route::apiResource('product', ProductController::class);
    Route::apiResource('chart-of-account', ChartOfAccountController::class);
});

// Main Bank Operations
Route::group(['prefix' => 'main', 'middleware' => ['auth:api']], function () {

    // Rekening santri
    Route::apiResource('account', AccountController::class);

    // Transaksi
    Route::post('transaction/cash-deposit',    [TransactionController::class, 'cashDeposit']);
    Route::post('transaction/cash-withdrawal', [TransactionController::class, 'cashWithdrawal']);
    Route::post('transaction/fund-transfer',   [TransactionController::class, 'fundTransfer']);
    Route::post('transaction/{id}/reverse',    [TransactionController::class, 'reverseTransaction']);
    Route::get('transaction/account/{accountNumber}/last-7-days', [TransactionController::class, 'getLast7DaysTransactions']);
    Route::get('account/{accountNumber}/transactions', [TransactionController::class, 'getByAccount']);
    Route::apiResource('transaction',      TransactionController::class);
    Route::apiResource('transaction-type', TransactionTypeController::class);

    // Top-Up Multi-Channel
    Route::get('top-up',                        [TopUpController::class, 'index']);
    Route::get('top-up/account/{accountNumber}',[TopUpController::class, 'byAccount']);
    Route::post('top-up/cash',                  [TopUpController::class, 'cashTopUp']);
    Route::post('top-up/bank-transfer',         [TopUpController::class, 'bankTransferTopUp']);
    Route::post('top-up/{id}/verify',           [TopUpController::class, 'verify']);
    Route::post('top-up/{id}/reject',           [TopUpController::class, 'reject']);
});

// Midtrans Webhook (public — tidak perlu auth, cukup validasi signature)
Route::post('midtrans/webhook', [TopUpController::class, 'midtransWebhook']);
