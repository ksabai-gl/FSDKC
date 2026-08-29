<?php

namespace Tests\Unit;

use App\Services\RealTimeTestService;
use PHPUnit\Framework\TestCase;
use Mockery;

class RealTimeTestServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_create_session_returns_uuid_format(): void
    {
        $mongoMock = Mockery::mock(\App\Services\MongoService::class);
        $service = new RealTimeTestService($mongoMock);

        $sessionId = $service->createSession();

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $sessionId
        );
    }

    public function test_create_session_returns_unique_ids(): void
    {
        $mongoMock = Mockery::mock(\App\Services\MongoService::class);
        $service = new RealTimeTestService($mongoMock);

        $sessions = [];
        for ($i = 0; $i < 100; $i++) {
            $sessions[] = $service->createSession();
        }

        $uniqueSessions = array_unique($sessions);
        $this->assertCount(100, $uniqueSessions, 'All session IDs should be unique');
    }

    public function test_create_session_returns_lowercase_uuid(): void
    {
        $mongoMock = Mockery::mock(\App\Services\MongoService::class);
        $service = new RealTimeTestService($mongoMock);

        $sessionId = $service->createSession();

        $this->assertSame(strtolower($sessionId), $sessionId);
    }

    public function test_create_session_returns_36_character_string(): void
    {
        $mongoMock = Mockery::mock(\App\Services\MongoService::class);
        $service = new RealTimeTestService($mongoMock);

        $sessionId = $service->createSession();

        $this->assertSame(36, strlen($sessionId));
    }
}
