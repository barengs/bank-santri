<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    protected $primaryKey = 'account_number';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'account_number', // = NIS santri
        'customer_id',    // student ID di smpt
        'customer_name',  // nama santri (denormalized untuk performa)
        'product_id',
        'balance',
        'status',
        'akad_type',      // wadiah | mudharabah
        'open_date',
        'close_date',
    ];

    protected $casts = [
        'balance'   => 'decimal:2',
        'open_date' => 'date',
        'close_date'=> 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function movements()
    {
        return $this->hasMany(AccountMovement::class, 'account_number', 'account_number');
    }

    public function transactions()
    {
        return Transaction::where('source_account', $this->account_number)
            ->orWhere('destination_account', $this->account_number);
    }

    public function topUpRequests()
    {
        return $this->hasMany(TopUpRequest::class, 'account_number', 'account_number');
    }
}
