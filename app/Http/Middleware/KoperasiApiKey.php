<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class KoperasiApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $key       = $request->header('X-Koperasi-Key');
        $validKey  = config('app.koperasi_api_key', env('KOPERASI_API_KEY'));

        if (!$key || !$validKey || $key !== $validKey) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses tidak diizinkan. API Key koperasi tidak valid.',
            ], 401);
        }

        return $next($request);
    }
}
