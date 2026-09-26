<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\KoperasiMerchant;
use App\Models\Product;
use App\Models\Setting;
use App\Models\TransactionType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class KoperasiMobileApiTest extends TestCase
{
    use RefreshDatabase;

    protected string $apiKey = 'test-koperasi-api-key-12345';
    protected Product $product;
    protected Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Merchant with api key
        KoperasiMerchant::create([
            'name'         => 'Koperasi Unit 1',
            'api_key_hash' => Hash::make($this->apiKey),
            'is_active'    => true,
        ]);

        // 2. Product
        $this->product = Product::firstOrCreate(
            ['product_code' => 'TAB-WADIAH'],
            [
                'product_name'            => 'Tabungan Wadiah Santri',
                'product_type'            => 'Tabungan',
                'minimum_balance'         => 10000,
                'daily_withdrawal_limit'  => 50000,
                'is_active'               => true,
            ]
        );

        // 3. Account
        $this->account = Account::create([
            'account_number' => 'SANTRI99',
            'card_number'    => 'RFID-ABC-999',
            'customer_id'    => 1,
            'customer_name'  => 'Ahmad Santri',
            'product_id'     => $this->product->id,
            'balance'        => 100000,
            'status'         => 'AKTIF',
            'open_date'      => now()->toDateString(),
        ]);
    }

    public function test_can_get_koperasi_and_dapur_config(): void
    {
        $response = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->getJson('/api/koperasi/config');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'merchant',
                    'server_time',
                    'dapur_rules' => [
                        'prevent_double_tap',
                        'sessions',
                    ],
                ],
            ]);
    }

    public function test_can_check_account_by_nis_and_rfid(): void
    {
        // By NIS
        $resNis = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->getJson('/api/koperasi/check/SANTRI99?outlet_type=dapur');

        $resNis->assertStatus(200)
            ->assertJsonPath('data.account_number', 'SANTRI99')
            ->assertJsonPath('data.customer_name', 'Ahmad Santri')
            ->assertJsonPath('data.balance', 100000);

        // By RFID
        $resRfid = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->getJson('/api/koperasi/check/RFID-ABC-999?outlet_type=dapur');

        $resRfid->assertStatus(200)
            ->assertJsonPath('data.account_number', 'SANTRI99');
    }

    public function test_can_process_koperasi_debit_and_deducts_balance(): void
    {
        $response = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->postJson('/api/koperasi/debit', [
            'account_number'   => 'SANTRI99',
            'amount'           => 15000,
            'outlet_type'      => 'koperasi',
            'item_description' => 'Belanja ATK dan Buku',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.balance_after', 85000);

        $this->assertEquals(85000, (float) $this->account->fresh()->balance);
    }

    public function test_can_process_dapur_meal_debit_and_prevents_double_tap(): void
    {
        // Tap pertama berhasil
        $res1 = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->postJson('/api/koperasi/debit', [
            'identifier'   => 'RFID-ABC-999',
            'amount'       => 12000,
            'outlet_type'  => 'dapur',
            'meal_session' => 'siang',
        ]);

        $res1->assertStatus(201)
            ->assertJsonPath('status', 'success');

        // Tap kedua di sesi yang sama harus ditolak (Anti Double-Tap)
        $res2 = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->postJson('/api/koperasi/debit', [
            'identifier'   => 'RFID-ABC-999',
            'amount'       => 12000,
            'outlet_type'  => 'dapur',
            'meal_session' => 'siang',
        ]);

        $res2->assertStatus(422)
            ->assertJsonPath('code', 'ALREADY_TAPPED_THIS_SESSION');
    }

    public function test_rejects_debit_if_insufficient_balance_under_minimum(): void
    {
        // Balance 100.000, minimum_balance 10.000. Coba debit 95.000 (sisa 5.000 < minimum 10.000)
        $response = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
        ])->postJson('/api/koperasi/debit', [
            'account_number' => 'SANTRI99',
            'amount'         => 95000,
            'outlet_type'    => 'koperasi',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'INSUFFICIENT_BALANCE');
    }

    public function test_debit_records_cashier_audit_trail_and_activity_log(): void
    {
        $teller = User::factory()->create(['name' => 'Ustadz Ahmad Kasir']);
        $token = auth('api')->login($teller);

        $response = $this->withHeaders([
            'X-Koperasi-Key' => $this->apiKey,
            'Authorization'  => 'Bearer ' . $token,
        ])->postJson('/api/koperasi/debit', [
            'account_number'   => 'SANTRI99',
            'amount'           => 10000,
            'outlet_type'      => 'koperasi',
            'item_description' => 'Beli Kitab',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.cashier_name', 'Ustadz Ahmad Kasir')
            ->assertJsonPath('data.user_id', $teller->id);

        $this->assertDatabaseHas('koperasi_transactions', [
            'account_number' => 'SANTRI99',
            'user_id'        => $teller->id,
            'cashier_name'   => 'Ustadz Ahmad Kasir',
        ]);
    }
}
