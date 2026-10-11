<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'refresh']]);
    }

    public function login(Request $request)
    {
        $loginInput = $request->input('email') ?? $request->input('username');
        $password = $request->input('password') ?? $request->input('pin');

        if (empty($loginInput) || empty($password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Email/Username dan Password/PIN wajib diisi.',
            ], 422);
        }

        // Cari user berdasarkan email atau name
        $user = \App\Models\User::where('email', $loginInput)
            ->orWhere('name', $loginInput)
            ->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($password, $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Email/ID Petugas atau Password/PIN salah.',
            ], 401);
        }

        try {
            if (!$token = JWTAuth::fromUser($user)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Gagal membuat token otentikasi.',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal membuat token: ' . $e->getMessage(),
            ], 500);
        }

        // JWTAuth::fromUser() tidak menyetel user pada guard auth:api,
        // dan request login tidak membawa header Bearer, sehingga
        // auth('api')->user() akan null. Kita kirimkan user secara eksplisit.
        return $this->respondWithToken($token, $user);
    }

    public function me()
    {
        return response()->json([
            'status' => 'success',
            'data'   => auth('api')->user(),
        ]);
    }

    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            $user = JWTAuth::setToken($token)->toUser();
            return $this->respondWithToken($token, $user);
        } catch (JWTException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Token tidak dapat diperbarui. Silakan login ulang.',
            ], 401);
        }
    }

    protected function respondWithToken($token, ?\App\Models\User $user = null)
    {
        $user = $user ?? auth('api')->user();
        $roles = $user ? $user->getRoleNames()->toArray() : [];
        $activeRole = !empty($roles) ? $roles[0] : ($user?->role ?? 'kasir_koperasi');

        $userData = $user ? array_merge($user->toArray(), [
            'role'  => $activeRole,
            'roles' => $roles,
        ]) : null;

        return response()->json([
            'status'       => 'success',
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60,
            'user'         => $userData,
        ]);
    }
}
