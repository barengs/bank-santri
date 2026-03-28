<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountMovement extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after'  => 'decimal:2',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_number', 'account_number');
    }
}
