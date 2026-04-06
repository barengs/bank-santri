<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionRule extends Model
{
    protected $fillable = [
        'transaction_type_id',
        'coa_code',
        'entry_type',
        'value_mode',
        'fixed_amount',
        'description',
    ];

    public function transactionType()
    {
        return $this->belongsTo(TransactionType::class);
    }

    public function coa()
    {
        return $this->belongsTo(ChartOfAccount::class, 'coa_code', 'coa_code');
    }
}
