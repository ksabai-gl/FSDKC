<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ReachabilityCalculationTest extends TestCase
{
    public function test_calculate_reachability_with_all_successful(): void
    {
        $results = [true, true, true, true, true];
        $successCount = count(array_filter($results));
        $total = count($results);

        $rate = $total > 0 ? ($successCount / $total) * 100 : 100;

        $this->assertSame(100.0, $rate);
    }

    public function test_calculate_reachability_with_some_failures(): void
    {
        $results = [true, true, true, false, false];
        $successCount = count(array_filter($results));
        $total = count($results);

        $rate = $total > 0 ? ($successCount / $total) * 100 : 100;

        $this->assertSame(60.0, $rate);
    }

    public function test_calculate_reachability_with_all_failures(): void
    {
        $results = [false, false, false, false, false];
        $successCount = count(array_filter($results));
        $total = count($results);

        $rate = $total > 0 ? ($successCount / $total) * 100 : 100;

        $this->assertSame(0.0, $rate);
    }

    public function test_calculate_reachability_with_empty_results_defaults_to_100(): void
    {
        $results = [];
        $successCount = count(array_filter($results));
        $total = count($results);

        $rate = $total > 0 ? ($successCount / $total) * 100 : 100;

        $this->assertSame(100.0, $rate);
    }

    public function test_status_is_alert_when_below_90_percent(): void
    {
        $rate = 85.0;
        $status = $rate < 90 ? 'alert' : 'active';

        $this->assertSame('alert', $status);
    }

    public function test_status_is_active_when_at_90_percent(): void
    {
        $rate = 90.0;
        $status = $rate < 90 ? 'alert' : 'active';

        $this->assertSame('active', $status);
    }

    public function test_status_is_active_when_above_90_percent(): void
    {
        $rate = 95.5;
        $status = $rate < 90 ? 'alert' : 'active';

        $this->assertSame('active', $status);
    }

    public function test_reachability_rounds_to_two_decimal_places(): void
    {
        $results = [true, true, true, false];
        $successCount = count(array_filter($results));
        $total = count($results);

        $rate = round(($successCount / $total) * 100, 2);

        $this->assertSame(75.0, $rate);
    }

    /**
     * @dataProvider reachabilityDataProvider
     */
    public function test_reachability_calculation_with_data_provider(array $results, float $expectedRate): void
    {
        $successCount = count(array_filter($results));
        $total = count($results);
        $rate = $total > 0 ? ($successCount / $total) * 100 : 100;

        $this->assertSame($expectedRate, $rate);
    }

    public static function reachabilityDataProvider(): array
    {
        return [
            'all successful' => [[true, true, true, true, true], 100.0],
            'one failure' => [[true, true, true, true, false], 80.0],
            'half failures' => [[true, true, false, false], 50.0],
            'all failures' => [[false, false, false], 0.0],
            'single success' => [[true], 100.0],
            'single failure' => [[false], 0.0],
        ];
    }
}
