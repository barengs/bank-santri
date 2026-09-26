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

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'id');
    }

    public function coa()
    {
        return $this->belongsTo(ChartOfAccount::class, 'coa_code', 'coa_code');
    }
}
