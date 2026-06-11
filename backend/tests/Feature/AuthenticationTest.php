<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@klearcom.local',
            'password' => Hash::make('password123'),
        ]);
    }

    public function test_health_endpoint_is_public(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok');
    }

    public function test_mongodb_status_is_public(): void
    {
        $response = $this->getJson('/api/mongodb/status');

        $response->assertStatus(200);
    }

    public function test_protected_routes_require_authentication(): void
    {
        $protectedRoutes = [
            ['GET', '/api/dashboard/kpis'],
            ['GET', '/api/discovery/jobs'],
            ['GET', '/api/connect/monitors'],
            ['GET', '/api/legacy/reports/carriers'],
        ];

        foreach ($protectedRoutes as [$method, $route]) {
            $response = $this->json($method, $route);
            $response->assertStatus(401, "Route {$route} should require authentication");
        }
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@klearcom.local',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token',
                'token_type',
            ])
            ->assertJsonPath('token_type', 'Bearer');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@klearcom.local',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_fails_with_nonexistent_user(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@klearcom.local',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_access_protected_routes(): void
    {
        $token = $this->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->getJson('/api/dashboard/kpis');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_get_current_user(): void
    {
        $token = $this->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->getJson('/api/auth/user');

        $response->assertStatus(200)
            ->assertJsonPath('user.email', 'test@klearcom.local');
    }

    public function test_user_can_logout(): void
    {
        $token = $this->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Successfully logged out');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_user_can_list_tokens(): void
    {
        $this->user->createToken('token-1');
        $this->user->createToken('token-2');
        $activeToken = $this->user->createToken('active-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$activeToken}",
        ])->getJson('/api/auth/tokens');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'tokens');
    }

    public function test_user_can_revoke_specific_token(): void
    {
        $token1 = $this->user->createToken('token-1');
        $activeToken = $this->user->createToken('active-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$activeToken}",
        ])->deleteJson("/api/auth/tokens/{$token1->accessToken->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Token revoked');

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }
}
