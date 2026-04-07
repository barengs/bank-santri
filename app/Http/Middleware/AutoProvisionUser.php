<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class AutoProvisionUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            // Check if already authenticated by ID
            if ($user = auth('api')->user()) {
                // Log::info("User already authenticated by ID: " . $user->id);
                return $next($request);
            }

            // Not authenticated locally, check if we have a valid token
            if ($token = JWTAuth::getToken()) {
                $payload = JWTAuth::getPayload($token);
                $subId = $payload->get('sub');
                $email = $payload->get('email');
                $name = $payload->get('name');
                
                // Log attempt
                // Log::info("Auto-provision check for email: {$email}, sub: {$subId}");

                if ($email) {
                    // 1. Try to find user by ID first (sub claim)
                    $user = User::find($subId);
                    
                    if (!$user) {
                        // 2. Try to find by email
                        $user = User::where('email', $email)->first();
                        
                        if (!$user) {
                            // 3. Create user if doesn't exist anywhere
                            $user = User::create([
                                'id'       => $subId, // Try to force the same ID to prevent continuous cycles
                                'name'     => $name ?? 'External User',
                                'email'    => $email,
                                'password' => Str::random(16),
                                'role'     => $payload->get('role') ?? 'staf',
                            ]);
                            Log::info("Auto-provisioned new user: {$email} with ID: {$subId}");
                        } else {
                            // User exists by email but has DIFFERENT ID than token sub
                            // For distributed systems to work with standard find($id), they MUST share the same ID.
                            // We will force-authenticate for THIS request, but it might cycle.
                            Log::warning("User exists by email but ID mismatch: Token sub is {$subId}, DB ID is {$user->id}");
                        }
                    }
                    
                    if ($user) {
                        auth('api')->login($user);
                    }
                }
            }
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            // Let the auth:api middleware handle expired tokens for refresh flow
        } catch (\Exception $e) {
            Log::error("Auto-provisioning critical failure: " . $e->getMessage());
        }

        return $next($request);
    }
}
