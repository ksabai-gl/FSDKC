<?php

namespace Tests\Unit;

use Tests\TestCase;

/**
 * MBA-49 — AC-D01 CORS allow-list (no wildcard).
 */
class CorsConfigurationTest extends TestCase
{
    public function test_cors_allowed_origins_does_not_include_wildcard(): void
    {
        $origins = config('cors.allowed_origins');

        $this->assertIsArray($origins);
        $this->assertNotContains('*', $origins);
        $this->assertNotEmpty($origins);
    }

    public function test_klearcom_cors_origins_match_platform_config(): void
    {
        $this->assertSame(
            config('klearcom.cors_allowed_origins'),
            config('cors.allowed_origins')
        );
    }
}
