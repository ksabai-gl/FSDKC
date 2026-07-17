<?php

$corsOrigins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000');
$parsedOrigins = array_values(array_filter(array_map('trim', explode(',', $corsOrigins))));

return [
    /*
    | When true, all /api/* routes (except health and token issuance) require a
    | valid Sanctum Bearer token. Set false for local demo without auth.
    */
    'auth_enabled' => (bool) env('KLEARCOM_AUTH_ENABLED', false),

    'cors_allowed_origins' => $parsedOrigins !== [] ? $parsedOrigins : ['http://localhost:5173'],

    'alert_threshold_pct' => (float) env('KLEARCOM_ALERT_THRESHOLD_PCT', 90),

    'recent_check_window' => (int) env('KLEARCOM_RECENT_CHECK_WINDOW', 20),

    'kpi_window_days' => (int) env('KLEARCOM_KPI_WINDOW_DAYS', 30),
];
