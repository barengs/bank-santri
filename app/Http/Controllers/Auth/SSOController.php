<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use Illuminate\Support\Str;

class SSOController extends Controller
{
    /**
     * Handle the SSO Handover from SMPT.
     */
    public function handover(Request $request)
    {
        $token = $request->query('token');

        if (!$token) {
            return redirect('/login-error');
        }

        try {
            // Validate the token (shared secret)
            $payload = JWTAuth::setToken($token)->getPayload();
            $email = $payload->get('email');
            $subId = $payload->get('sub');

            if ($email) {
                // Ensure user exists locally (Auto-provisioning)
                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'id'       => $subId,
                        'name'     => $payload->get('name') ?? 'Admin Bank',
                        'password' => Str::random(16),
                        'role'     => $payload->get('role') ?? 'adminbank',
                    ]
                );
            }

            // Return handover view to set localStorage
            return view('auth.sso', [
                'token' => $token,
                'user'  => $user ?? null
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid SSO Token: ' . $e->getMessage()], 401);
        }
    }
}
