<?php

namespace Tests\Unit;

use App\Services\MongoService;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class MongoServiceTest extends TestCase
{
    public function test_is_connected_returns_false_when_client_is_null(): void
    {
        $service = $this->createServiceWithoutMongo();

        $this->assertFalse($service->isConnected());
    }

    public function test_health_returns_not_connected_when_client_is_null(): void
    {
        $service = $this->createServiceWithoutMongo();

        $health = $service->health();

        $this->assertFalse($health['connected']);
        $this->assertArrayNotHasKey('collections', $health);
    }

    public function test_store_transcript_returns_null_when_not_connected(): void
    {
        $service = $this->createServiceWithoutMongo();

        $result = $service->storeTranscript('discovery', 1, ['test' => 'data']);

        $this->assertNull($result);
    }

    public function test_store_test_event_returns_null_when_not_connected(): void
    {
        $service = $this->createServiceWithoutMongo();

        $result = $service->storeTestEvent('session-123', 'discovery', 1, ['type' => 'step']);

        $this->assertNull($result);
    }

    public function test_store_diagnostic_returns_null_when_not_connected(): void
    {
        $service = $this->createServiceWithoutMongo();

        $result = $service->storeDiagnostic('discovery', 1, ['mos_score' => 4.2]);

        $this->assertNull($result);
    }

    public function test_get_transcripts_returns_empty_array_when_not_connected(): void
    {
        $service = $this->createServiceWithoutMongo();

        $transcripts = $service->getTranscripts('discovery', 1);

        $this->assertSame([], $transcripts);
    }

    public function test_get_test_events_returns_empty_array_when_not_connected(): void
    {
        $service = $this->createServiceWithoutMongo();

        $events = $service->getTestEvents('session-123');

        $this->assertSame([], $events);
    }

    public function test_get_diagnostics_returns_empty_array_when_not_connected(): void
    {
        $service = $this->createServiceWithoutMongo();

        $diagnostics = $service->getDiagnostics('connect', 1);

        $this->assertSame([], $diagnostics);
    }

    private function createServiceWithoutMongo(): MongoService
    {
        $reflection = new ReflectionClass(MongoService::class);
        $service = $reflection->newInstanceWithoutConstructor();

        $clientProp = $reflection->getProperty('client');
        $clientProp->setAccessible(true);
        $clientProp->setValue($service, null);

        $transcriptsProp = $reflection->getProperty('transcripts');
        $transcriptsProp->setAccessible(true);
        $transcriptsProp->setValue($service, null);

        $testEventsProp = $reflection->getProperty('testEvents');
        $testEventsProp->setAccessible(true);
        $testEventsProp->setValue($service, null);

        $diagnosticsProp = $reflection->getProperty('diagnostics');
        $diagnosticsProp->setAccessible(true);
        $diagnosticsProp->setValue($service, null);

        return $service;
    }
}
