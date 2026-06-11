<?php

namespace Tests\Unit\Support;

use App\Support\ReachabilityCalculator;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

/**
 * Deterministic unit tests for the centralized reachability math.
 *
 * Pipeline run: 20260611T131110_0vf8xp
 * Covers code-gen finding AC-B04 (de-duplicated reachability formula).
 */
class ReachabilityCalculatorTest extends TestCase
{
    private ReachabilityCalculator $calc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calc = new ReachabilityCalculator();
    }

    /** @return Collection<int, object> */
    private function checks(bool ...$reachable): Collection
    {
        return collect($reachable)->map(fn (bool $r): object => (object) ['reachable' => $r]);
    }

    public function test_empty_set_is_fully_reachable(): void
    {
        $this->assertSame(100.0, $this->calc->successRate(collect()));
    }

    public function test_all_reachable_is_100(): void
    {
        $this->assertSame(100.0, $this->calc->successRate($this->checks(true, true, true)));
    }

    public function test_none_reachable_is_0(): void
    {
        $this->assertSame(0.0, $this->calc->successRate($this->checks(false, false)));
    }

    public function test_partial_reachable_is_rounded(): void
    {
        // 2 of 3 reachable = 66.666... -> 66.67 at default precision 2
        $this->assertSame(66.67, $this->calc->successRate($this->checks(true, false, true)));
    }

    public function test_precision_is_respected(): void
    {
        $this->assertSame(66.7, $this->calc->successRate($this->checks(true, false, true), 1));
        $this->assertSame(67.0, $this->calc->successRate($this->checks(true, false, true), 0));
    }

    public function test_half_reachable_is_50(): void
    {
        $this->assertSame(50.0, $this->calc->successRate($this->checks(true, false)));
    }

    public function test_status_below_threshold_is_alert(): void
    {
        $this->assertSame('alert', $this->calc->status(89.99));
        $this->assertSame('alert', $this->calc->status(0.0));
    }

    public function test_status_at_threshold_is_active(): void
    {
        // Boundary: exactly ALERT_THRESHOLD_PCT (90.0) is NOT an alert.
        $this->assertSame('active', $this->calc->status(ReachabilityCalculator::ALERT_THRESHOLD_PCT));
    }

    public function test_status_above_threshold_is_active(): void
    {
        $this->assertSame('active', $this->calc->status(99.5));
        $this->assertSame('active', $this->calc->status(100.0));
    }
}
