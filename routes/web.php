<?php

use App\Http\Controllers\Auth\SSOController;

Route::get('/auth/sso', [SSOController::class, 'handover'])->name('sso.handover');

Route::get('/login', function () {
    return view('app');
})->name('login');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
