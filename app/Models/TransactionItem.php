<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_name',
        'default_amount',
        'coa_code',
        'entry_type',
        'value_mode',
        'destination_account',
        'description',
        'is_active',
    ];

    protected $casts = [
        'default_amount' => 'decimal:2',
        'is_active'      => 'boolean',
    ];

    public function coa()
    {
        return $this->belongsTo(ChartOfAccount::class, 'coa_code', 'coa_code');
    }

    public function destinationAccount()
    {
        return $this->belongsTo(Account::class, 'destination_account', 'account_number');
    }

    public function rules()
    {
        return $this->hasMany(TransactionRule::class);
    }
}
