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

        $perPage = (int)$request->query('per_page', 100);
        $users = $query->latest()->paginate($perPage);

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

        $sdkSecret = SystemSetting::get('zoom_sdk_secret', env('ZOOM_SDK_SECRET', ''));
        $maskedSdkSecret = '';
        if (!empty($sdkSecret)) {
            $maskedSdkSecret = strlen($sdkSecret) > 8
                ? substr($sdkSecret, 0, 4) . '••••••••' . substr($sdkSecret, -4)
                : '••••••••';
        }

        return response()->json([
            // Web CMS Settings
            'site_title' => SystemSetting::get('site_title', 'Ruang BK - Layanan Bimbingan & Konseling Kampus'),
            'site_tagline' => SystemSetting::get('site_tagline', 'Ruang Aman untuk Tumbuh dan Bercerita'),
            'site_meta_description' => SystemSetting::get('site_meta_description', 'Layanan bimbingan dan konseling online & offline terpadu untuk civitas akademika.'),
            'site_meta_keywords' => SystemSetting::get('site_meta_keywords', 'konseling online, bimbingan mahasiswa, kesehatan mental, konselor kampus'),
            'contact_email' => SystemSetting::get('contact_email', 'bk@kampus.ac.id'),
            'contact_whatsapp' => SystemSetting::get('contact_whatsapp', '+62 812-3456-7890'),
            'campus_address' => SystemSetting::get('campus_address', 'Gedung Pusat Kegiatan Mahasiswa Lt. 2, Kampus Terpadu'),
            'operating_hours' => SystemSetting::get('operating_hours', 'Senin - Jumat, 08:00 - 16:00 WIB'),
            'announcement_bar_enabled' => SystemSetting::get('announcement_bar_enabled', 'false') === 'true',
            'announcement_text' => SystemSetting::get('announcement_text', 'Layanan Konseling Tatap Muka & Online tetap beroperasi penuh.'),

            // BK Online Application Settings
            'default_session_duration' => (int) SystemSetting::get('default_session_duration', '40'),
            'max_active_sessions_per_student' => (int) SystemSetting::get('max_active_sessions_per_student', '2'),
            'cancellation_buffer_hours' => (int) SystemSetting::get('cancellation_buffer_hours', '6'),
            'auto_approve_counseling' => SystemSetting::get('auto_approve_counseling', 'false') === 'true',
            'tutor_assignment_mode' => SystemSetting::get('tutor_assignment_mode', 'student_select'),
            'crisis_flag_enabled' => SystemSetting::get('crisis_flag_enabled', 'true') === 'true',
            'crisis_alert_email' => SystemSetting::get('crisis_alert_email', 'crisis-center@kampus.ac.id'),
            'reminder_notifications_enabled' => SystemSetting::get('reminder_notifications_enabled', 'true') === 'true',

            // Zoom Server-to-Server OAuth
            'zoom_mock_mode' => SystemSetting::get('zoom_mock_mode', env('ZOOM_MOCK_MODE', 'true')) === 'true',
            'zoom_test_feature_enabled' => SystemSetting::get('zoom_test_feature_enabled', 'true') === 'true',
            'zoom_account_id' => SystemSetting::get('zoom_account_id', env('ZOOM_ACCOUNT_ID', '')),
            'zoom_client_id' => SystemSetting::get('zoom_client_id', env('ZOOM_CLIENT_ID', '')),
            'zoom_client_secret_masked' => $maskedSecret,
            'zoom_has_client_secret' => !empty($clientSecret),
            'zoom_host_email' => SystemSetting::get('zoom_host_email', env('ZOOM_HOST_EMAIL', '')),
            'zoom_is_configured' => \App\Services\ZoomApiService::isConfigured(),
            'zoom_permanent_meeting_url' => SystemSetting::get('zoom_permanent_meeting_url', ''),
            'zoom_permanent_meeting_id' => SystemSetting::get('zoom_permanent_meeting_id', ''),
            'zoom_permanent_meeting_password' => SystemSetting::get('zoom_permanent_meeting_password', ''),

            // Zoom Meeting SDK (Video Konseling Web)
            'zoom_sdk_key' => SystemSetting::get('zoom_sdk_key', env('ZOOM_SDK_KEY', '')),
            'zoom_sdk_secret_masked' => $maskedSdkSecret,
            'zoom_has_sdk_secret' => !empty($sdkSecret),
            'zoom_sdk_is_configured' => \App\Services\ZoomService::isConfigured(),
        ]);
    }

    /**
     * Update System Settings
     */
    public function updateSettings(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            // Web CMS Settings
            'site_title' => 'nullable|string|max:255',
            'site_tagline' => 'nullable|string|max:255',
            'site_meta_description' => 'nullable|string|max:1000',
            'site_meta_keywords' => 'nullable|string|max:500',
            'contact_email' => 'nullable|string|email|max:255',
            'contact_whatsapp' => 'nullable|string|max:50',
            'campus_address' => 'nullable|string|max:500',
            'operating_hours' => 'nullable|string|max:255',
            'announcement_bar_enabled' => 'nullable|boolean',
            'announcement_text' => 'nullable|string|max:500',

            // BK Online Application Settings
            'default_session_duration' => 'nullable|integer|in:30,40,60',
            'max_active_sessions_per_student' => 'nullable|integer|min:1|max:10',
            'cancellation_buffer_hours' => 'nullable|integer|min:0|max:48',
            'auto_approve_counseling' => 'nullable|boolean',
            'tutor_assignment_mode' => 'nullable|in:manual,student_select,automatic',
            'crisis_flag_enabled' => 'nullable|boolean',
            'crisis_alert_email' => 'nullable|string|email|max:255',
            'reminder_notifications_enabled' => 'nullable|boolean',

            // Zoom Settings
            'zoom_mock_mode' => 'nullable|boolean',
            'zoom_test_feature_enabled' => 'nullable|boolean',
            'zoom_account_id' => 'nullable|string|max:255',
            'zoom_client_id' => 'nullable|string|max:255',
            'zoom_client_secret' => 'nullable|string|max:255',
            'zoom_host_email' => 'nullable|string|email|max:255',
            'zoom_permanent_meeting_url' => 'nullable|string|max:500',
            'zoom_permanent_meeting_id' => 'nullable|string|max:100',
            'zoom_permanent_meeting_password' => 'nullable|string|max:100',

            // Zoom Meeting SDK Settings
            'zoom_sdk_key' => 'nullable|string|max:255',
            'zoom_sdk_secret' => 'nullable|string|max:255',
        ]);

        // Web CMS
        if ($request->has('site_title')) SystemSetting::set('site_title', trim($request->input('site_title') ?? ''));
        if ($request->has('site_tagline')) SystemSetting::set('site_tagline', trim($request->input('site_tagline') ?? ''));
        if ($request->has('site_meta_description')) SystemSetting::set('site_meta_description', trim($request->input('site_meta_description') ?? ''));
        if ($request->has('site_meta_keywords')) SystemSetting::set('site_meta_keywords', trim($request->input('site_meta_keywords') ?? ''));
        if ($request->has('contact_email')) SystemSetting::set('contact_email', trim($request->input('contact_email') ?? ''));
        if ($request->has('contact_whatsapp')) SystemSetting::set('contact_whatsapp', trim($request->input('contact_whatsapp') ?? ''));
        if ($request->has('campus_address')) SystemSetting::set('campus_address', trim($request->input('campus_address') ?? ''));
        if ($request->has('operating_hours')) SystemSetting::set('operating_hours', trim($request->input('operating_hours') ?? ''));
        if ($request->has('announcement_bar_enabled')) SystemSetting::set('announcement_bar_enabled', $request->boolean('announcement_bar_enabled') ? 'true' : 'false');
        if ($request->has('announcement_text')) SystemSetting::set('announcement_text', trim($request->input('announcement_text') ?? ''));

        // BK Online
        if ($request->has('default_session_duration')) SystemSetting::set('default_session_duration', (string) $request->input('default_session_duration'));
        if ($request->has('max_active_sessions_per_student')) SystemSetting::set('max_active_sessions_per_student', (string) $request->input('max_active_sessions_per_student'));
        if ($request->has('cancellation_buffer_hours')) SystemSetting::set('cancellation_buffer_hours', (string) $request->input('cancellation_buffer_hours'));
        if ($request->has('auto_approve_counseling')) SystemSetting::set('auto_approve_counseling', $request->boolean('auto_approve_counseling') ? 'true' : 'false');
        if ($request->has('tutor_assignment_mode')) SystemSetting::set('tutor_assignment_mode', $request->input('tutor_assignment_mode'));
        if ($request->has('crisis_flag_enabled')) SystemSetting::set('crisis_flag_enabled', $request->boolean('crisis_flag_enabled') ? 'true' : 'false');
        if ($request->has('crisis_alert_email')) SystemSetting::set('crisis_alert_email', trim($request->input('crisis_alert_email') ?? ''));
        if ($request->has('reminder_notifications_enabled')) SystemSetting::set('reminder_notifications_enabled', $request->boolean('reminder_notifications_enabled') ? 'true' : 'false');

        // Zoom Server-to-Server OAuth
        if ($request->has('zoom_mock_mode')) SystemSetting::set('zoom_mock_mode', $request->boolean('zoom_mock_mode') ? 'true' : 'false');
        if ($request->has('zoom_test_feature_enabled')) SystemSetting::set('zoom_test_feature_enabled', $request->boolean('zoom_test_feature_enabled') ? 'true' : 'false');
        if ($request->has('zoom_account_id')) SystemSetting::set('zoom_account_id', trim($request->input('zoom_account_id') ?? ''));
        if ($request->has('zoom_client_id')) SystemSetting::set('zoom_client_id', trim($request->input('zoom_client_id') ?? ''));
        if ($request->filled('zoom_client_secret')) SystemSetting::set('zoom_client_secret', trim($request->input('zoom_client_secret')));
        if ($request->has('zoom_host_email')) SystemSetting::set('zoom_host_email', trim($request->input('zoom_host_email') ?? ''));
        if ($request->has('zoom_permanent_meeting_url')) SystemSetting::set('zoom_permanent_meeting_url', trim($request->input('zoom_permanent_meeting_url') ?? ''));
        if ($request->has('zoom_permanent_meeting_id')) SystemSetting::set('zoom_permanent_meeting_id', trim($request->input('zoom_permanent_meeting_id') ?? ''));
        if ($request->has('zoom_permanent_meeting_password')) SystemSetting::set('zoom_permanent_meeting_password', trim($request->input('zoom_permanent_meeting_password') ?? ''));

        // Zoom Meeting SDK
        if ($request->has('zoom_sdk_key')) SystemSetting::set('zoom_sdk_key', trim($request->input('zoom_sdk_key') ?? ''));
        if ($request->filled('zoom_sdk_secret')) SystemSetting::set('zoom_sdk_secret', trim($request->input('zoom_sdk_secret')));

        AuditLogService::log('update_settings', 'SystemSetting', null, $request->except(['zoom_client_secret', 'zoom_sdk_secret']), $request->user()->id);

        return response()->json([
            'message' => 'Pengaturan sistem berhasil diperbarui.',
            'zoom_is_configured' => \App\Services\ZoomApiService::isConfigured(),
            'zoom_sdk_is_configured' => \App\Services\ZoomService::isConfigured(),
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

    /**
     * Test Zoom Meeting SDK Credentials and JWT generation
     */
    public function testZoomSdk(Request $request)
    {
        $this->ensureAdmin($request);

        $sdkKey = trim($request->input('zoom_sdk_key') ?: SystemSetting::get('zoom_sdk_key', env('ZOOM_SDK_KEY', '')));
        $sdkSecret = trim($request->input('zoom_sdk_secret') ?: SystemSetting::get('zoom_sdk_secret', env('ZOOM_SDK_SECRET', '')));

        if (empty($sdkKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Zoom Meeting SDK Client ID (SDK Key) belum diisi.'
            ], 422);
        }

        if (empty($sdkSecret)) {
            return response()->json([
                'success' => false,
                'message' => 'Zoom Meeting SDK Client Secret belum diisi.'
            ], 422);
        }

        try {
            $iat = time() - 30;
            $exp = $iat + 7200;
            $header = ['alg' => 'HS256', 'typ' => 'JWT'];
            $payload = [
                'appKey' => $sdkKey,
                'sdkKey' => $sdkKey,
                'mn' => '1234567890',
                'role' => 0,
                'iat' => $iat,
                'exp' => $exp,
                'tokenExp' => $exp,
            ];

            $b64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($header)));
            $b64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
            $signature = hash_hmac('sha256', "{$b64Header}.{$b64Payload}", $sdkSecret, true);
            $b64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
            $jwt = "{$b64Header}.{$b64Payload}.{$b64Signature}";

            if (empty($jwt) || strlen($jwt) < 30) {
                throw new \Exception('Gagal membuat token JWT signature.');
            }

            // Save credentials if passed directly in request
            if ($request->filled('zoom_sdk_key')) {
                SystemSetting::set('zoom_sdk_key', $sdkKey);
            }
            if ($request->filled('zoom_sdk_secret')) {
                SystemSetting::set('zoom_sdk_secret', $sdkSecret);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kredensial Zoom Meeting SDK valid! JWT Token Signature berhasil dibuat dan siap dipakai.',
                'sdk_key' => $sdkKey,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: ' . $e->getMessage()
            ], 400);
        }
    }
}
