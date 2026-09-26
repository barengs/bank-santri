<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    use HasFactory;

    protected $primaryKey = 'coa_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'coa_code',
        'account_name',
        'account_type',    // asset | liability | equity | revenue | expense | zis
        'parent_coa_code',
        'level',
        'is_postable',
        'is_active',
    ];

    protected $appends = ['coa_name', 'normal_balance', 'group'];

    public function getCoaNameAttribute()
    {
        return $this->account_name;
    }

    public function getNormalBalanceAttribute()
    {
        return in_array(strtolower($this->account_type ?? ''), ['asset', 'expense']) ? 'debit' : 'credit';
    }

    public function getGroupAttribute()
    {
        return match (strtolower($this->account_type ?? '')) {
            'asset'     => 'Aset',
            'liability' => 'Liabilitas',
            'equity'    => 'Ekuitas',
            'revenue'   => 'Pendapatan',
            'expense'   => 'Beban',
            'zis'       => 'Dana ZIS',
            default     => 'Lainnya',
        };
    }

    public function parent()
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_coa_code', 'coa_code');
    }

    public function children()
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_coa_code', 'coa_code');
    }
}
