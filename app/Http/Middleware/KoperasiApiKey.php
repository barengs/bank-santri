<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\KoperasiMerchant;
use Illuminate\Support\Facades\Hash;

class KoperasiApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('X-Koperasi-Key');
        
        if (!$key) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses tidak diizinkan. API Key koperasi tidak ditemukan.',
            ], 401);
        }

        // 1. Coba cari di KoperasiMerchant (Sistem Baru)
        $merchants = KoperasiMerchant::where('is_active', true)->get();
        $matchedMerchant = $merchants->first(fn($m) => Hash::check($key, $m->api_key_hash));

        if ($matchedMerchant) {
            $matchedMerchant->update(['last_used_at' => now()]);
            $request->merge(['koperasi_merchant' => $matchedMerchant]);
            return $next($request);
        }

        // 2. Fallback ke key di .env (Sistem Lama)
        $validKeyEnv = config('app.koperasi_api_key', env('KOPERASI_API_KEY'));
        
        if ($validKeyEnv && $key === $validKeyEnv) {
            // Berhasil login dengan key fallback
            return $next($request);
        }

        return response()->json([
            'status'  => 'error',
            'message' => 'Akses tidak diizinkan. API Key koperasi tidak valid.',
        ], 401);
    }
}
