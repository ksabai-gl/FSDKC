<?php

namespace App\Support;

use Illuminate\Support\Collection;

/**
 * Single source of truth for TFN reachability math and derived status.
 *
 * Replaces the duplicated success-rate formulas previously inlined in
 * ConnectController, LegacyReportController, and RealTimeTestService.
 */
class ReachabilityCalculator
{
    /** Reachability percentage at or below which a monitor is considered in alert. */
    public const ALERT_THRESHOLD_PCT = 90.0;

    /**
     * Reachability percentage (0–100) from a set of check results.
     *
     * Each result must expose a truthy/falsy `reachable` attribute. An empty
     * set is treated as fully reachable (100%) to match prior behavior.
     *
     * @param  Collection<int, mixed>  $checks
     */
    public function successRate(Collection $checks, int $precision = 2): float
    {
        $total = $checks->count();

        if ($total === 0) {
            return 100.0;
        }

        $reachable = $checks->where('reachable', true)->count();

        return round(($reachable / $total) * 100, $precision);
    }

    /**
     * Derive the operational status ("active" | "alert") from a reachability %.
     */
    public function status(float $reachabilityPct): string
    {
        return $reachabilityPct < self::ALERT_THRESHOLD_PCT ? 'alert' : 'active';
    }
}
