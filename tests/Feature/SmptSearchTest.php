<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmptSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_smpt_search_success_with_internal_key()
    {
        $user = User::factory()->create();

        Http::fake([
            '*/api/main/student*' => Http::response([
                'status' => 'success',
                'message' => 'data ditemukan',
                'data' => [
                    'current_page' => 1,
                    'data' => [
                        [
                            'id' => 1,
                            'nis' => '1001',
                            'first_name' => 'Ahmad',
                            'last_name' => 'Santri',
                        ]
                    ],
                ]
            ], 200)
        ]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/main/account/smpt-search?search=Ahmad');

        $response->assertStatus(200);
        $response->assertJsonPath('data.data.0.nis', '1001');

        // Verify that X-Internal-Key header was sent
        Http::assertSent(function ($request) {
            return $request->hasHeader('X-Internal-Key');
        });
    }

    public function test_smpt_search_handles_error_gracefully()
    {
        $user = User::factory()->create();

        Http::fake([
            '*/api/main/student*' => Http::response([
                'status' => 'error',
                'message' => 'Server error in SMPT'
            ], 500)
        ]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/main/account/smpt-search?search=Fail');

        $response->assertStatus(500);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Server error in SMPT'
        ]);
    }
}
