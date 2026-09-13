<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingSession;
use App\Models\SessionFeedback;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionFeedbackController extends Controller
{
    /**
     * Submit rating and feedback for a counseling session
     */
    public function store(Request $request, $sessionId)
    {
        $session = CounselingSession::with('counselingCase')->findOrFail($sessionId);
        $user = $request->user() ?? Auth::user();

        // Only the client/student of this session can submit feedback
        if ($session->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya klien/mahasiswa pada sesi ini yang dapat memberikan ulasan dan rating.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'mood_after' => 'nullable|string|max:50',
            'aspects' => 'nullable|array',
            'comment' => 'nullable|string|max:1000',
            'is_anonymous' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $feedback = SessionFeedback::updateOrCreate(
            ['session_id' => $session->id],
            [
                'counseling_case_id' => $session->counseling_case_id,
                'user_id' => $session->user_id,
                'tutor_id' => $session->tutor_id,
                'rating' => $request->input('rating'),
                'mood_after' => $request->input('mood_after'),
                'aspects' => $request->input('aspects'),
                'comment' => $request->input('comment'),
                'is_anonymous' => $request->boolean('is_anonymous', false),
            ]
        );

        // Ensure session status is COMPLETED
        if ($session->status !== 'COMPLETED') {
            $session->update(['status' => 'COMPLETED']);
        }

        AuditLogService::log('session_feedback', 'CounselingSession', (string)$session->id, [
            'rating' => $feedback->rating,
            'is_anonymous' => $feedback->is_anonymous,
            'tutor_id' => $feedback->tutor_id,
        ], $user->id);

        return response()->json([
            'message' => 'Terima kasih! Ulasan dan evaluasi sesi konseling Anda berhasil disimpan.',
            'data' => $feedback,
        ], 201);
    }

    /**
     * Get feedback for a specific session
     */
    public function show($sessionId)
    {
        $feedback = SessionFeedback::with(['user:id,name', 'tutor:id,name'])
            ->where('session_id', $sessionId)
            ->first();

        if (!$feedback) {
            return response()->json([
                'found' => false,
                'data' => null,
            ], 200);
        }

        $response = $feedback->toArray();
        if ($feedback->is_anonymous && Auth::id() !== $feedback->user_id && !Auth::user()->isAdmin()) {
            $response['user'] = ['id' => null, 'name' => 'Mahasiswa (Anonim)'];
        }

        return response()->json([
            'found' => true,
            'data' => $response,
        ], 200);
    }

    /**
     * Get aggregate statistics & feedback list for tutors/admins
     */
    public function getTutorRatings(Request $request)
    {
        $user = $request->user() ?? Auth::user();
        $tutorId = $request->query('tutor_id', $user->isTutor() ? $user->id : null);

        $query = SessionFeedback::query();
        if ($tutorId) {
            $query->where('tutor_id', $tutorId);
        }

        $totalCount = (clone $query)->count();
        $averageRating = (clone $query)->avg('rating') ?: 0;

        $starBreakdown = [
            5 => (clone $query)->where('rating', 5)->count(),
            4 => (clone $query)->where('rating', 4)->count(),
            3 => (clone $query)->where('rating', 3)->count(),
            2 => (clone $query)->where('rating', 2)->count(),
            1 => (clone $query)->where('rating', 1)->count(),
        ];

        $recentFeedbacks = $query->with(['user:id,name', 'counselingCase:id,case_number,category'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                if ($item->is_anonymous) {
                    $arr['user'] = ['id' => null, 'name' => 'Mahasiswa (Anonim)'];
                }
                return $arr;
            });

        return response()->json([
            'total' => $totalCount,
            'average_rating' => round($averageRating, 1),
            'star_breakdown' => $starBreakdown,
            'recent_feedbacks' => $recentFeedbacks,
        ]);
    }
}
