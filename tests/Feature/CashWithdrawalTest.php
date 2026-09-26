<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Product;
use App\Models\TransactionType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $productSantri;
    protected $productInstansi;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        // Setup Transaction Type WDR-SANTRI
        TransactionType::firstOrCreate(
            ['code' => 'WDR-SANTRI'],
            [
                'name' => 'Penarikan Tabungan',
                'description' => 'Penarikan tunai saldo santri',
                'category' => 'cash_operation',
                'is_debit' => 0,
                'is_credit' => 0,
                'is_active' => 1,
            ]
        );

        $this->productSantri = Product::create([
            'product_code' => 'TAB-SAN',
            'product_name' => 'Tabungan Santri',
            'product_type' => 'Tabungan',
            'opening_fee' => 0,
            'minimum_balance' => 10000,
            'daily_withdrawal_limit' => 50000,
            'is_active' => true,
        ]);

        $this->productInstansi = Product::create([
            'product_code' => 'GIRO-INS',
            'product_name' => 'Giro Instansi',
            'product_type' => 'Tabungan',
            'opening_fee' => 0,
            'minimum_balance' => 0,
            'daily_withdrawal_limit' => null, // no limit
            'is_active' => true,
        ]);
    }

    public function test_cash_withdrawal_success_and_updates_balance()
    {
        $account = Account::create([
            'account_number' => '1001',
            'customer_id' => 123,
            'customer_name' => 'Ahmad Santri',
            'product_id' => $this->productSantri->id,
            'balance' => 100000,
            'status' => 'AKTIF',
            'open_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->user, 'api')->postJson('/api/main/transaction/cash-withdrawal', [
            'account_number' => '1001',
            'amount' => 20000,
            'description' => 'Uang jajan',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'balance_before' => 100000,
                'balance_after' => 80000,
                'remaining_quota' => 30000,
            ]
        ]);

        $this->assertEquals(80000, $account->fresh()->balance);
    }

    public function test_cash_withdrawal_rejected_when_insufficient_balance()
    {
        $account = Account::create([
            'account_number' => '1002',
            'customer_id' => 124,
            'customer_name' => 'Budi Santri',
            'product_id' => $this->productSantri->id,
            'balance' => 25000,
            'status' => 'AKTIF',
            'open_date' => now()->toDateString(),
        ]);

        // Trying to withdraw 20000 with minimum balance 10000 would leave 5000 (< 10000)
        $response = $this->actingAs($this->user, 'api')->postJson('/api/main/transaction/cash-withdrawal', [
            'account_number' => '1002',
            'amount' => 20000,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'status' => 'error',
        ]);
        $this->assertStringContainsString('tidak mencukupi', $response->json('message'));
        $this->assertEquals(25000, $account->fresh()->balance);
    }

    public function test_cash_withdrawal_rejected_when_exceeding_daily_limit()
    {
        $account = Account::create([
            'account_number' => '1003',
            'customer_id' => 125,
            'customer_name' => 'Citra Santri',
            'product_id' => $this->productSantri->id,
            'balance' => 200000,
            'status' => 'AKTIF',
            'open_date' => now()->toDateString(),
        ]);

        // Daily limit is 50000, trying to withdraw 60000
        $response = $this->actingAs($this->user, 'api')->postJson('/api/main/transaction/cash-withdrawal', [
            'account_number' => '1003',
            'amount' => 60000,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('limit harian', $response->json('message'));
        $this->assertEquals(200000, $account->fresh()->balance);
    }

    public function test_instansi_withdrawal_not_restricted_by_santri_limit()
    {
        $account = Account::create([
            'account_number' => 'INS-001',
            'customer_id' => 0, // Instansi
            'customer_name' => 'Koperasi Pusat',
            'product_id' => $this->productInstansi->id,
            'balance' => 5000000,
            'status' => 'AKTIF',
            'open_date' => now()->toDateString(),
        ]);

        // Instansi can withdraw 1,000,000 freely
        $response = $this->actingAs($this->user, 'api')->postJson('/api/main/transaction/cash-withdrawal', [
            'account_number' => 'INS-001',
            'amount' => 1000000,
            'description' => 'Operasional kas',
        ]);

        $response->assertStatus(201);
        $this->assertEquals(4000000, $account->fresh()->balance);
    }
}
