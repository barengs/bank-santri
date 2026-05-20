<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentPackageItem extends Model
{
    protected $fillable = [
        'package_id',
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

    public function package()
    {
        return $this->belongsTo(PaymentPackage::class, 'package_id');
    }
}
