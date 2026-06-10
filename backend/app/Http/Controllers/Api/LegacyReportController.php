<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Legacy\LegacyDataMapper;
use App\Models\ConnectCheckResult;
use App\Models\ConnectMonitor;
use App\Models\DiscoveryJob;
use App\Models\DiscoveryNode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Fat controller — business logic, DB queries, and KPI math live here (anti-pattern).
 */
class LegacyReportController extends Controller
{
    public function carrierSummary(Request $request): JsonResponse
    {
        $filters = $request->all();
        extract($filters);

        $monitors = ConnectMonitor::query()
            ->when(isset($country_code), fn ($q) => $q->where('country_code', $country_code))
            ->when(isset($carrier), fn ($q) => $q->where('carrier', $carrier))
            ->orderByDesc('reachability_pct')
            ->get();

        $rows = [];
        $mapper = new LegacyDataMapper();

        foreach ($monitors as $monitor) {
            $recent = ConnectCheckResult::where('connect_monitor_id', $monitor->id)
                ->orderByDesc('checked_at')
                ->limit(20)
                ->get();

            $successRate = $recent->count() > 0
                ? ($recent->where('reachable', true)->count() / $recent->count()) * 100
                : 100;

            $rows[] = array_merge(
                $mapper->mapReportRow([
                    'name' => $monitor->name,
                    'reachability_pct' => round($successRate, 2),
                    'country_code' => $monitor->country_code,
                ]),
                ['monitor_id' => $monitor->id, 'carrier' => $monitor->carrier]
            );
        }

        return response()->json(['data' => $rows, 'total' => count($rows)]);
    }

    public function ivrDepthReport(int $jobId): JsonResponse
    {
        $job = DiscoveryJob::findOrFail($jobId);
        $nodes = DiscoveryNode::where('discovery_job_id', $jobId)->get();

        $tree = $this->buildTree($nodes);
        $maxDepth = $nodes->max('depth') ?? 0;
        $transferCount = $nodes->where('node_type', 'transfer')->count();

        return response()->json([
            'job_id' => $job->id,
            'job_name' => $job->name,
            'tree' => $tree,
            'stats' => [
                'max_depth' => $maxDepth,
                'transfer_nodes' => $transferCount,
                'total_nodes' => $nodes->count(),
            ],
        ]);
    }

    /** Duplicate of DiscoveryController::buildTree — copy-paste debt */
    private function buildTree($nodes, ?int $parentId = null): array
    {
        return $nodes
            ->where('parent_id', $parentId)
            ->map(fn (DiscoveryNode $node) => [
                'id' => $node->id,
                'prompt_text' => $node->prompt_text,
                'dtmf_option' => $node->dtmf_option,
                'node_type' => $node->node_type,
                'depth' => $node->depth,
                'children' => $this->buildTree($nodes, $node->id),
            ])
            ->values()
            ->all();
    }
}
