<?php

namespace Tests\Feature;

use App\Models\ConnectMonitor;
use App\Models\DiscoveryJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
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

    public function test_kpis_returns_availability_metrics(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'availability' => [
                    'ivr_availability_pct',
                    'number_reachability_pct',
                    'call_success_rate_pct',
                    'transfer_success_rate_pct',
                ],
            ]);
    }

    public function test_kpis_returns_operational_metrics(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'operational' => [
                    'active_discovery_jobs',
                    'active_connect_monitors',
                    'open_alerts',
                    'countries_monitored',
                ],
            ]);
    }

    public function test_kpis_returns_modules_list(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('modules', ['discovery', 'connect']);
    }

    public function test_kpis_calculates_ivr_availability_from_jobs(): void
    {
        DiscoveryJob::create([
            'name' => 'Test 1',
            'phone_number' => '+1234567890',
            'country_code' => 'US',
            'status' => 'completed',
        ]);
        DiscoveryJob::create([
            'name' => 'Test 2',
            'phone_number' => '+1234567891',
            'country_code' => 'US',
            'status' => 'completed',
        ]);
        DiscoveryJob::create([
            'name' => 'Test 3',
            'phone_number' => '+1234567892',
            'country_code' => 'US',
            'status' => 'pending',
        ]);
        DiscoveryJob::create([
            'name' => 'Test 4',
            'phone_number' => '+1234567893',
            'country_code' => 'US',
            'status' => 'failed',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('availability.ivr_availability_pct', 50.0);
    }

    public function test_kpis_calculates_zero_ivr_availability_when_no_jobs(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('availability.ivr_availability_pct', 0);
    }

    public function test_kpis_calculates_reachability_from_monitors(): void
    {
        ConnectMonitor::create([
            'name' => 'Monitor 1',
            'toll_free_number' => '18001111111',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);
        ConnectMonitor::create([
            'name' => 'Monitor 2',
            'toll_free_number' => '18002222222',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 80.0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('availability.number_reachability_pct', 90.0);
    }

    public function test_kpis_counts_active_discovery_jobs(): void
    {
        DiscoveryJob::create([
            'name' => 'Running 1',
            'phone_number' => '+1234567890',
            'country_code' => 'US',
            'status' => 'running',
        ]);
        DiscoveryJob::create([
            'name' => 'Running 2',
            'phone_number' => '+1234567891',
            'country_code' => 'US',
            'status' => 'running',
        ]);
        DiscoveryJob::create([
            'name' => 'Pending',
            'phone_number' => '+1234567892',
            'country_code' => 'US',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('operational.active_discovery_jobs', 2);
    }

    public function test_kpis_counts_active_connect_monitors(): void
    {
        ConnectMonitor::create([
            'name' => 'Active 1',
            'toll_free_number' => '18001111111',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);
        ConnectMonitor::create([
            'name' => 'Alert',
            'toll_free_number' => '18002222222',
            'country_code' => 'US',
            'status' => 'alert',
            'reachability_pct' => 70.0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('operational.active_connect_monitors', 1);
    }

    public function test_kpis_counts_open_alerts(): void
    {
        ConnectMonitor::create([
            'name' => 'Alert 1',
            'toll_free_number' => '18001111111',
            'country_code' => 'US',
            'status' => 'alert',
            'reachability_pct' => 70.0,
        ]);
        ConnectMonitor::create([
            'name' => 'Alert 2',
            'toll_free_number' => '18002222222',
            'country_code' => 'UK',
            'status' => 'alert',
            'reachability_pct' => 65.0,
        ]);
        ConnectMonitor::create([
            'name' => 'Active',
            'toll_free_number' => '18003333333',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 99.0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('operational.open_alerts', 2);
    }

    public function test_kpis_counts_distinct_countries(): void
    {
        ConnectMonitor::create([
            'name' => 'US 1',
            'toll_free_number' => '18001111111',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);
        ConnectMonitor::create([
            'name' => 'US 2',
            'toll_free_number' => '18002222222',
            'country_code' => 'US',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);
        ConnectMonitor::create([
            'name' => 'UK',
            'toll_free_number' => '448001111111',
            'country_code' => 'UK',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);
        ConnectMonitor::create([
            'name' => 'India',
            'toll_free_number' => '180018001800',
            'country_code' => 'IN',
            'status' => 'active',
            'reachability_pct' => 100.0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/dashboard/kpis');

        $response->assertStatus(200)
            ->assertJsonPath('operational.countries_monitored', 3);
    }

    public function test_kpis_requires_authentication(): void
    {
        $response = $this->getJson('/api/dashboard/kpis');

        $response->assertStatus(401);
    }
}
