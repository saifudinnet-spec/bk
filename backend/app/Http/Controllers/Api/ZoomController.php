<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingSession;
use App\Services\AuditLogService;
use App\Services\ZoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ZoomController extends Controller
{
    /**
     * Generate Zoom Meeting SDK signature for verified participant
     */
    public function getSignature(Request $request)
    {
        $request->validate([
            'session_id' => 'required|exists:counseling_sessions,id',
            'force_test' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $session = CounselingSession::with(['counselingCase', 'user', 'tutor'])
            ->findOrFail($request->input('session_id'));

        try {
            $forceTest = $request->boolean('force_test');
            $data = ZoomService::generateSignature($user, $session, $forceTest);

            // Audit log join attempt
            AuditLogService::log('join_session', 'CounselingSession', (string)$session->id, [
                'role' => $user->role,
                'is_mock' => $data['is_mock'],
            ], $user->id);

            return response()->json([
                'status' => 'success',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Post a WebRTC signaling message (relay between laptops on same network/WiFi)
     */
    public function postSignal(Request $request)
    {
        $request->validate([
            'session_id' => 'required',
            'type' => 'required|string',
            'sender' => 'required|string',
        ]);

        $sessionId = (string)$request->input('session_id');
        $cacheKey = "zoom_signals_{$sessionId}";

        $signals = Cache::get($cacheKey, []);
        $now = microtime(true);
        // Keep only recent signals within 3 minutes
        $signals = array_filter($signals, fn($s) => ($now - ($s['time'] ?? 0)) < 180);

        $newSignal = [
            'id' => uniqid('sig_'),
            'type' => $request->input('type'),
            'sender' => $request->input('sender'),
            'payload' => $request->input('payload'),
            'sdp' => $request->input('sdp'),
            'candidate' => $request->input('candidate'),
            'time' => $now,
        ];

        $signals[] = $newSignal;
        Cache::put($cacheKey, array_values($signals), 300);

        return response()->json(['status' => 'ok', 'signal_id' => $newSignal['id']]);
    }

    /**
     * Retrieve WebRTC signaling messages from counterpart peer
     */
    public function getSignals(Request $request)
    {
        $sessionId = (string)$request->input('session_id');
        $afterTime = (float)$request->input('after', 0);
        $myPeerId = (string)$request->input('sender', '');

        $cacheKey = "zoom_signals_{$sessionId}";
        $signals = Cache::get($cacheKey, []);

        $newSignals = array_filter($signals, function ($s) use ($afterTime, $myPeerId) {
            return ($s['time'] ?? 0) > $afterTime && ($myPeerId === '' || ($s['sender'] ?? '') !== $myPeerId);
        });

        return response()->json([
            'signals' => array_values($newSignals),
            'server_time' => microtime(true),
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    /**
     * Clear WebRTC signaling cache for a session (called on new video session start)
     */
    public function clearSignals(Request $request)
    {
        $sessionId = (string)$request->input('session_id');
        if ($sessionId) {
            Cache::forget("zoom_signals_{$sessionId}");
        }
        return response()->json(['status' => 'cleared']);
    }
}
