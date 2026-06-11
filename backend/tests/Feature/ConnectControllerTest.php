<?php

namespace Tests\Feature;

use App\Models\ConnectCheckResult;
use App\Models\ConnectMonitor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConnectControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@klearcom.local',
            'password' => Hash::make('password123'),
        ]);

        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_index_returns_all_monitors(): void
    {
        ConnectMonitor::create([
            'name' => 'US Sales',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 99.5,
        ]);
        ConnectMonitor::create([
            'name' => 'UK Support',
            'toll_free_number' => '448005556789',
            'country_code' => 'UK',
            'status' => 'alert',
            'reachability_pct' => 75.0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/connect/monitors');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_index_orders_by_last_checked_at_desc(): void
    {
        ConnectMonitor::create([
            'name' => 'Older',
            'toll_free_number' => '18005551111',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100,
            'last_checked_at' => now()->subHours(2),
        ]);
        ConnectMonitor::create([
            'name' => 'Newer',
            'toll_free_number' => '18005552222',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100,
            'last_checked_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/connect/monitors');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Newer');
    }

    public function test_store_creates_new_monitor(): void
    {
        $payload = [
            'name' => 'New TFN Monitor',
            'toll_free_number' => '18005559999',
            'country_code' => 'US',
            'carrier' => 'Verizon',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/connect/monitors', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'New TFN Monitor')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.reachability_pct', 100.0);

        $this->assertDatabaseHas('connect_monitors', [
            'name' => 'New TFN Monitor',
            'toll_free_number' => '18005559999',
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/connect/monitors', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'toll_free_number', 'country_code']);
    }

    public function test_store_allows_null_carrier(): void
    {
        $payload = [
            'name' => 'Test Monitor',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/connect/monitors', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.carrier', null);
    }

    public function test_show_returns_monitor_with_check_results(): void
    {
        $monitor = ConnectMonitor::create([
            'name' => 'Test Monitor',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 99.0,
        ]);

        ConnectCheckResult::create([
            'connect_monitor_id' => $monitor->id,
            'reachable' => true,
            'latency_ms' => 230,
            'checked_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/connect/monitors/{$monitor->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Test Monitor')
            ->assertJsonStructure([
                'data' => ['id', 'name', 'toll_free_number', 'status', 'reachability_pct', 'check_results'],
                'transcripts',
                'diagnostics',
            ]);
    }

    public function test_show_returns_404_for_nonexistent_monitor(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/connect/monitors/99999');

        $response->assertStatus(404);
    }

    public function test_checks_returns_check_history(): void
    {
        $monitor = ConnectMonitor::create([
            'name' => 'Test Monitor',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 80.0,
        ]);

        for ($i = 0; $i < 5; $i++) {
            ConnectCheckResult::create([
                'connect_monitor_id' => $monitor->id,
                'reachable' => $i < 4,
                'latency_ms' => $i < 4 ? 200 + ($i * 10) : null,
                'failure_reason' => $i >= 4 ? 'Timeout' : null,
                'checked_at' => now()->subMinutes($i),
            ]);
        }

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/connect/monitors/{$monitor->id}/checks");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'monitor' => ['id', 'name', 'toll_free_number', 'country_code'],
                'data',
                'computed' => ['reachability_pct', 'status'],
            ])
            ->assertJsonCount(5, 'data');
    }

    public function test_checks_computes_reachability_from_recent(): void
    {
        $monitor = ConnectMonitor::create([
            'name' => 'Test Monitor',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);

        for ($i = 0; $i < 10; $i++) {
            ConnectCheckResult::create([
                'connect_monitor_id' => $monitor->id,
                'reachable' => $i < 8,
                'latency_ms' => $i < 8 ? 200 : null,
                'checked_at' => now()->subMinutes($i),
            ]);
        }

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/connect/monitors/{$monitor->id}/checks");

        $response->assertStatus(200)
            ->assertJsonPath('computed.reachability_pct', 80.0)
            ->assertJsonPath('computed.status', 'alert');
    }

    public function test_checks_returns_active_status_when_above_90_percent(): void
    {
        $monitor = ConnectMonitor::create([
            'name' => 'Test Monitor',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);

        for ($i = 0; $i < 10; $i++) {
            ConnectCheckResult::create([
                'connect_monitor_id' => $monitor->id,
                'reachable' => $i < 9,
                'latency_ms' => $i < 9 ? 200 : null,
                'checked_at' => now()->subMinutes($i),
            ]);
        }

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/connect/monitors/{$monitor->id}/checks");

        $response->assertStatus(200)
            ->assertJsonPath('computed.reachability_pct', 90.0)
            ->assertJsonPath('computed.status', 'active');
    }

    public function test_run_check_returns_session_id(): void
    {
        $monitor = ConnectMonitor::create([
            'name' => 'Test Monitor',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson("/api/connect/monitors/{$monitor->id}/run-check");

        $response->assertStatus(200)
            ->assertJsonStructure(['session_id', 'message']);

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $response->json('session_id')
        );
    }

    public function test_run_check_returns_404_for_nonexistent_monitor(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/connect/monitors/99999/run-check');

        $response->assertStatus(404);
    }

    public function test_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/connect/monitors');
        $response->assertStatus(401);
    }

    public function test_store_requires_authentication(): void
    {
        $response = $this->postJson('/api/connect/monitors', [
            'name' => 'Test',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
        ]);
        $response->assertStatus(401);
    }
}
