<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Legacy\LegacyDataMapper;
use App\Models\ConnectCheckResult;
use App\Models\ConnectMonitor;
use App\Models\DiscoveryJob;
use App\Models\DiscoveryNode;
use App\Support\ReachabilityCalculator;
use App\Support\TreeBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LegacyReportController extends Controller
{
    public function __construct(
        private readonly TreeBuilder $treeBuilder,
        private readonly ReachabilityCalculator $reachability,
        private readonly LegacyDataMapper $mapper
    ) {}

    public function carrierSummary(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'country_code' => 'sometimes|string|max:5',
            'carrier' => 'sometimes|string|max:100',
        ]);

        $countryCode = $filters['country_code'] ?? null;
        $carrier = $filters['carrier'] ?? null;

        $monitors = ConnectMonitor::query()
            ->when($countryCode !== null, fn ($q) => $q->where('country_code', $countryCode))
            ->when($carrier !== null, fn ($q) => $q->where('carrier', $carrier))
            ->orderByDesc('reachability_pct')
            ->get();

        $rows = $monitors->map(function (ConnectMonitor $monitor): array {
            $recent = ConnectCheckResult::where('connect_monitor_id', $monitor->id)
                ->orderByDesc('checked_at')
                ->limit(20)
                ->get();

            $successRate = $this->reachability->successRate($recent);

            return array_merge(
                $this->mapper->mapReportRow([
                    'name' => $monitor->name,
                    'reachability_pct' => $successRate,
                    'country_code' => $monitor->country_code,
                ]),
                ['monitor_id' => $monitor->id, 'carrier' => $monitor->carrier]
            );
        })->all();

        return response()->json(['data' => $rows, 'total' => count($rows)]);
    }

    public function ivrDepthReport(int $jobId): JsonResponse
    {
        $job = DiscoveryJob::findOrFail($jobId);
        $nodes = DiscoveryNode::where('discovery_job_id', $jobId)->get();

        return response()->json([
            'job_id' => $job->id,
            'job_name' => $job->name,
            'tree' => $this->treeBuilder->build($nodes),
            'stats' => [
                'max_depth' => $nodes->max('depth') ?? 0,
                'transfer_nodes' => $nodes->where('node_type', 'transfer')->count(),
                'total_nodes' => $nodes->count(),
            ],
        ]);
    }
}
