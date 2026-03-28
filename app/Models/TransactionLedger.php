<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionLedger extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'debit'  => 'decimal:2',
        'credit' => 'decimal:2',
    ];
}
