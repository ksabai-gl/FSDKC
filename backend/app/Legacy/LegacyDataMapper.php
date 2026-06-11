<?php

namespace App\Legacy;

/**
 * Maps raw row/context arrays into report-friendly shapes.
 *
 * Uses explicit array access (no extract()) per the project AGENTS.md convention.
 */
class LegacyDataMapper
{
    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public function mapReportRow(array $row): array
    {
        return [
            'label' => $row['name'] ?? 'Unknown',
            'metric' => $row['reachability_pct'] ?? 0,
            'region' => $row['country_code'] ?? 'N/A',
            'source' => 'legacy_mapper',
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function mapJobContext(array $context): array
    {
        return [
            'job_name' => $context['job_name'] ?? null,
            'phone' => $context['phone_number'] ?? null,
            'depth' => $context['menu_depth'] ?? 0,
        ];
    }
}
