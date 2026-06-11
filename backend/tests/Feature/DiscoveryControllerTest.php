<?php

namespace Tests\Feature;

use App\Models\DiscoveryJob;
use App\Models\DiscoveryNode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DiscoveryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@klearcom.local',
            'password' => Hash::make('password123'),
        ]);

        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_index_returns_all_jobs(): void
    {
        DiscoveryJob::create([
            'name' => 'Job 1',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
            'status' => 'completed',
        ]);
        DiscoveryJob::create([
            'name' => 'Job 2',
            'phone_number' => '+448005556789',
            'country_code' => 'UK',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/discovery/jobs');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Job 2');
    }

    public function test_index_orders_by_created_at_desc(): void
    {
        $older = DiscoveryJob::create([
            'name' => 'Older Job',
            'phone_number' => '+18005551111',
            'country_code' => 'US',
            'status' => 'completed',
            'created_at' => now()->subDays(2),
        ]);

        $newer = DiscoveryJob::create([
            'name' => 'Newer Job',
            'phone_number' => '+18005552222',
            'country_code' => 'US',
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/discovery/jobs');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Newer Job')
            ->assertJsonPath('data.1.name', 'Older Job');
    }

    public function test_store_creates_new_job(): void
    {
        $payload = [
            'name' => 'Bank IVR Discovery',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
            'languages' => ['en', 'es'],
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/discovery/jobs', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Bank IVR Discovery')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.languages', ['en', 'es']);

        $this->assertDatabaseHas('discovery_jobs', [
            'name' => 'Bank IVR Discovery',
            'phone_number' => '+18005551234',
        ]);
    }

    public function test_store_defaults_languages_to_english(): void
    {
        $payload = [
            'name' => 'Test Job',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/discovery/jobs', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.languages', ['en']);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/discovery/jobs', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'phone_number', 'country_code']);
    }

    public function test_store_validates_name_max_length(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/discovery/jobs', [
                'name' => str_repeat('A', 256),
                'phone_number' => '+18005551234',
                'country_code' => 'US',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_show_returns_job_with_nodes(): void
    {
        $job = DiscoveryJob::create([
            'name' => 'Test Job',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
            'status' => 'completed',
        ]);

        DiscoveryNode::create([
            'discovery_job_id' => $job->id,
            'prompt_text' => 'Welcome prompt',
            'node_type' => 'root',
            'depth' => 0,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/discovery/jobs/{$job->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Test Job')
            ->assertJsonStructure([
                'data' => ['id', 'name', 'phone_number', 'status', 'nodes'],
                'transcripts',
                'diagnostics',
            ]);
    }

    public function test_show_returns_404_for_nonexistent_job(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/discovery/jobs/99999');

        $response->assertStatus(404);
    }

    public function test_tree_returns_hierarchical_node_structure(): void
    {
        $job = DiscoveryJob::create([
            'name' => 'Test Job',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
            'status' => 'completed',
        ]);

        $rootNode = DiscoveryNode::create([
            'discovery_job_id' => $job->id,
            'parent_id' => null,
            'prompt_text' => 'Welcome',
            'node_type' => 'root',
            'depth' => 0,
        ]);

        DiscoveryNode::create([
            'discovery_job_id' => $job->id,
            'parent_id' => $rootNode->id,
            'prompt_text' => 'Press 1',
            'dtmf_option' => '1',
            'node_type' => 'menu',
            'depth' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/discovery/jobs/{$job->id}/tree");

        $response->assertStatus(200)
            ->assertJsonPath('job_id', $job->id)
            ->assertJsonPath('job_name', 'Test Job')
            ->assertJsonPath('tree.0.prompt_text', 'Welcome')
            ->assertJsonPath('tree.0.children.0.prompt_text', 'Press 1');
    }

    public function test_tree_returns_404_for_nonexistent_job(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/discovery/jobs/99999/tree');

        $response->assertStatus(404);
    }

    public function test_start_returns_session_id(): void
    {
        $job = DiscoveryJob::create([
            'name' => 'Test Job',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson("/api/discovery/jobs/{$job->id}/start");

        $response->assertStatus(200)
            ->assertJsonStructure(['session_id', 'message']);

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $response->json('session_id')
        );
    }

    public function test_start_returns_409_if_already_running(): void
    {
        $job = DiscoveryJob::create([
            'name' => 'Test Job',
            'phone_number' => '+18005551234',
            'country_code' => 'US',
            'status' => 'running',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->postJson("/api/discovery/jobs/{$job->id}/start");

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Job already running');
    }

    public function test_start_returns_404_for_nonexistent_job(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/discovery/jobs/99999/start');

        $response->assertStatus(404);
    }

    public function test_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/discovery/jobs');
        $response->assertStatus(401);
    }

    public function test_store_requires_authentication(): void
    {
        $response = $this->postJson('/api/discovery/jobs', [
            'name' => 'Test',
            'phone_number' => '+1234567890',
            'country_code' => 'US',
        ]);
        $response->assertStatus(401);
    }
}
