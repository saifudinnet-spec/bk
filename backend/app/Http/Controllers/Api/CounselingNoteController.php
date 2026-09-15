<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingNote;
use App\Models\CounselingSession;
use App\Models\Notification;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class CounselingNoteController extends Controller
{
    /**
     * Save or update notes for a counseling session (Tutor only)
     */
    public function store(Request $request, $sessionId)
    {
        $request->validate([
            'summary' => 'required|string|max:3000',
            'private_note' => 'nullable|string|max:5000',
            'student_recommendation' => 'required|string|max:3000',
            'follow_up_required' => 'nullable|boolean',
            'next_follow_up_at' => 'nullable|date',
        ]);

        $user = $request->user();
        $session = CounselingSession::with('counselingCase')->findOrFail($sessionId);

        // Security authorization check: only the assigned tutor or admin can write notes
        if ($session->tutor_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya tutor yang bertugas pada sesi ini yang dapat menulis catatan konseling.',
            ], 403);
        }

        $note = CounselingNote::updateOrCreate(
            ['session_id' => $session->id],
            [
                'tutor_id' => $user->id,
                'summary' => $request->input('summary'),
                'private_note' => $request->input('private_note'),
                'student_recommendation' => $request->input('student_recommendation'),
                'follow_up_required' => $request->boolean('follow_up_required'),
                'next_follow_up_at' => $request->input('next_follow_up_at'),
            ]
        );

        // Mark session completed
        $session->status = 'COMPLETED';
        $session->save();

        // Update case status
        if ($note->follow_up_required) {
            $session->counselingCase->status = 'FOLLOW_UP';
        } else {
            $session->counselingCase->status = 'REVIEWED';
        }
        $session->counselingCase->save();

        // Send gentle notification to student
        Notification::create([
            'user_id' => $session->user_id,
            'type' => 'recommendation_ready',
            'title' => 'Rekomendasi Konseling Tersedia',
            'message' => 'Tutor telah memberikan catatan dan rekomendasi tindak lanjut untuk Anda.',
        ]);

        AuditLogService::log('create_note', 'CounselingNote', (string)$note->id, [
            'session_id' => $session->id,
            'has_private_note' => !empty($request->input('private_note')),
        ], $user->id);

        return response()->json([
            'message' => 'Catatan dan rekomendasi konseling berhasil disimpan.',
            'data' => $note,
        ]);
    }

    /**
     * Get notes for a session (with privacy enforcement)
     */
    public function show(Request $request, $sessionId)
    {
        $user = $request->user();
        $session = CounselingSession::findOrFail($sessionId);

        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $note = CounselingNote::where('session_id', $sessionId)->first();
        if (!$note) {
            return response()->json(['data' => null]);
        }

        // Student & Admin privacy protection: NEVER expose private_note to Student or Admin
        if ($user->isStudent() || $user->isGeneral() || $user->isAdmin()) {
            $note->makeHidden('private_note');
        } elseif ($user->isTutor() && $session->tutor_id === $user->id) {
            AuditLogService::log('view_sensitive_data', 'CounselingNote', (string)$note->id, [
                'type' => 'private_note',
            ], $user->id);
        }

        return response()->json([
            'data' => $note,
        ]);
    }
}
