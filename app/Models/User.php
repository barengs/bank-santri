<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

use Spatie\Permission\Traits\HasRoles;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, LogsActivity;

    protected $table = 'users';
    protected $guard_name = 'api';

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'role',
        'role_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /**
     * Dapatkan Product ID aktif dari role user (jika role dibatasi per produk bank).
     * Mengembalikan null jika admin/adminbank/pimpinan atau jika role bersifat global.
     */
    public function getActiveProductId(): ?int
    {
        if ($this->hasRole('admin') || $this->hasRole('adminbank') || $this->hasRole('pimpinan')) {
            return null;
        }

        foreach ($this->roles as $r) {
            if (!empty($r->product_id)) {
                return (int) $r->product_id;
            }
        }

        return null;
    }

    /**
     * Cek apakah user memiliki akses cross-product (Global scope).
     */
    public function isGlobalProductScope(): bool
    {
        return $this->getActiveProductId() === null;
    }

    // JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        $activeRole = $this->roles->first();
        $productId = $this->getActiveProductId();

        return [
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role ?? $activeRole?->name ?? 'teller',
            'roles'      => $this->getRoleNames()->toArray(),
            'product_id' => $productId,
            'product'    => $activeRole?->product ? [
                'id'           => $activeRole->product->id,
                'product_name' => $activeRole->product->product_name,
                'product_code' => $activeRole->product->product_code,
            ] : null,
        ];
    }

    // Activity Log
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'role'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('user_management');
    }
}
