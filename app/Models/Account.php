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
        'card_number',    // RFID / NFC / Barcode card UID
        'customer_id',    // student ID di smpt
        'customer_name',  // nama santri (denormalized untuk performa)
        'product_id',
        'balance',
        'status',
        'akad_type',      // wadiah | mudharabah
        'open_date',
        'close_date',
        'daily_withdrawal_limit',
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

    /**
     * Limit harian belanja KOPERASI (bukan tarik tunai).
     *
     * Hierarki:
     * 1. Dispensasi manual per akun: accounts.daily_withdrawal_limit > 0
     * 2. Saldo < 10.000 → 0 (tidak bisa belanja, sesuai aturan bawah tier)
     * 3. Tier global dari Setting (JSON cached): 5.000 / 10.000 / 15.000
     * 4. Fallback terakhir: 5.000
     *
     * CATATAN: Tarik tunai di teller TIDAK memakai limit ini (kebijakan
     * berlaku di luar sistem).
     */
    public function getKoperasiSpendLimit(): float
    {
        // 1. Dispensasi manual per rekening
        if (!empty($this->daily_withdrawal_limit) && (float) $this->daily_withdrawal_limit > 0) {
            return (float) $this->daily_withdrawal_limit;
        }

        $balance = (float) $this->balance;

        // 2. Di bawah batas bawah tier
        if ($balance < 10000) {
            return 0;
        }

        // 3. Cari tier yang cocok dengan saldo saat ini
        $tiers = Setting::getTiers('koperasi_daily_limit_tiers', [
            ['min' => 10000,  'max' => 150000, 'limit' => 5000],
            ['min' => 150001, 'max' => 300000, 'limit' => 10000],
            ['min' => 300001, 'max' => null,   'limit' => 15000],
        ]);

        foreach ($tiers as $tier) {
            $min = (float) $tier['min'];
            $max = $tier['max'] !== null ? (float) $tier['max'] : null;
            if ($balance >= $min && ($max === null || $balance <= $max)) {
                return (float) $tier['limit'];
            }
        }

        // 4. Fallback
        return 5000;
    }
}
