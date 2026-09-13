<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\QuestionnaireResponse;
use App\Models\QuestionOption;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function ensureAdmin(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            abort(403, 'Akses ditolak: Hanya administrator yang dapat mengakses resource ini.');
        }
    }

    /**
     * Operational statistics for Admin Dashboard
     */
    public function getDashboardStats(Request $request)
    {
        $this->ensureAdmin($request);

        $totalStudents = User::where('role', 'STUDENT')->count();
        $totalGeneral = User::where('role', 'GENERAL')->count();
        $totalTutors = User::where('role', 'TUTOR')->count();
        $activeCases = CounselingCase::whereNotIn('status', ['CLOSED'])->count();
        $completedSessions = CounselingSession::where('status', 'COMPLETED')->count();
        $screeningsCount = QuestionnaireResponse::count();
        $crisisFlagCount = QuestionnaireResponse::where('has_crisis_flag', true)->count();

        $recentCases = CounselingCase::with(['user:id,name,email,role', 'tutor:id,name,email'])
            ->latest()
            ->take(5)
            ->get();

        $recentLogs = AuditLog::with('user:id,name,role')
            ->latest()
            ->take(8)
            ->get();

        return response()->json([
            'stats' => [
                'total_students' => $totalStudents,
                'total_general' => $totalGeneral,
                'total_tutors' => $totalTutors,
                'active_cases' => $activeCases,
                'completed_sessions' => $completedSessions,
                'screenings_count' => $screeningsCount,
                'crisis_flag_count' => $crisisFlagCount,
            ],
            'recent_cases' => $recentCases,
            'recent_logs' => $recentLogs,
        ]);
    }

    /**
     * User management list
     */
    public function getUsers(Request $request)
    {
        $this->ensureAdmin($request);

        $role = $request->query('role');
        $query = User::with(['studentProfile', 'generalProfile', 'tutorProfile']);

        if ($role && in_array($role, ['STUDENT', 'GENERAL', 'TUTOR', 'ADMIN'])) {
            $query->where('role', $role);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(15);

        return response()->json($users);
    }

    /**
     * Toggle user status (active/inactive)
     */
    public function toggleUserStatus(Request $request, $id)
    {
        $this->ensureAdmin($request);

        $user = User::findOrFail($id);
        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        AuditLogService::log('toggle_user_status', 'User', (string)$user->id, [
            'new_status' => $user->status,
        ], $request->user()->id);

        return response()->json([
            'message' => "Status pengguna {$user->name} berhasil diubah menjadi {$user->status}.",
            'user' => $user,
        ]);
    }

    /**
     * Get Audit Logs
     */
    public function getAuditLogs(Request $request)
    {
        $this->ensureAdmin($request);

        $query = AuditLog::with('user:id,name,email,role');

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        $logs = $query->latest()->paginate(25);

        return response()->json($logs);
    }

    /**
     * Get System Settings
     */
    public function getSettings(Request $request)
    {
        $this->ensureAdmin($request);

        $clientSecret = SystemSetting::get('zoom_client_secret', env('ZOOM_CLIENT_SECRET', ''));
        $maskedSecret = '';
        if (!empty($clientSecret)) {
            $maskedSecret = strlen($clientSecret) > 8
                ? substr($clientSecret, 0, 4) . '••••••••' . substr($clientSecret, -4)
                : '••••••••';
        }

        return response()->json([
            'tutor_assignment_mode' => SystemSetting::get('tutor_assignment_mode', 'student_select'),
            'crisis_flag_enabled' => SystemSetting::get('crisis_flag_enabled', 'true') === 'true',
            'zoom_mock_mode' => SystemSetting::get('zoom_mock_mode', env('ZOOM_MOCK_MODE', 'true')) === 'true',
            'zoom_account_id' => SystemSetting::get('zoom_account_id', env('ZOOM_ACCOUNT_ID', '')),
            'zoom_client_id' => SystemSetting::get('zoom_client_id', env('ZOOM_CLIENT_ID', '')),
            'zoom_client_secret_masked' => $maskedSecret,
            'zoom_has_client_secret' => !empty($clientSecret),
            'zoom_host_email' => SystemSetting::get('zoom_host_email', env('ZOOM_HOST_EMAIL', '')),
            'zoom_is_configured' => \App\Services\ZoomApiService::isConfigured(),
        ]);
    }

    /**
     * Update System Settings
     */
    public function updateSettings(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'tutor_assignment_mode' => 'nullable|in:manual,student_select,automatic',
            'crisis_flag_enabled' => 'nullable|boolean',
            'zoom_mock_mode' => 'nullable|boolean',
            'zoom_account_id' => 'nullable|string|max:255',
            'zoom_client_id' => 'nullable|string|max:255',
            'zoom_client_secret' => 'nullable|string|max:255',
            'zoom_host_email' => 'nullable|string|email|max:255',
        ]);

        if ($request->has('tutor_assignment_mode')) {
            SystemSetting::set('tutor_assignment_mode', $request->input('tutor_assignment_mode'));
        }
        if ($request->has('crisis_flag_enabled')) {
            SystemSetting::set('crisis_flag_enabled', $request->boolean('crisis_flag_enabled') ? 'true' : 'false');
        }
        if ($request->has('zoom_mock_mode')) {
            SystemSetting::set('zoom_mock_mode', $request->boolean('zoom_mock_mode') ? 'true' : 'false');
        }
        if ($request->has('zoom_account_id')) {
            SystemSetting::set('zoom_account_id', trim($request->input('zoom_account_id') ?? ''));
        }
        if ($request->has('zoom_client_id')) {
            SystemSetting::set('zoom_client_id', trim($request->input('zoom_client_id') ?? ''));
        }
        if ($request->filled('zoom_client_secret')) {
            SystemSetting::set('zoom_client_secret', trim($request->input('zoom_client_secret')));
        }
        if ($request->has('zoom_host_email')) {
            SystemSetting::set('zoom_host_email', trim($request->input('zoom_host_email') ?? ''));
        }

        AuditLogService::log('update_settings', 'SystemSetting', null, $request->except(['zoom_client_secret']), $request->user()->id);

        return response()->json([
            'message' => 'Pengaturan sistem berhasil diperbarui.',
            'zoom_is_configured' => \App\Services\ZoomApiService::isConfigured(),
        ]);
    }

    /**
     * Test Zoom API connection via Server-to-Server OAuth
     */
    public function testZoomConnection(Request $request)
    {
        $this->ensureAdmin($request);

        // If credentials are provided in request body, temporarily apply or test with them
        if ($request->filled('zoom_account_id') && $request->filled('zoom_client_id')) {
            if ($request->filled('zoom_client_secret')) {
                SystemSetting::set('zoom_account_id', trim($request->input('zoom_account_id')));
                SystemSetting::set('zoom_client_id', trim($request->input('zoom_client_id')));
                SystemSetting::set('zoom_client_secret', trim($request->input('zoom_client_secret')));
            }
            if ($request->has('zoom_host_email')) {
                SystemSetting::set('zoom_host_email', trim($request->input('zoom_host_email') ?? ''));
            }
        }

        $result = \App\Services\ZoomApiService::testConnection();

        return response()->json($result);
    }
}
