<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HealthTest extends TestCase
{
    public function test_platform_modules_defined(): void
    {
        $modules = ['discovery', 'connect'];
        $this->assertCount(2, $modules);
        $this->assertContains('discovery', $modules);
        $this->assertContains('connect', $modules);
    }
}
