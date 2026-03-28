<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'transactions';

    protected $fillable = [
        'id',
        'transaction_type_id',
        'source_account',
        'destination_account',
        'reference_number',
        'amount',
        'description',
        'status',         // pending | success | failed | reversed
        'channel',        // teller | midtrans | bank_transfer | system
        'akad_type',      // ijarah | murabahah | wadiah | qardh | wakalah
        'akad_description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function sourceAccount()
    {
        return $this->belongsTo(Account::class, 'source_account', 'account_number');
    }

    public function destinationAccount()
    {
        return $this->belongsTo(Account::class, 'destination_account', 'account_number');
    }

    public function transactionType()
    {
        return $this->belongsTo(TransactionType::class, 'transaction_type_id', 'id');
    }

    public function ledgerEntries()
    {
        return $this->hasMany(TransactionLedger::class, 'transaction_id', 'id');
    }
}
