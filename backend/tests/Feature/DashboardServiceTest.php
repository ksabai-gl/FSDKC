<?php

namespace Tests\Feature;

use App\Models\ConnectMonitor;
use App\Models\DiscoveryJob;
use App\Services\DashboardService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

/**
 * DB-backed tests for the KPI aggregation extracted into DashboardService.
 *
 * Runs against an in-memory SQLite connection registered at runtime, so it needs
 * no MariaDB and no migrations (schema is created here to keep the test hermetic).
 *
 * Pipeline run: 20260611T131110_0vf8xp
 * Covers code-gen finding AC-B01 (KPI math moved out of the controller).
 */
class DashboardServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => false,
        ]);

        Schema::create('discovery_jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('connect_monitors', function (Blueprint $table): void {
            $table->id();
            $table->string('status')->default('active');
            $table->float('reachability_pct')->nullable();
            $table->string('country_code')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('discovery_jobs');
        Schema::dropIfExists('connect_monitors');
        parent::tearDown();
    }

    public function test_empty_database_yields_zeroed_kpis(): void
    {
        $kpis = (new DashboardService())->kpis();

        $this->assertSame(0, $kpis['availability']['ivr_availability_pct']);
        $this->assertSame(0.0, $kpis['availability']['number_reachability_pct']);
        $this->assertSame(0, $kpis['operational']['active_discovery_jobs']);
        $this->assertSame(0, $kpis['operational']['active_connect_monitors']);
        $this->assertSame(0, $kpis['operational']['open_alerts']);
        $this->assertSame(0, $kpis['operational']['countries_monitored']);
    }

    public function test_ivr_availability_is_completed_over_total(): void
    {
        DiscoveryJob::insert([
            ['status' => 'completed'],
            ['status' => 'completed'],
            ['status' => 'completed'],
            ['status' => 'running'],
        ]);

        $kpis = (new DashboardService())->kpis();

        // 3 of 4 completed = 75.0
        $this->assertSame(75.0, $kpis['availability']['ivr_availability_pct']);
        $this->assertSame(1, $kpis['operational']['active_discovery_jobs']);
    }

    public function test_reachability_average_is_rounded_to_one_decimal(): void
    {
        ConnectMonitor::insert([
            ['status' => 'active', 'reachability_pct' => 99.0, 'country_code' => 'US'],
            ['status' => 'alert', 'reachability_pct' => 80.0, 'country_code' => 'IE'],
        ]);

        $kpis = (new DashboardService())->kpis();

        // avg(99, 80) = 89.5
        $this->assertSame(89.5, $kpis['availability']['number_reachability_pct']);
    }

    public function test_operational_counts_and_distinct_countries(): void
    {
        ConnectMonitor::insert([
            ['status' => 'active', 'reachability_pct' => 99.0, 'country_code' => 'US'],
            ['status' => 'active', 'reachability_pct' => 98.0, 'country_code' => 'US'],
            ['status' => 'alert', 'reachability_pct' => 50.0, 'country_code' => 'IE'],
            ['status' => 'alert', 'reachability_pct' => 40.0, 'country_code' => 'GB'],
        ]);

        $kpis = (new DashboardService())->kpis();

        $this->assertSame(2, $kpis['operational']['active_connect_monitors']);
        $this->assertSame(2, $kpis['operational']['open_alerts']);
        $this->assertSame(3, $kpis['operational']['countries_monitored']);
    }

    public function test_placeholder_telephony_kpis_and_module_list_are_stable(): void
    {
        $kpis = (new DashboardService())->kpis();

        $this->assertSame(94.2, $kpis['availability']['call_success_rate_pct']);
        $this->assertSame(97.8, $kpis['availability']['transfer_success_rate_pct']);
        $this->assertSame(['discovery', 'connect'], $kpis['modules']);
    }
}
