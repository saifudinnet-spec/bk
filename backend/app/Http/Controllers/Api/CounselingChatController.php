<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingMessage;
use App\Models\CounselingSession;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class CounselingChatController extends Controller
{
    /**
     * Authorize participant access (or auto-pair for active TEST- sessions when enabled).
     */
    private function authorizeParticipant(Request $request, $sessionId): CounselingSession
    {
        $user = $request->user();
        $session = CounselingSession::with('counselingCase')->findOrFail($sessionId);

        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            $isTestSession = str_starts_with($session->counselingCase?->case_number ?? '', 'TEST-');
            $isTestFeatureEnabled = SystemSetting::get('zoom_test_feature_enabled', 'true') === 'true';

            if ($isTestSession && $isTestFeatureEnabled) {
                if ($user->isTutor()) {
                    $session->tutor_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['tutor_id' => $user->id]);
                } elseif ($user->isStudent() || $user->isGeneral()) {
                    $session->user_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['user_id' => $user->id]);
                } else {
                    abort(403, 'Akses ditolak: Percakapan konseling bersifat rahasia.');
                }
            } else {
                abort(403, 'Akses ditolak: Percakapan konseling bersifat rahasia dan hanya dapat diakses oleh konseli dan konselor terkait.');
            }
        }

        return $session;
    }

    /**
     * Get all chat messages for a specific session
     */
    public function getMessages(Request $request, $sessionId)
    {
        $user = $request->user();
        $this->authorizeParticipant($request, $sessionId);

        // Mark unread messages sent by the other party as read
        CounselingMessage::where('session_id', $sessionId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = CounselingMessage::where('session_id', $sessionId)
            ->with('sender:id,name,avatar,role')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'session_id' => (int)$sessionId,
            'data' => $messages,
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    /**
     * Send a new chat message
     */
    public function sendMessage(Request $request, $sessionId)
    {
        $request->validate([
            'message' => 'required|string|min:1|max:3000',
        ]);

        $user = $request->user();
        $session = $this->authorizeParticipant($request, $sessionId);

        if ($session->status === 'CANCELLED') {
            return response()->json([
                'message' => 'Tidak dapat mengirim pesan pada sesi konseling yang telah dibatalkan.',
            ], 422);
        }

        $message = CounselingMessage::create([
            'session_id' => $session->id,
            'sender_id' => $user->id,
            'message' => $request->input('message'),
            'attachment_url' => $request->input('attachment_url'),
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Pesan berhasil dikirim.',
            'data' => $message->load('sender:id,name,avatar,role'),
        ], 201)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
