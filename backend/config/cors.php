<?php

$allowedOrigins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000');
$origins = array_values(array_filter(array_map('trim', explode(',', $allowedOrigins))));

return [
    'paths' => ['api/*', 'up'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => $origins !== [] ? $origins : ['http://localhost:5173'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
