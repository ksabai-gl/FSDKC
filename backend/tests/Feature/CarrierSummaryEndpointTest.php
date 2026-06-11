<?php

namespace Tests\Feature;

use App\Models\ConnectCheckResult;
use App\Models\ConnectMonitor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CarrierSummaryEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        ConnectMonitor::create([
            'name' => 'US Sales TFN',
            'toll_free_number' => '18005559999',
            'country_code' => 'US',
            'carrier' => 'Verizon',
            'status' => 'active',
            'reachability_pct' => 99.5,
        ]);

        ConnectMonitor::create([
            'name' => 'India Support',
            'toll_free_number' => '180018001800',
            'country_code' => 'IN',
            'carrier' => 'Airtel',
            'status' => 'alert',
            'reachability_pct' => 72.5,
        ]);

        ConnectMonitor::create([
            'name' => 'US Support TFN',
            'toll_free_number' => '18005551234',
            'country_code' => 'US',
            'carrier' => 'AT&T',
            'status' => 'active',
            'reachability_pct' => 95.0,
        ]);
    }

    public function test_carrier_summary_returns_all_monitors_without_filters(): void
    {
        $response = $this->getJson('/api/legacy/reports/carriers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['label', 'metric', 'region', 'source', 'monitor_id', 'carrier'],
                ],
                'total',
            ])
            ->assertJsonPath('total', 3);
    }

    public function test_carrier_summary_filters_by_country_code(): void
    {
        $response = $this->getJson('/api/legacy/reports/carriers?country_code=US');

        $response->assertStatus(200)
            ->assertJsonPath('total', 2);

        $data = $response->json('data');
        foreach ($data as $row) {
            $this->assertSame('US', $row['region']);
        }
    }

    public function test_carrier_summary_filters_by_carrier(): void
    {
        $response = $this->getJson('/api/legacy/reports/carriers?carrier=Verizon');

        $response->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.carrier', 'Verizon');
    }

    public function test_carrier_summary_filters_by_both_country_and_carrier(): void
    {
        $response = $this->getJson('/api/legacy/reports/carriers?country_code=US&carrier=Verizon');

        $response->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.label', 'US Sales TFN');
    }

    public function test_carrier_summary_returns_empty_for_nonexistent_filter(): void
    {
        $response = $this->getJson('/api/legacy/reports/carriers?country_code=XX');

        $response->assertStatus(200)
            ->assertJsonPath('total', 0)
            ->assertJsonPath('data', []);
    }

    public function test_carrier_summary_validates_country_code_max_length(): void
    {
        $response = $this->getJson('/api/legacy/reports/carriers?country_code=TOOLONG');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['country_code']);
    }

    public function test_carrier_summary_validates_carrier_max_length(): void
    {
        $longCarrier = str_repeat('A', 101);
        $response = $this->getJson("/api/legacy/reports/carriers?carrier={$longCarrier}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['carrier']);
    }

    public function test_carrier_summary_calculates_reachability_from_recent_checks(): void
    {
        $monitor = ConnectMonitor::first();

        for ($i = 0; $i < 10; $i++) {
            ConnectCheckResult::create([
                'connect_monitor_id' => $monitor->id,
                'reachable' => $i < 8,
                'latency_ms' => 200,
                'checked_at' => now()->subMinutes($i),
            ]);
        }

        $response = $this->getJson('/api/legacy/reports/carriers?country_code=US&carrier=Verizon');

        $response->assertStatus(200);
        $metric = $response->json('data.0.metric');
        $this->assertSame(80.0, $metric);
    }
}
