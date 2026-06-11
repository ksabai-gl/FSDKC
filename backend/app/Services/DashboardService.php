<?php

namespace App\Services;

use App\Models\ConnectMonitor;
use App\Models\DiscoveryJob;

/**
 * Aggregates cross-module KPIs for the dashboard.
 *
 * Extracted from DashboardController so the controller only orchestrates the
 * HTTP response and all KPI math lives in one testable place.
 */
class DashboardService
{
    /**
     * Placeholder telephony KPIs not yet sourced from live telemetry.
     * Kept as named constants so they are discoverable and easy to wire up later.
     */
    private const PLACEHOLDER_CALL_SUCCESS_RATE_PCT = 94.2;
    private const PLACEHOLDER_TRANSFER_SUCCESS_RATE_PCT = 97.8;

    /**
     * @return array<string, mixed>
     */
    public function kpis(): array
    {
        $discoveryTotal = DiscoveryJob::count();
        $discoveryCompleted = DiscoveryJob::where('status', 'completed')->count();
        $avgReachability = (float) (ConnectMonitor::avg('reachability_pct') ?? 0);

        return [
            'availability' => [
                'ivr_availability_pct' => $discoveryTotal > 0
                    ? round(($discoveryCompleted / $discoveryTotal) * 100, 1)
                    : 0,
                'number_reachability_pct' => round($avgReachability, 1),
                'call_success_rate_pct' => self::PLACEHOLDER_CALL_SUCCESS_RATE_PCT,
                'transfer_success_rate_pct' => self::PLACEHOLDER_TRANSFER_SUCCESS_RATE_PCT,
            ],
            'operational' => [
                'active_discovery_jobs' => DiscoveryJob::where('status', 'running')->count(),
                'active_connect_monitors' => ConnectMonitor::where('status', 'active')->count(),
                'open_alerts' => ConnectMonitor::where('status', 'alert')->count(),
                'countries_monitored' => ConnectMonitor::distinct('country_code')->count('country_code'),
            ],
            'modules' => ['discovery', 'connect'],
        ];
    }
}
