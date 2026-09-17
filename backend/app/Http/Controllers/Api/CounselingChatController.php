<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingMessage;
use App\Models\CounselingSession;
use Illuminate\Http\Request;

class CounselingChatController extends Controller
{
    /**
     * Get all chat messages for a specific session
     */
    public function getMessages(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = CounselingSession::findOrFail($sessionId);

        // Security check: Only participant student and assigned tutor can view chat (or admin)
        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            if (str_starts_with($session->counselingCase?->case_number ?? '', 'TEST-')) {
                // Auto-pair participant for instant test sessions across laptops
                if ($user->isTutor()) {
                    $session->tutor_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['tutor_id' => $user->id]);
                } elseif ($user->isStudent() || $user->isGeneral()) {
                    $session->user_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['user_id' => $user->id]);
                } else {
                    return response()->json(['message' => 'Akses ditolak: Percakapan konseling bersifat rahasia.'], 403);
                }
            } else {
                return response()->json(['message' => 'Akses ditolak: Percakapan konseling bersifat rahasia dan hanya dapat diakses oleh konseli dan konselor terkait.'], 403);
            }
        }

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
        $session = CounselingSession::findOrFail($sessionId);

        // Security check: Only participant student and assigned tutor can send message (or admin)
        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            if (str_starts_with($session->counselingCase?->case_number ?? '', 'TEST-')) {
                // Auto-pair participant for instant test sessions across laptops
                if ($user->isTutor()) {
                    $session->tutor_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['tutor_id' => $user->id]);
                } elseif ($user->isStudent() || $user->isGeneral()) {
                    $session->user_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['user_id' => $user->id]);
                } else {
                    return response()->json(['message' => 'Akses ditolak: Anda bukan partisipan dalam sesi konseling ini.'], 403);
                }
            } else {
                return response()->json(['message' => 'Akses ditolak: Anda bukan partisipan dalam sesi konseling ini.'], 403);
            }
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
