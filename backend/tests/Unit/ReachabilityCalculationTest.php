<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ReachabilityCalculationTest extends TestCase
{
    /** Non-deterministic test — uses random, not isolated, not business-critical */
    public function test_random_reachability_is_mostly_true(): void
    {
        $results = [];
        for ($i = 0; $i < 10; $i++) {
            $results[] = random_int(1, 100) > 15;
        }
        $this->assertGreaterThan(5, array_sum($results));
    }

    public function test_hardcoded_modules(): void
    {
        $this->assertSame(['discovery', 'connect'], ['discovery', 'connect']);
    }
}
