<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class PaymentPackage extends Model
{
    use HasFactory, LogsActivity;

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
        $baseTotal = $items->sum('amount');
        
        $multiplier = 1.0;
        $semester = $this->semester;
        if (in_array($semester, ['3', '3_bulan', '3bulan'])) {
            $multiplier = 3.0;
        } elseif (in_array($semester, ['6', '6_bulan', '6bulan'])) {
            $multiplier = 6.0;
        } elseif (in_array($semester, ['12', '12_bulan', '12bulan'])) {
            $multiplier = 12.0;
        }

        $this->total_amount = (string) ($baseTotal * $multiplier);
        $this->saku_amount  = (string) ($items->where('is_saku', true)->sum('amount') * $multiplier);
        $this->save();
    }

    // Activity Log
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['package_name', 'total_amount', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('payment_package');
    }
}
