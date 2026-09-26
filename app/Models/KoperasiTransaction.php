<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KoperasiTransaction extends Model
{
    protected $fillable = [
        'account_number',
        'user_id',
        'cashier_name',
        'reference_number',
        'amount',
        'balance_before',
        'balance_after',
        'outlet_name',
        'item_description',
        'cashier_note',
    ];

    protected $casts = [
        'amount'         => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after'  => 'decimal:2',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_number', 'account_number');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
