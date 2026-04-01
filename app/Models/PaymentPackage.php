<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'package_code',
        'package_name',
        'description',
        'academic_year',
        'semester',
        'total_amount',
        'saku_amount',
        'is_active',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'saku_amount'  => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(PaymentPackageItem::class, 'package_id');
    }

    public function paymentRecords()
    {
        return $this->hasMany(PaymentRecord::class, 'package_id');
    }

    /**
     * Re-compute total_amount dan saku_amount dari items.
     */
    public function recalculateTotals(): void
    {
        $items = $this->items;
        $this->total_amount = $items->sum('amount');
        $this->saku_amount  = $items->where('is_saku', true)->sum('amount');
        $this->save();
    }
}
