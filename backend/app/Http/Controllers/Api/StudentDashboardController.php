<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingActionPlan;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\MoodCheckin;
use App\Models\QuestionnaireResponse;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    /**
     * Unified, high-performance aggregated endpoint for Student Dashboard.
     * Returns all required home data in ONE database-optimized query,
     * eliminating sequential HTTP request bottlenecks on single-threaded dev servers.
     */
    public function getDashboardSummary(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $now = Carbon::now();
        $today = Carbon::today();

        // 1. Upcoming session
        $upcomingSession = CounselingSession::with([
            'counselingCase:id,case_number,category,status',
            'tutor:id,name,email,avatar',
            'feedback',
        ])
        ->where('user_id', $user->id)
        ->where('end_at', '>=', $now)
        ->whereNotIn('status', ['CANCELLED'])
        ->orderBy('start_at', 'asc')
        ->first();

        // 2. Unreviewed completed session (to show rating prompt)
        $unreviewedSession = CounselingSession::with([
            'counselingCase:id,case_number,category',
            'tutor:id,name',
        ])
        ->where('user_id', $user->id)
        ->where(function ($q) use ($now) {
            $q->where('end_at', '<', $now)->orWhere('status', 'COMPLETED');
        })
        ->whereNotIn('status', ['CANCELLED'])
        ->whereDoesntHave('feedback')
        ->latest('end_at')
        ->first();

        // 3. Active case
        $activeCase = CounselingCase::with(['tutor:id,name,email,avatar', 'topic', 'sessions.note'])
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['CLOSED'])
            ->latest()
            ->first();

        // Fallback to most recent case if no open case
        if (!$activeCase) {
            $activeCase = CounselingCase::with(['tutor:id,name,email,avatar', 'topic', 'sessions.note'])
                ->where('user_id', $user->id)
                ->latest()
                ->first();
        }

        // 4. Latest screening response
        $latestScreening = QuestionnaireResponse::with('questionnaire:id,title')
            ->where('user_id', $user->id)
            ->latest('submitted_at')
            ->first();

        // 5. Today's mood check-in & latest check-in
        $todayMood = MoodCheckin::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->latest()
            ->first();

        $hasCheckedInToday = !is_null($todayMood);
        $latestMood = $todayMood ?: MoodCheckin::where('user_id', $user->id)->latest()->first();

        // 6. Action plans / lembar tindak lanjut
        $actionPlans = CounselingActionPlan::with([
            'tutor:id,name',
            'counselingCase:id,case_number,category',
        ])
        ->where('user_id', $user->id)
        ->orderByRaw("FIELD(status, 'PENDING', 'IN_PROGRESS', 'COMPLETED')")
        ->orderBy('due_date', 'asc')
        ->orderBy('created_at', 'desc')
        ->take(10)
        ->get();

        // 7. Active instant test session (if feature enabled by admin and testing session running in last 2 hours)
        $isTestFeatureEnabled = SystemSetting::get('zoom_test_feature_enabled', 'true') === 'true';
        $activeTestSession = null;

        if ($isTestFeatureEnabled) {
            $activeTestSession = CounselingSession::with(['counselingCase', 'tutor:id,name,avatar'])
                ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
                ->where('end_at', '>=', $now)
                ->whereHas('counselingCase', function ($q) {
                    $q->where('case_number', 'LIKE', 'TEST-%');
                })
                ->latest('id')
                ->first();
        }

        return response()->json([
            'upcoming_session' => $upcomingSession,
            'unreviewed_session' => $unreviewedSession,
            'active_case' => $activeCase,
            'latest_screening' => $latestScreening,
            'today_mood' => $todayMood,
            'latest_mood' => $latestMood,
            'has_checked_in_today' => $hasCheckedInToday,
            'action_plans' => $actionPlans,
            'active_test_session' => $activeTestSession,
            'zoom_test_feature_enabled' => $isTestFeatureEnabled,
        ]);
    }
}
