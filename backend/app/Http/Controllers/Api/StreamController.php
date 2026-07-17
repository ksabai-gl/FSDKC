<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MongoService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StreamController extends Controller
{
    public function __construct(
        private readonly MongoService $mongo
    ) {}

    public function discoveryEvents(Request $request, int $id): StreamedResponse
    {
        $sessionId = $request->string('session_id')->toString();
        abort_if($sessionId === '', 400, 'session_id required');

        return $this->streamSession($sessionId);
    }

    public function connectEvents(Request $request, int $id): StreamedResponse
    {
        $sessionId = $request->string('session_id')->toString();
        abort_if($sessionId === '', 400, 'session_id required');

        return $this->streamSession($sessionId);
    }

    public function discoveryEventsPost(Request $request, int $id): StreamedResponse
    {
        $sessionId = trim((string) $request->input('session_id', ''));
        abort_if($sessionId === '', 400, 'session_id required');

        return $this->streamSession($sessionId);
    }

    public function connectEventsPost(Request $request, int $id): StreamedResponse
    {
        $sessionId = trim((string) $request->input('session_id', ''));
        abort_if($sessionId === '', 400, 'session_id required');

        return $this->streamSession($sessionId);
    }

    private function streamSession(string $sessionId): StreamedResponse
    {
        return response()->stream(function () use ($sessionId): void {
            $sent = 0;

            foreach ($this->mongo->getTestEvents($sessionId) as $event) {
                echo 'data: '.json_encode($event)."\n\n";
                ob_flush();
                flush();
                $sent++;
                if (($event['event']['type'] ?? '') === 'complete') {
                    return;
                }
            }

            $attempts = 0;
            while ($attempts < 60) {
                $events = $this->mongo->getTestEvents($sessionId);
                foreach (array_slice($events, $sent) as $event) {
                    echo 'data: '.json_encode($event)."\n\n";
                    ob_flush();
                    flush();
                    $sent++;
                    if (($event['event']['type'] ?? '') === 'complete') {
                        return;
                    }
                }
                usleep(500_000);
                $attempts++;
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
