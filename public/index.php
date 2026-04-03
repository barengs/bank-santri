<?php

// Handle Preflight (OPTIONS) requests for CORS
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // LOGGING: Check if this file is created in your 'public' folder to verify if hit
    file_put_contents(__DIR__ . '/cors_debug.txt', date('Y-m-d H:i:s') . " - OPTIONS " . ($_SERVER['HTTP_ORIGIN'] ?? 'NO_ORIGIN') . " " . ($_SERVER['REQUEST_URI'] ?? 'NO_URI') . "\n", FILE_APPEND);
    
    header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: *'); // Allow all headers
    header('Access-Control-Allow-Credentials: true');
    header('HTTP/1.1 200 OK');
    die();
}

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
