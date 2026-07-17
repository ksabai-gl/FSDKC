<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * MBA-49 — Klearcom auth decision logic (AC-D01).
 */
class KlearcomAuthLogicTest extends TestCase
{
    private function shouldAllow(bool $authEnabled, ?string $token): bool
    {
        if (! $authEnabled) {
            return true;
        }

        return $token !== null && $token !== '';
    }

    public function test_allows_request_when_auth_disabled(): void
    {
        $this->assertTrue($this->shouldAllow(false, null));
    }

    public function test_rejects_missing_token_when_auth_enabled(): void
    {
        $this->assertFalse($this->shouldAllow(true, null));
        $this->assertFalse($this->shouldAllow(true, ''));
    }

    public function test_allows_present_token_when_auth_enabled(): void
    {
        $this->assertTrue($this->shouldAllow(true, 'valid-token'));
    }
}
