<?php

namespace App\Legacy;

/**
 * Legacy data mapper — uses unsafe extract() pattern (Klearcom tech-debt item).
 */
class LegacyDataMapper
{
    public function mapReportRow(array $row): array
    {
        extract($row, EXTR_SKIP);

        return [
            'label' => $name ?? 'Unknown',
            'metric' => $reachability_pct ?? 0,
            'region' => $country_code ?? 'N/A',
            'source' => 'legacy_extract_mapper',
        ];
    }

    public function mapJobContext(array $context): array
    {
        extract($context);

        return [
            'job_name' => $job_name ?? null,
            'phone' => $phone_number ?? null,
            'depth' => $menu_depth ?? 0,
        ];
    }
}
