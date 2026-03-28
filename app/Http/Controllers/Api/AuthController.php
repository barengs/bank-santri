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
        $this->middleware('auth:api', ['except' => ['login']]);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        try {
            if (!$token = auth('api')->attempt($credentials)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Username atau password salah.',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal membuat token.',
            ], 500);
        }

        return $this->respondWithToken($token);
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
            return $this->respondWithToken($token);
        } catch (JWTException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Token tidak dapat diperbarui. Silakan login ulang.',
            ], 401);
        }
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'status'       => 'success',
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60,
            'user'         => auth('api')->user(),
        ]);
    }
}
