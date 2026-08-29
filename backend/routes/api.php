<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConnectController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\LegacyReportController;
use App\Http\Controllers\Api\MongoController;
use App\Http\Controllers\Api\StreamController;
use App\Services\MongoService;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (No Authentication Required)
|--------------------------------------------------------------------------
*/

Route::get('/health', function (MongoService $mongo) {
    return response()->json([
        'status' => 'ok',
        'platform' => 'Klearcom',
        'version' => '1.0.0',
        'mongodb' => $mongo->health(),
    ]);
});

Route::get('/mongodb/status', [MongoController::class, 'status']);

Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Authentication Required)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function (): void {
    // Auth management
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::get('/auth/tokens', [AuthController::class, 'tokens']);
    Route::delete('/auth/tokens/{tokenId}', [AuthController::class, 'revokeToken']);

    // MongoDB diagnostics
    Route::get('/mongodb/transcripts', [MongoController::class, 'transcripts']);
    Route::get('/mongodb/diagnostics/{module}/{referenceId}', [MongoController::class, 'diagnostics']);

    // Dashboard
    Route::get('/dashboard/kpis', [DashboardController::class, 'kpis']);

    // Legacy reports
    Route::prefix('legacy')->group(function (): void {
        Route::get('/reports/carriers', [LegacyReportController::class, 'carrierSummary']);
        Route::get('/reports/ivr/{jobId}', [LegacyReportController::class, 'ivrDepthReport']);
    });

    // Discovery module
    Route::prefix('discovery')->group(function (): void {
        Route::get('/jobs', [DiscoveryController::class, 'index']);
        Route::post('/jobs', [DiscoveryController::class, 'store']);
        Route::get('/jobs/{id}', [DiscoveryController::class, 'show']);
        Route::get('/jobs/{id}/tree', [DiscoveryController::class, 'tree']);
        Route::post('/jobs/{id}/start', [DiscoveryController::class, 'start']);
        Route::get('/jobs/{id}/stream', [StreamController::class, 'discoveryEvents']);
    });

    // Connect module
    Route::prefix('connect')->group(function (): void {
        Route::get('/monitors', [ConnectController::class, 'index']);
        Route::post('/monitors', [ConnectController::class, 'store']);
        Route::get('/monitors/{id}', [ConnectController::class, 'show']);
        Route::get('/monitors/{id}/checks', [ConnectController::class, 'checks']);
        Route::post('/monitors/{id}/run-check', [ConnectController::class, 'runCheck']);
        Route::get('/monitors/{id}/stream', [StreamController::class, 'connectEvents']);
    });
});
