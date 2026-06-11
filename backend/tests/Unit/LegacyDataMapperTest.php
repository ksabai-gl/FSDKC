<?php

namespace Tests\Unit;

use App\Legacy\LegacyDataMapper;
use PHPUnit\Framework\TestCase;

class LegacyDataMapperTest extends TestCase
{
    private LegacyDataMapper $mapper;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mapper = new LegacyDataMapper();
    }

    public function test_map_report_row_with_complete_data(): void
    {
        $row = [
            'name' => 'US Sales TFN',
            'reachability_pct' => 99.5,
            'country_code' => 'US',
        ];

        $result = $this->mapper->mapReportRow($row);

        $this->assertSame('US Sales TFN', $result['label']);
        $this->assertSame(99.5, $result['metric']);
        $this->assertSame('US', $result['region']);
        $this->assertSame('legacy_extract_mapper', $result['source']);
    }

    public function test_map_report_row_with_missing_fields_uses_defaults(): void
    {
        $row = [];

        $result = $this->mapper->mapReportRow($row);

        $this->assertSame('Unknown', $result['label']);
        $this->assertSame(0, $result['metric']);
        $this->assertSame('N/A', $result['region']);
    }

    public function test_map_report_row_with_partial_data(): void
    {
        $row = ['name' => 'Test Monitor'];

        $result = $this->mapper->mapReportRow($row);

        $this->assertSame('Test Monitor', $result['label']);
        $this->assertSame(0, $result['metric']);
        $this->assertSame('N/A', $result['region']);
    }

    public function test_map_job_context_with_complete_data(): void
    {
        $context = [
            'job_name' => 'Bank IVR Discovery',
            'phone_number' => '+18005551234',
            'menu_depth' => 4,
        ];

        $result = $this->mapper->mapJobContext($context);

        $this->assertSame('Bank IVR Discovery', $result['job_name']);
        $this->assertSame('+18005551234', $result['phone']);
        $this->assertSame(4, $result['depth']);
    }

    public function test_map_job_context_with_missing_fields_uses_defaults(): void
    {
        $context = [];

        $result = $this->mapper->mapJobContext($context);

        $this->assertNull($result['job_name']);
        $this->assertNull($result['phone']);
        $this->assertSame(0, $result['depth']);
    }

    public function test_map_job_context_with_zero_depth(): void
    {
        $context = [
            'job_name' => 'Shallow IVR',
            'phone_number' => '+1234567890',
            'menu_depth' => 0,
        ];

        $result = $this->mapper->mapJobContext($context);

        $this->assertSame(0, $result['depth']);
    }
}
