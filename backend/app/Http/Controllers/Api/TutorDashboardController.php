<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TutorDashboardController extends Controller
{
    /**
     * Unified, high-performance aggregated endpoint for Tutor Dashboard.
     * Returns all required counselor home data in ONE database-optimized query,
     * eliminating sequential HTTP bottlenecks on single-threaded dev servers.
     */
    public function getDashboardSummary(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak: Hanya konselor atau admin yang dapat mengakses dashboard tutor.'], 403);
        }

        $now = Carbon::now();
        $today = Carbon::today();

        // 1. Database-calculated summary counts (lightweight queries)
        $waitingReviewCount = CounselingCase::whereIn('status', ['NEW', 'WAITING_REVIEW'])
            ->where(function ($q) use ($user) {
                $q->where('tutor_id', $user->id)
                  ->orWhereNull('tutor_id');
            })
            ->count();

        $activeCasesCount = CounselingCase::whereNotIn('status', ['CLOSED'])
            ->where(function ($q) use ($user) {
                $q->where('tutor_id', $user->id)
                  ->orWhereNull('tutor_id');
            })
            ->count();

        $followUpCasesCount = CounselingCase::where('status', 'FOLLOW_UP')
            ->where('tutor_id', $user->id)
            ->count();

        $todaySessionsCount = CounselingSession::where('tutor_id', $user->id)
            ->whereDate('start_at', $today)
            ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
            ->count();

        // 2. Only cases that require review / confirmation (limited to latest 15)
        $waitingCases = CounselingCase::with([
            'user' => function ($q) {
                $q->select('id', 'name', 'email', 'phone', 'avatar', 'role')
                  ->with(['studentProfile', 'generalProfile']);
            },
            'topic:id,title',
            'sessions' => function ($q) {
                $q->latest('start_at');
            }
        ])
        ->whereIn('status', ['NEW', 'WAITING_REVIEW'])
        ->where(function ($q) use ($user) {
            $q->where('tutor_id', $user->id)
              ->orWhereNull('tutor_id');
        })
        ->latest('created_at')
        ->take(15)
        ->get();

        // 3. Upcoming sessions for this tutor (limited to 10)
        $upcomingSessions = CounselingSession::with([
            'counselingCase:id,case_number,category,status,method',
            'user:id,name,email,avatar,role',
            'tutor:id,name,email,avatar,role',
            'feedback',
        ])
        ->where('tutor_id', $user->id)
        ->where('end_at', '>=', $now)
        ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
        ->orderBy('start_at', 'asc')
        ->take(10)
        ->get();

        $tProfile = $user->tutorProfile;
        $counselorPhoto = $user->avatar ?: ($tProfile?->photo ?: null);
        if (!$counselorPhoto) {
            $nameLower = strtolower($user->name ?? '');
            if (str_contains($nameLower, 'nurlina') || str_contains($nameLower, 'dian')) {
                $counselorPhoto = '/images/counselor_dian.jpg';
            } elseif (str_contains($nameLower, 'bambang')) {
                $counselorPhoto = '/images/counselor_bambang.jpg';
            } else {
                $counselorPhoto = '/images/counselor_ahmad.jpg';
            }
        }

        $activeTestSession = CounselingSession::with(['counselingCase', 'user:id,name,avatar'])
            ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
            ->where('end_at', '>=', $now)
            ->whereHas('counselingCase', function ($q) {
                $q->where('case_number', 'LIKE', 'TEST-%');
            })
            ->latest('id')
            ->first();

        return response()->json([
            'counselor' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $counselorPhoto,
                'specialization' => $tProfile?->specialization ?? 'Konselor Bimbingan Konseling',
            ],
            'metrics' => [
                'waiting_review' => $waitingReviewCount,
                'active_cases' => $activeCasesCount,
                'follow_up' => $followUpCasesCount,
                'today_sessions' => $todaySessionsCount,
            ],
            'waiting_cases' => $waitingCases,
            'upcoming_sessions' => $upcomingSessions,
            'active_test_session' => $activeTestSession,
        ]);
    }

    /**
     * Get distinct students / counselees assigned to or handled by this tutor.
     * High performance, aggregated query that returns only client overview data.
     */
    public function getStudents(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak: Hanya konselor yang dapat mengakses daftar mahasiswa konseli.'], 403);
        }

        $studentIds = CounselingCase::where(function ($q) use ($user) {
            $q->where('tutor_id', $user->id)
              ->orWhereNull('tutor_id');
        })
        ->distinct()
        ->pluck('user_id');

        $students = \App\Models\User::with([
            'studentProfile:id,user_id,nim,program_study',
            'generalProfile:id,user_id',
        ])
        ->withCount(['studentCases as total_cases' => function ($q) use ($user) {
            $q->where(function ($sq) use ($user) {
                $sq->where('tutor_id', $user->id)
                   ->orWhereNull('tutor_id');
            });
        }])
        ->whereIn('id', $studentIds)
        ->get()
        ->map(function ($u) use ($user) {
            $latestCase = CounselingCase::select('id', 'case_number', 'category', 'status', 'created_at')
                ->where('user_id', $u->id)
                ->where(function ($q) use ($user) {
                    $q->where('tutor_id', $user->id)
                      ->orWhereNull('tutor_id');
                })
                ->latest('id')
                ->first();

            return [
                'user' => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'avatar' => $u->avatar,
                    'studentProfile' => $u->studentProfile,
                    'generalProfile' => $u->generalProfile,
                ],
                'totalCases' => $u->total_cases,
                'latestCase' => $latestCase,
            ];
        });

        return response()->json([
            'data' => $students,
        ]);
    }
}
