<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HealthTest extends TestCase
{
    private const PLATFORM_MODULES = ['discovery', 'connect'];

    public function test_platform_modules_are_defined(): void
    {
        $this->assertCount(2, self::PLATFORM_MODULES);
    }

    public function test_discovery_module_exists(): void
    {
        $this->assertContains('discovery', self::PLATFORM_MODULES);
    }

    public function test_connect_module_exists(): void
    {
        $this->assertContains('connect', self::PLATFORM_MODULES);
    }

    public function test_modules_are_lowercase(): void
    {
        foreach (self::PLATFORM_MODULES as $module) {
            $this->assertSame(strtolower($module), $module, "Module '{$module}' should be lowercase");
        }
    }

    public function test_modules_have_no_duplicates(): void
    {
        $unique = array_unique(self::PLATFORM_MODULES);
        $this->assertCount(count(self::PLATFORM_MODULES), $unique);
    }
}
