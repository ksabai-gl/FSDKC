<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class CorsConfigTest extends TestCase
{
    private array $config;

    protected function setUp(): void
    {
        parent::setUp();
        $this->config = require dirname(__DIR__, 2) . '/config/cors.php';
    }

    public function test_config_file_returns_an_array(): void
    {
        $this->assertIsArray($this->config);
    }

    public function test_paths_include_api_wildcard(): void
    {
        $this->assertContains('api/*', $this->config['paths']);
    }

    public function test_paths_include_sanctum_csrf_cookie_endpoint(): void
    {
        $this->assertContains('sanctum/csrf-cookie', $this->config['paths']);
    }

    public function test_supports_credentials_is_true_for_spa_auth(): void
    {
        $this->assertTrue($this->config['supports_credentials']);
    }

    public function test_allowed_origins_no_longer_wildcarded(): void
    {
        $this->assertNotContains('*', $this->config['allowed_origins']);
        $this->assertIsArray($this->config['allowed_origins']);
        $this->assertNotEmpty($this->config['allowed_origins']);
    }

    public function test_allowed_origins_contains_frontend_url_env_or_default(): void
    {
        $expected = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
        $this->assertContains($expected, $this->config['allowed_origins']);
    }

    public function test_allowed_methods_defaults_to_wildcard(): void
    {
        $this->assertSame(['*'], $this->config['allowed_methods']);
    }

    public function test_allowed_headers_defaults_to_wildcard(): void
    {
        $this->assertSame(['*'], $this->config['allowed_headers']);
    }
}
