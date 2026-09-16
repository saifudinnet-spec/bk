<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingSession;
use App\Services\AuditLogService;
use App\Services\ZoomService;
use Illuminate\Http\Request;

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
}
