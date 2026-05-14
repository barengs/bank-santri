<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KoperasiMerchant extends Model
{
    protected $fillable = [
        'name',
        'api_key_hash',
        'is_active',
        'notes',
        'last_used_at',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = [
        'api_key_hash',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
