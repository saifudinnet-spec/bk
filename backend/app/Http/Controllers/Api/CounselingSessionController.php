<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingCase;
use App\Models\CounselingMessage;
use App\Models\CounselingNote;
use App\Models\CounselingSession;
use App\Models\CounselingTopic;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Models\TutorAvailability;
use App\Models\User;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CounselingSessionController extends Controller
{
    /**
     * Get sessions for current user (student/general: own sessions; tutor: tutor sessions; admin: all)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = CounselingSession::with([
            'counselingCase:id,case_number,category,status',
            'user:id,name,email,avatar',
            'tutor:id,name,email,avatar',
            'note',
            'feedback',
        ]);

        if ($user->isStudent() || $user->isGeneral()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isTutor()) {
            $query->where('tutor_id', $user->id);
        }

        if ($request->input('scope') === 'upcoming') {
            $query->where('end_at', '>=', Carbon::now())
                  ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
                  ->orderBy('start_at', 'asc');
        } elseif ($request->input('scope') === 'past') {
            $query->where(function ($q) {
                $q->where('end_at', '<', Carbon::now())
                  ->orWhereIn('status', ['COMPLETED', 'CANCELLED']);
            })->orderBy('start_at', 'desc');
        } else {
            $query->orderBy('start_at', 'desc');
        }

        $sessions = $query->get();

        // Privacy: hide private note if viewed by student
        if ($user->isStudent() || $user->isGeneral()) {
            foreach ($sessions as $s) {
                if ($s->note) {
                    $s->note->makeHidden('private_note');
                }
            }
        }

        return response()->json([
            'data' => $sessions,
        ]);
    }

    /**
     * Book a counseling schedule slot
     */
    public function book(Request $request)
    {
        $request->validate([
            'counseling_case_id' => 'required|exists:counseling_cases,id',
            'availability_id' => 'required|exists:tutor_availabilities,id',
        ]);

        $user = $request->user();
        $case = CounselingCase::findOrFail($request->input('counseling_case_id'));

        // Check ownership
        if (!$user->isAdmin() && $case->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $session = DB::transaction(function () use ($request, $case, $user) {
            $availability = TutorAvailability::where('id', $request->input('availability_id'))
                ->where('status', 'AVAILABLE')
                ->lockForUpdate()
                ->first();

            if (!$availability) {
                abort(409, 'Slot jadwal yang dipilih baru saja dipesan oleh pengguna lain. Silakan pilih slot jam lain.');
            }

            $startAt = Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->start_time);
            $endAt = Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->end_time);

            // Mark slot as booked
            $availability->status = 'BOOKED';
            $availability->save();

            // Generate meeting identifiers
            $meetingNumber = 'BK' . rand(100, 999) . rand(1000, 9999);
            $meetingPassword = 'bk' . rand(1000, 9999);
            $meetingUrl = null;
            $sessionMethod = ($case->method || 'ZOOM');

            if (strtoupper($sessionMethod) === 'ZOOM') {
                $topic = "Bimbingan Konseling: {$case->category} - " . ($case->user->name ?? 'Mahasiswa');
                $duration = max(15, $startAt->diffInMinutes($endAt));
                $zoomResult = \App\Services\ZoomApiService::createMeeting($topic, $startAt->toIso8601String(), $duration);

                $meetingNumber = $zoomResult['id'] ?? $meetingNumber;
                $meetingPassword = $zoomResult['password'] ?? $meetingPassword;
                $meetingUrl = $zoomResult['join_url'] ?? null;
            }

            // Create Counseling Session
            $session = CounselingSession::create([
                'counseling_case_id' => $case->id,
                'user_id' => $case->user_id,
                'tutor_id' => $availability->tutor_id,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'method' => $sessionMethod,
                'status' => 'SCHEDULED',
                'meeting_provider' => 'zoom',
                'meeting_number' => $meetingNumber,
                'meeting_password' => $meetingPassword,
                'meeting_url' => $meetingUrl,
                'zoom_meeting_id' => $meetingNumber,
            ]);

            // Update case status and assign tutor
            $case->tutor_id = $availability->tutor_id;
            $case->status = 'SCHEDULED';
            $case->save();

            return $session;
        });

        // Create notification for student
        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'booking_confirmed',
            'title' => 'Jadwal Konseling Terkonfirmasi',
            'message' => "Sesi Anda dijadwalkan pada " . $session->start_at->translatedFormat('d F Y, H:i') . " WIB.",
        ]);

        // Notification for tutor
        Notification::create([
            'user_id' => $session->tutor_id,
            'type' => 'tutor_booking_received',
            'title' => 'Jadwal Konseling Baru',
            'message' => "Anda memiliki sesi konseling baru pada " . $session->start_at->translatedFormat('d F Y, H:i') . " WIB.",
        ]);

        AuditLogService::log('book_session', 'CounselingSession', (string)$session->id, [
            'case_number' => $case->case_number,
            'start_at' => $session->start_at->toIso8601String(),
        ], $user->id);

        return response()->json([
            'message' => 'Jadwal konseling berhasil dikonfirmasi.',
            'data' => $session->load(['counselingCase', 'tutor:id,name,email', 'user:id,name,email']),
        ], 201);
    }

    /**
     * Create an instant counseling session for testing right now (no scheduling wait needed)
     */
    public function createInstantSession(Request $request)
    {
        $request->validate([
            'method' => 'nullable|in:CHAT,ZOOM,OFFLINE',
            'tutor_id' => 'nullable|exists:users,id',
            'topic_id' => 'nullable|exists:counseling_topics,id',
            'initial_reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $method = strtoupper($request->input('method', 'CHAT'));
        $forceNew = $request->boolean('force_new');

        if (SystemSetting::get('zoom_test_feature_enabled', 'true') !== 'true') {
            return response()->json([
                'message' => 'Layanan uji coba instan sedang dinonaktifkan oleh administrator.',
            ], 403);
        }

        // 1. If force_new, complete any previous active instant test sessions
        if ($forceNew) {
            CounselingSession::where('method', $method)
                ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
                ->whereHas('counselingCase', function ($q) {
                    $q->where('case_number', 'LIKE', 'TEST-%');
                })
                ->update(['status' => 'COMPLETED']);
        } else {
            // 2. Check if an active instant test session already exists (within the last 2 hours)
            // This ensures Laptop 1 and Laptop 2 automatically enter the EXACT SAME chat room!
            $activeTestSession = CounselingSession::with(['counselingCase', 'tutor', 'user'])
                ->where('method', $method)
                ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
                ->where('end_at', '>=', Carbon::now())
                ->whereHas('counselingCase', function ($q) {
                    $q->where('case_number', 'LIKE', 'TEST-%');
                })
                ->latest('id')
                ->first();

            if ($activeTestSession) {
                // If caller is tutor, bind as the tutor of this active test session
                if ($user->isTutor() && $activeTestSession->tutor_id !== $user->id) {
                    $activeTestSession->tutor_id = $user->id;
                    $activeTestSession->save();
                    $activeTestSession->counselingCase?->update(['tutor_id' => $user->id]);
                } elseif (($user->isStudent() || $user->isGeneral()) && $activeTestSession->user_id !== $user->id) {
                    // If caller is student/general, bind as student of this active test session
                    $activeTestSession->user_id = $user->id;
                    $activeTestSession->save();
                    $activeTestSession->counselingCase?->update(['user_id' => $user->id]);
                }

                AuditLogService::log('join_instant_test_session', 'CounselingSession', (string)$activeTestSession->id, [
                    'method' => $method,
                    'case_number' => $activeTestSession->counselingCase?->case_number,
                ], $user->id);

                return response()->json([
                    'message' => 'Terhubung ke sesi uji instan yang sedang aktif.',
                    'data' => $activeTestSession->fresh(['counselingCase', 'tutor:id,name,email,avatar,role', 'user:id,name,email,avatar,role']),
                ], 200);
            }
        }

        // Determine student and tutor
        if ($user->isTutor()) {
            // Tutor is testing: find a student user to pair with
            $tutorId = $user->id;
            $studentUser = User::where('role', 'STUDENT')->first() 
                ?? User::where('id', '!=', $user->id)->first() 
                ?? $user;
            $studentId = $studentUser->id;
        } else {
            // Student/General/Admin is testing
            $studentId = $user->id;
            if ($request->filled('tutor_id')) {
                $tutorId = (int)$request->input('tutor_id');
            } else {
                // Pick an active tutor
                $tutorUser = User::where('role', 'TUTOR')->where(function($q) {
                        $q->where('status', 'ACTIVE')->orWhereNull('status');
                    })->first()
                    ?? User::where('role', 'TUTOR')->first()
                    ?? User::where('id', '!=', $user->id)->first();
                $tutorId = $tutorUser ? $tutorUser->id : $user->id;
            }
        }

        // Pick topic
        $topic = null;
        if ($request->filled('topic_id')) {
            $topic = CounselingTopic::find($request->input('topic_id'));
        }
        if (!$topic) {
            $topic = CounselingTopic::first();
        }

        $session = DB::transaction(function () use ($request, $user, $studentId, $tutorId, $topic, $method) {
            // Create a test CounselingCase
            $case = CounselingCase::create([
                'case_number' => 'TEST-' . strtoupper(substr(uniqid(), -6)),
                'user_id' => $studentId,
                'tutor_id' => $tutorId,
                'topic_id' => $topic ? $topic->id : null,
                'category' => $topic ? $topic->title : 'Uji Coba Langsung',
                'status' => 'SCHEDULED',
                'method' => $method,
                'initial_reason' => $request->input('initial_reason', "Pengujian langsung sesi {$method} di jam saat ini."),
                'assessment_answers' => [
                    'main_issue' => 'Uji coba fitur ' . ($method === 'ZOOM' ? 'Video Zoom' : 'Chat Konseling'),
                    'duration' => 'Saat ini (Real-time)',
                    'impact_level' => 1,
                    'story' => 'Testing instan tanpa menunggu slot jadwal lama.',
                ],
            ]);

            // Set start_at to 2 minutes ago and end_at to 2 hours from now so it's currently active!
            $startAt = Carbon::now()->subMinutes(2);
            $endAt = Carbon::now()->addHours(2);

            $meetingNumber = 'BK' . rand(100, 999) . rand(1000, 9999);
            $meetingPassword = 'bk' . rand(1000, 9999);
            $meetingUrl = null;

            if ($method === 'ZOOM') {
                $studentName = User::find($studentId)?->name ?? 'Mahasiswa';
                $topicTitle = $topic ? $topic->title : 'Konseling';
                $zoomResult = \App\Services\ZoomApiService::createMeeting(
                    "Sesi Uji Coba: {$topicTitle} - {$studentName}",
                    $startAt->toIso8601String(),
                    60
                );

                $meetingNumber = $zoomResult['id'] ?? $meetingNumber;
                $meetingPassword = $zoomResult['password'] ?? $meetingPassword;
                $meetingUrl = $zoomResult['join_url'] ?? null;
            }

            $sess = CounselingSession::create([
                'counseling_case_id' => $case->id,
                'user_id' => $studentId,
                'tutor_id' => $tutorId,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'method' => $method,
                'status' => 'SCHEDULED',
                'meeting_provider' => 'zoom',
                'meeting_number' => $meetingNumber,
                'meeting_password' => $meetingPassword,
                'meeting_url' => $meetingUrl,
                'zoom_meeting_id' => $meetingNumber,
            ]);

            // If CHAT method, add an initial friendly greeting message from the counselor
            if ($method === 'CHAT') {
                $tutorName = User::find($tutorId)?->name ?? 'Konselor BK';
                CounselingMessage::create([
                    'session_id' => $sess->id,
                    'sender_id' => $tutorId,
                    'message' => "Halo! Sesi konseling instan ({$method}) sudah aktif di jam saat ini. Selamat datang di ruang chat konsultasi rahasia Anda bersama {$tutorName}.",
                    'is_read' => false,
                ]);
            }

            return $sess;
        });

        AuditLogService::log('create_instant_test_session', 'CounselingSession', (string)$session->id, [
            'method' => $method,
            'case_number' => $session->counselingCase?->case_number,
        ], $user->id);

        return response()->json([
            'status' => 'success',
            'message' => "Sesi {$method} instan berhasil dibuat. Anda dapat langsung mengujinya sekarang.",
            'data' => $session->load(['counselingCase', 'user:id,name,email,avatar,role', 'tutor:id,name,email,avatar,role']),
        ], 201);
    }

    /**
     * Show session detail for Waiting Room
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $session = CounselingSession::with([
            'counselingCase.topic',
            'counselingCase.actionPlans',
            'user.studentProfile',
            'user.generalProfile',
            'tutor.tutorProfile',
            'note',
            'feedback',
        ])->findOrFail($id);

        // Security check
        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            if (str_starts_with($session->counselingCase?->case_number ?? '', 'TEST-')) {
                // Auto-pair counterpart for instant test sessions across laptops
                if ($user->isTutor()) {
                    $session->tutor_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['tutor_id' => $user->id]);
                    $session->load('tutor.tutorProfile');
                } elseif ($user->isStudent() || $user->isGeneral()) {
                    $session->user_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['user_id' => $user->id]);
                    $session->load(['user.studentProfile', 'user.generalProfile']);
                } else {
                    return response()->json(['message' => 'Akses ditolak.'], 403);
                }
            } else {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }
        }

        // Only assigned tutor can load student's psychological screening questionnaire responses (Admin excluded)
        if ($user->isTutor() && $session->tutor_id === $user->id) {
            $session->user->load([
                'questionnaireResponses' => function ($q) {
                    $q->with([
                        'questionnaire:id,title,version,description',
                        'answers.question:id,question_text,category,order',
                        'answers.option:id,label,score'
                    ])->latest('submitted_at');
                }
            ]);
        }

        // Determine if ready to join (within 15 minutes of start_at)
        $now = Carbon::now();
        $startTime = Carbon::parse($session->start_at);
        $endTime = Carbon::parse($session->end_at);

        $canJoin = $now->between($startTime->copy()->subMinutes(15), $endTime);
        // If testing mode / force_test or test case, bypass time constraint
        if ($request->boolean('force_test') || str_starts_with($session->counselingCase?->case_number ?? '', 'TEST')) {
            $canJoin = true;
        }
        $minutesUntilStart = $now->lt($startTime) ? $now->diffInMinutes($startTime) : 0;

        // If session has no meeting_url and a permanent Zoom URL is configured, attach it
        if (empty($session->meeting_url) && strtoupper($session->method ?? 'ZOOM') === 'ZOOM') {
            $permanentUrl = \App\Models\SystemSetting::get('zoom_permanent_meeting_url');
            if (!empty($permanentUrl)) {
                $session->meeting_url = $permanentUrl;
                $session->zoom_meeting_id = $session->zoom_meeting_id ?: \App\Models\SystemSetting::get('zoom_permanent_meeting_id');
                $session->meeting_number = $session->meeting_number ?: \App\Models\SystemSetting::get('zoom_permanent_meeting_id');
                $session->meeting_password = $session->meeting_password ?: \App\Models\SystemSetting::get('zoom_permanent_meeting_password');
            }
        }

        return response()->json([
            'data' => $session,
            'can_join' => $canJoin,
            'minutes_until_start' => $minutesUntilStart,
            'is_in_time_window' => $now->lte($endTime) || $request->boolean('force_test'),
        ]);
    }

    /**
     * Get notes for a session
     */
    public function getNotes(Request $request, $id)
    {
        $user = $request->user();
        $session = CounselingSession::with('note')->findOrFail($id);

        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $note = $session->note;

        if ($note && ($user->isStudent() || $user->isGeneral())) {
            $note->makeHidden('private_note');
        }

        return response()->json([
            'data' => $note,
        ]);
    }

    /**
     * Save post-counseling notes and recommendations
     */
    public function saveNotes(Request $request, $id)
    {
        $request->validate([
            'summary' => 'required|string|min:5|max:5000',
            'private_note' => 'nullable|string|max:5000',
            'student_recommendation' => 'required|string|min:5|max:5000',
            'follow_up_required' => 'nullable|boolean',
            'next_follow_up_at' => 'nullable|date',
        ]);

        $user = $request->user();
        $session = CounselingSession::with('counselingCase')->findOrFail($id);

        if ($session->tutor_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Hanya konselor bertugas yang dapat menyimpan catatan konseling.'], 403);
        }

        $followUpRequired = (bool)$request->input('follow_up_required', false);

        $note = CounselingNote::updateOrCreate(
            ['session_id' => $session->id],
            [
                'tutor_id' => $user->id,
                'summary' => $request->input('summary'),
                'private_note' => $request->input('private_note'),
                'student_recommendation' => $request->input('student_recommendation'),
                'follow_up_required' => $followUpRequired,
                'next_follow_up_at' => $followUpRequired ? $request->input('next_follow_up_at') : null,
            ]
        );

        // Mark session completed
        $session->status = 'COMPLETED';
        $session->save();

        // Update case status
        if ($session->counselingCase) {
            $session->counselingCase->status = $followUpRequired ? 'FOLLOW_UP' : 'COMPLETED';
            $session->counselingCase->save();
        }

        // Notify student about post-counseling recommendation
        Notification::create([
            'user_id' => $session->user_id,
            'type' => 'counseling_notes_published',
            'title' => 'Catatan & Rekomendasi Konseling Tersedia',
            'message' => "Konselor telah menyelesaikan sesi dan memberikan rekomendasi untuk Anda. " . ($followUpRequired ? "Konselor juga merekomendasikan sesi tindak lanjut." : ""),
        ]);

        AuditLogService::log('save_session_note', 'CounselingNote', (string)$note->id, [
            'session_id' => $session->id,
            'follow_up_required' => $followUpRequired,
        ], $user->id);

        return response()->json([
            'message' => 'Catatan konseling berhasil disimpan.',
            'data' => $note,
        ]);
    }
}
