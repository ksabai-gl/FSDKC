<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'message' => 'Klearcom API — use /api endpoints',
    'modules' => ['discovery', 'connect'],
]));
