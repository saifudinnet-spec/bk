<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback untuk melayani file storage publik jika symlink public/storage belum dibuat / terputus di web server
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!File::exists($filePath)) {
        abort(404);
    }
    return response()->file($filePath);
})->where('path', '.*');

