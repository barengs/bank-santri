<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Bill extends Model
{
    use LogsActivity;

    public const STATUS_UNPAID  = 'unpaid';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_PAID    = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_WAIVED  = 'waived';

    protected $fillable = [
        'account_number',
        'package_id',
        'bill_period',
        'package_snapshot',
        'amount',
        'paid_amount',
        'due_date',
        'status',
        'issued_at',
        'issued_by',
        'notes',
    ];

    protected $casts = [
        'package_snapshot' => 'array',
        'amount'           => 'decimal:2',
        'paid_amount'      => 'decimal:2',
        'due_date'         => 'date',
        'issued_at'        => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_number', 'account_number');
    }

    public function package()
    {
        return $this->belongsTo(PaymentPackage::class, 'package_id');
    }

    public function payments()
    {
        return $this->hasMany(BillPayment::class, 'bill_id');
    }

    /**
     * Sisa tagihan yang belum dibayar.
     */
    public function getRemainingAttribute(): float
    {
        return (float) $this->amount - (float) $this->paid_amount;
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status === self::STATUS_PAID || $this->status === self::STATUS_WAIVED || !$this->due_date) {
            return false;
        }

        return \Carbon\Carbon::parse($this->due_date)->isPast();
    }

    /**
     * Tandai tagihan lunas sebagian/lunas penuh setelah pembayaran dialokasikan.
     * Disimpan setiap kali ada alokasi pembayaran.
     */
    public function syncStatus(): void
    {
        if ($this->status === self::STATUS_WAIVED) {
            return;
        }

        if ((float) $this->paid_amount >= (float) $this->amount) {
            $this->status = self::STATUS_PAID;
        } elseif ((float) $this->paid_amount > 0) {
            $this->status = $this->is_overdue ? self::STATUS_OVERDUE : self::STATUS_PARTIAL;
        } else {
            $this->status = $this->is_overdue ? self::STATUS_OVERDUE : self::STATUS_UNPAID;
        }

        $this->save();
    }

    /**
     * Tandai semua tagihan yang lewat jatuh tempo namun belum lunas menjadi overdue.
     * Dipanggil oleh scheduled command harian.
     */
    public static function markOverdue(): int
    {
        return static::whereIn('status', [self::STATUS_UNPAID, self::STATUS_PARTIAL])
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => self::STATUS_OVERDUE]);
    }

    // Activity Log
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['bill_period', 'amount', 'paid_amount', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('bill');
    }
}
