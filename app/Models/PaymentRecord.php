<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRecord extends Model
{
    protected $fillable = [
        'account_number',
        'package_id',
        'top_up_request_id',
        'reference_number',
        'total_amount',
        'saku_allocated',
        'status',
        'paid_at',
        'processed_by',
        'notes',
    ];

    protected $casts = [
        'total_amount'   => 'decimal:2',
        'saku_allocated' => 'decimal:2',
        'paid_at'        => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_number', 'account_number');
    }

    public function package()
    {
        return $this->belongsTo(PaymentPackage::class, 'package_id');
    }

    public function topUpRequest()
    {
        return $this->belongsTo(TopUpRequest::class, 'top_up_request_id');
    }

    public function items()
    {
        return $this->hasMany(PaymentRecordItem::class, 'payment_record_id');
    }
}
