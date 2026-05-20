<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRecordItem extends Model
{
    protected $fillable = [
        'payment_record_id',
        'package_item_id',
        'transaction_item_id',
        'item_name',
        'category',
        'amount',
        'is_saku',
    ];

    public function transactionItem()
    {
        return $this->belongsTo(TransactionItem::class);
    }

    protected $casts = [
        'amount'  => 'decimal:2',
        'is_saku' => 'boolean',
    ];

    public function paymentRecord()
    {
        return $this->belongsTo(PaymentRecord::class, 'payment_record_id');
    }
}
