<?php

return [
    'paths' => ['api/*', 'up'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', ''))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => true,
];
