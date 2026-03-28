<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TopUpRequest extends Model
{
    protected $fillable = [
        'account_number',
        'student_id',        // ID di smpt (untuk referensi)
        'amount',
        'channel',           // cash | bank_transfer | midtrans
        'status',            // pending | waiting_verification | success | failed
        'payment_ref',       // order_id Midtrans / no. referensi transfer
        'payment_proof',     // path foto bukti transfer
        'verified_by',       // admin user_id
        'verified_at',
        'notes',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_number', 'account_number');
    }
}
