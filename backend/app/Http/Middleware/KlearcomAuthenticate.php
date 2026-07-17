<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class KlearcomAuthenticate
{
    public function __construct(
        private readonly Authenticate $authenticate
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('klearcom.auth_enabled')) {
            return $next($request);
        }

        if (! $request->bearerToken() && $request->query('access_token')) {
            $request->headers->set('Authorization', 'Bearer '.$request->query('access_token'));
        }

        try {
            return $this->authenticate->handle($request, $next, 'sanctum');
        } catch (AuthenticationException) {
            Log::info('Klearcom API auth failure', [
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
    }
}
