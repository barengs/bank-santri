<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountMovement;
use App\Models\PaymentPackage;
use App\Models\PaymentRecord;
use App\Models\PaymentRecordItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Proses pembayaran paket untuk santri.
     * Mengurangi saldo untuk item non-saku, dan mengalokasikan kembali porsi saku.
     */
    public function processPayment(string $accountNumber, int $packageId, ?int $topUpRequestId = null, ?string $notes = null)
    {
        return DB::transaction(function () use ($accountNumber, $packageId, $topUpRequestId, $notes) {
            $account = Account::where('account_number', $accountNumber)
                ->lockForUpdate()->firstOrFail();
            $package = PaymentPackage::with('items')->findOrFail($packageId);

            if ($account->status !== 'AKTIF') {
                throw new \Exception('Rekening tidak aktif.');
            }

            if (!$package->is_active) {
                throw new \Exception('Paket tidak aktif.');
            }

            $nonSakuItems = $package->items->where('is_saku', false);
            $sakuItems    = $package->items->where('is_saku', true);
            $nonSakuTotal = $nonSakuItems->sum('amount');
            $sakuTotal    = $sakuItems->sum('amount');
            $totalNeeded  = $package->total_amount;

            if ($account->balance < $totalNeeded) {
                throw new \Exception("Saldo tidak mencukupi. Dibutuhkan Rp " . number_format($totalNeeded, 0, ',', '.') . ", saldo tersedia Rp " . number_format($account->balance, 0, ',', '.'));
            }

            $ref = 'PAY-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            // 1. Catat Payment Record (Internal Bank Santri)
            $record = PaymentRecord::create([
                'account_number'    => $account->account_number,
                'package_id'        => $package->id,
                'top_up_request_id' => $topUpRequestId,
                'reference_number'  => $ref,
                'total_amount'      => $nonSakuTotal,
                'saku_allocated'    => $sakuTotal,
                'status'            => 'paid',
                'paid_at'           => now(),
                'processed_by'      => auth('api')->id(),
                'notes'             => $notes,
            ]);

            // Catat detail item
            foreach ($package->items as $item) {
                PaymentRecordItem::create([
                    'payment_record_id' => $record->id,
                    'package_item_id'   => $item->id,
                    'item_name'         => $item->item_name,
                    'category'          => $item->category,
                    'amount'            => $item->amount,
                    'is_saku'           => $item->is_saku,
                ]);
            }

            // 2. Catat Transaksi Perbankan & Jurnal COA (Hanya porsi Non-Saku yang jadi pendapatan)
            if ($nonSakuTotal > 0) {
                app(\App\Services\AccountingService::class)->recordTransaction(
                    'PAYMENT-PKG',
                    $nonSakuTotal,
                    $account->account_number,
                    null,
                    "Pembayaran Paket: {$package->package_name} [{$ref}]",
                    'system',
                    ['reference_number' => $ref]
                );
            }

            // Catatan: Porsi Saku tidak perlu dijurnal COA karena dananya tetap di Bank (di Akun Santri), 
            // dan saldo santri sudah didebit full lalu dikredit balik jika kita pakai logika lama.
            // Namun agar saldo santri di DB berkurang tepat sebesar Non-Saku total (setelah saku dialokasikan),
            // AccountingService sudah menangani pergerakan saldo tersebut jika kita panggil recordTransaction.
            
            return $record;

            return $record;
        });
    }
}
