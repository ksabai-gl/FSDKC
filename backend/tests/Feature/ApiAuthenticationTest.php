<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * MBA-49 — AC-D01 API authentication & access control.
 */
class ApiAuthenticationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('klearcom.auth_enabled', true);
    }

    public function test_health_endpoint_is_public_without_token(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk();
        $response->assertJsonPath('status', 'ok');
    }

    public function test_up_endpoint_is_public_without_token(): void
    {
        $response = $this->get('/up');

        $response->assertOk();
    }

    public function test_protected_discovery_jobs_returns_401_without_bearer_token(): void
    {
        $response = $this->getJson('/api/discovery/jobs');

        $response->assertUnauthorized();
        $response->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_mongodb_transcripts_returns_401_without_bearer_token(): void
    {
        $response = $this->getJson('/api/mongodb/transcripts');

        $response->assertUnauthorized();
    }

    public function test_dashboard_kpis_returns_401_without_bearer_token(): void
    {
        $response = $this->getJson('/api/dashboard/kpis');

        $response->assertUnauthorized();
    }

    public function test_auth_disabled_bypasses_middleware(): void
    {
        Config::set('klearcom.auth_enabled', false);

        $response = $this->getJson('/api/discovery/jobs');

        $response->assertOk();
    }

    public function test_token_endpoint_returns_bearer_token_for_valid_credentials(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@klearcom.local'],
            ['name' => 'Ops Admin', 'password' => 'password']
        );

        $response = $this->postJson('/api/auth/token', [
            'email' => 'admin@klearcom.local',
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['token', 'token_type']);
        $response->assertJson(['token_type' => 'Bearer']);
        $this->assertNotEmpty($response->json('token'));
    }

    public function test_token_endpoint_returns_401_for_invalid_credentials(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@klearcom.local'],
            ['name' => 'Ops Admin', 'password' => 'password']
        );

        $response = $this->postJson('/api/auth/token', [
            'email' => 'admin@klearcom.local',
            'password' => 'wrong-password',
        ]);

        $response->assertUnauthorized();
    }

    public function test_valid_bearer_token_allows_protected_route(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'tester@klearcom.local'],
            ['name' => 'Tester', 'password' => 'password']
        );

        $token = $user->createToken('mba-49-feature-test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/discovery/jobs');

        $response->assertOk();
    }

    public function test_access_token_query_param_authenticates_sse_compatible_requests(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'sse@klearcom.local'],
            ['name' => 'SSE User', 'password' => 'password']
        );

        $token = $user->createToken('mba-49-sse-test')->plainTextToken;

        $response = $this->getJson('/api/discovery/jobs?access_token='.$token);

        $response->assertOk();
    }
}
