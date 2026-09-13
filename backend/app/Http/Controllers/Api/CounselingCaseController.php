<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\CounselingTopic;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Models\Tutor;
use App\Models\TutorAvailability;
use App\Models\User;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CounselingCaseController extends Controller
{
    /**
     * Get list of cases for current user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = CounselingCase::with([
            'user' => function ($q) {
                $q->select('id', 'name', 'email', 'avatar', 'role')
                  ->with(['studentProfile', 'generalProfile']);
            },
            'tutor:id,name,email,avatar',
            'topic',
            'sessions' => function ($q) {
                $q->latest('start_at');
            }
        ]);

        if ($user->isStudent() || $user->isGeneral()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isTutor()) {
            $query->where(function ($q) use ($user) {
                $q->where('tutor_id', $user->id)
                  ->orWhereNull('tutor_id');
            });
        }

        if ($request->has('status') && $request->input('status') !== 'ALL') {
            $query->where('status', $request->input('status'));
        }

        $cases = $query->latest()->get();

        return response()->json([
            'data' => $cases,
        ]);
    }

    /**
     * Create new counseling request / case with assessment and slot booking
     */
    public function store(Request $request)
    {
        $request->validate([
            'category' => 'nullable|string',
            'topic_id' => 'nullable|exists:counseling_topics,id',
            'custom_topic' => 'nullable|string|max:200',
            'method' => 'nullable|in:CHAT,ZOOM,OFFLINE',
            'initial_reason' => 'nullable|string|max:3000',
            'assessment_answers' => 'nullable|array',
            'agreement' => 'nullable|boolean',
            'tutor_id' => 'nullable|exists:users,id',
            'availability_id' => 'nullable|exists:tutor_availabilities,id',
        ]);

        $user = $request->user();
        $topicId = $request->input('topic_id');
        $customTopic = $request->input('custom_topic');
        $category = $request->input('category');

        if ($topicId && empty($category)) {
            $topic = CounselingTopic::find($topicId);
            $category = $topic ? $topic->title : 'Akademik';
        } elseif (empty($category)) {
            $category = $customTopic ?: 'Akademik';
        }

        $assignedTutorId = $request->input('tutor_id');
        $method = strtoupper($request->input('method', 'ZOOM'));
        $assessmentAnswers = $request->input('assessment_answers', []);
        $initialReason = $request->input('initial_reason');

        // If initial_reason is empty, extract story from assessment_answers
        if (empty($initialReason) && is_array($assessmentAnswers)) {
            $story = $assessmentAnswers['story'] ?? $assessmentAnswers['summary'] ?? null;
            $initialReason = $story ?: "Pengajuan bimbingan konseling topik {$category}";
        }

        $location = $method === 'OFFLINE'
            ? 'Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2, Kampus Siber UINSSC'
            : null;

        $case = CounselingCase::create([
            'user_id' => $user->id,
            'tutor_id' => $assignedTutorId,
            'topic_id' => $topicId,
            'custom_topic' => $customTopic,
            'category' => $category,
            'method' => $method,
            'initial_reason' => $initialReason ?: "Pengajuan bimbingan konseling topik {$category}",
            'assessment_answers' => $assessmentAnswers,
            'priority' => 'MEDIUM',
            'location' => $location,
            'status' => 'WAITING_REVIEW',
            'opened_at' => now(),
        ]);

        // If slot booking was selected, reserve slot and create session
        $session = null;
        if ($request->filled('availability_id')) {
            $availability = TutorAvailability::where('id', $request->input('availability_id'))
                ->where('status', 'AVAILABLE')
                ->first();

            if ($availability) {
                $availability->status = 'BOOKED';
                $availability->save();

                $startAt = Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->start_time);
                $endAt = Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->end_time);

                $meetingNumber = 'BK' . rand(100, 999) . rand(1000, 9999);
                $meetingPassword = 'bk' . rand(1000, 9999);
                $meetingUrl = null;

                if ($method === 'ZOOM') {
                    $topic = "Bimbingan Konseling: {$case->category} - " . ($user->name ?? 'Mahasiswa');
                    $duration = max(15, $startAt->diffInMinutes($endAt));
                    $zoomResult = \App\Services\ZoomApiService::createMeeting($topic, $startAt->toIso8601String(), $duration);

                    $meetingNumber = $zoomResult['id'] ?? $meetingNumber;
                    $meetingPassword = $zoomResult['password'] ?? $meetingPassword;
                    $meetingUrl = $zoomResult['join_url'] ?? null;
                }

                $session = CounselingSession::create([
                    'counseling_case_id' => $case->id,
                    'user_id' => $user->id,
                    'tutor_id' => $availability->tutor_id,
                    'start_at' => $startAt,
                    'end_at' => $endAt,
                    'method' => $method,
                    'location' => $location,
                    'status' => 'SCHEDULED',
                    'meeting_provider' => 'zoom',
                    'meeting_number' => $meetingNumber,
                    'meeting_password' => $meetingPassword,
                    'meeting_url' => $meetingUrl,
                    'zoom_meeting_id' => $meetingNumber,
                ]);

                // Ensure tutor on case is set
                $case->tutor_id = $availability->tutor_id;
                $case->save();
            }
        }

        // Student Notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'case_created',
            'title' => 'Pengajuan Konseling Diterima',
            'message' => "Pengajuan konseling {$case->case_number} berhasil dikirimkan. Menunggu konfirmasi dari konselor.",
        ]);

        // Tutor Notification
        if ($case->tutor_id) {
            Notification::create([
                'user_id' => $case->tutor_id,
                'type' => 'new_counseling_request',
                'title' => 'Permintaan Konseling Baru',
                'message' => "Terdapat permohonan konseling baru ({$case->case_number}) dengan topik {$case->category} yang memerlukan tinjauan Anda.",
            ]);
        }

        AuditLogService::log('create_case', 'CounselingCase', (string)$case->id, [
            'case_number' => $case->case_number,
            'category' => $case->category,
            'method' => $method,
        ], $user->id);

        return response()->json([
            'message' => 'Pengajuan konseling berhasil dikirimkan. Menunggu persetujuan konselor.',
            'data' => $case->load(['tutor:id,name,email,avatar', 'topic', 'sessions']),
        ], 201);
    }

    /**
     * Show case detail with sessions, assessment and action plans
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $case = CounselingCase::with([
            'user.studentProfile',
            'user.generalProfile',
            'tutor.tutorProfile',
            'topic',
            'sessions' => function ($q) {
                $q->with(['note', 'feedback'])->orderBy('start_at', 'desc');
            },
            'actionPlans' => function ($q) {
                $q->with('tutor:id,name')->latest();
            },
        ])->findOrFail($id);

        // Security authorization check
        if (!$user->isTutor() && !$user->isAdmin() && $case->user_id !== $user->id) {
            return response()->json([
                'message' => 'Akses tidak diizinkan.',
            ], 403);
        }

        // Mask private notes if viewed by student
        if ($user->isStudent() || $user->isGeneral()) {
            foreach ($case->sessions as $session) {
                if ($session->note) {
                    $session->note->makeHidden('private_note');
                }
            }
        }

        return response()->json([
            'data' => $case,
        ]);
    }

    /**
     * Tutor approves a counseling request
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $case = CounselingCase::with(['sessions', 'user'])->findOrFail($id);
        $case->status = 'SCHEDULED';
        $case->save();

        foreach ($case->sessions as $s) {
            $s->status = 'SCHEDULED';
            $s->save();
        }

        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'case_approved',
            'title' => 'Pengajuan Konseling Disetujui',
            'message' => "Pengajuan konseling Anda ({$case->case_number}) telah disetujui oleh {$user->name}. Sesi Anda siap dilaksanakan sesuai jadwal.",
        ]);

        return response()->json([
            'message' => 'Pengajuan konseling berhasil disetujui.',
            'data' => $case,
        ]);
    }

    /**
     * Tutor rejects a counseling request with a reason
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $case = CounselingCase::with('sessions')->findOrFail($id);
        $case->status = 'CLOSED';
        $case->closed_at = now();
        $case->save();

        // Cancel associated sessions and release slots
        foreach ($case->sessions as $s) {
            $s->status = 'CANCELLED';
            $s->save();

            // Release slot if availability matches
            TutorAvailability::where('tutor_id', $s->tutor_id)
                ->where('date', $s->start_at->format('Y-m-d'))
                ->where('start_time', $s->start_at->format('H:i:s'))
                ->update(['status' => 'AVAILABLE']);
        }

        $reason = $request->input('reason');

        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'case_rejected',
            'title' => 'Pembaruan Pengajuan Konseling',
            'message' => "Pengajuan konseling ({$case->case_number}) belum dapat disetujui oleh konselor. Catatan: {$reason}",
        ]);

        return response()->json([
            'message' => 'Pengajuan konseling telah ditolak.',
            'data' => $case,
        ]);
    }

    /**
     * Tutor suggests alternative method (e.g. Chat -> Zoom)
     */
    public function suggestMethod(Request $request, $id)
    {
        $request->validate([
            'suggested_method' => 'required|in:CHAT,ZOOM,OFFLINE',
            'note' => 'required|string|min:5|max:1000',
        ]);

        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $case = CounselingCase::findOrFail($id);
        $suggestedMethod = $request->input('suggested_method');
        $note = $request->input('note');

        $case->suggested_method = $suggestedMethod;
        $case->suggested_method_note = $note;
        $case->suggested_method_status = 'PENDING';
        $case->save();

        $methodNames = [
            'CHAT' => 'Chat Konseling',
            'ZOOM' => 'Video Konseling (Zoom)',
            'OFFLINE' => 'Tatap Muka Langsung di Kampus',
        ];

        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'method_change_suggestion',
            'title' => 'Saran Perubahan Metode Konseling',
            'message' => "Konselor {$user->name} menyarankan perubahan metode dari {$case->method} menjadi {$methodNames[$suggestedMethod]}. Alasan: {$note}",
        ]);

        return response()->json([
            'message' => 'Saran perubahan metode berhasil dikirimkan ke mahasiswa.',
            'data' => $case,
        ]);
    }

    /**
     * Student responds to method change suggestion (accept / reject)
     */
    public function respondMethodSuggestion(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:accept,reject',
        ]);

        $user = $request->user();
        $case = CounselingCase::with('sessions')->findOrFail($id);

        if ($case->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $action = $request->input('action');

        if ($action === 'accept' && $case->suggested_method) {
            $case->method = $case->suggested_method;
            $case->suggested_method_status = 'ACCEPTED';

            if ($case->method === 'OFFLINE') {
                $case->location = 'Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2, Kampus Siber UINSSC';
            }

            foreach ($case->sessions as $s) {
                $s->method = $case->suggested_method;
                if ($case->method === 'OFFLINE') {
                    $s->location = $case->location;
                }
                $s->save();
            }

            if ($case->tutor_id) {
                Notification::create([
                    'user_id' => $case->tutor_id,
                    'type' => 'method_suggestion_accepted',
                    'title' => 'Saran Perubahan Metode Disetujui',
                    'message' => "Mahasiswa {$user->name} menyetujui saran perubahan metode konseling ({$case->case_number}) menjadi {$case->method}.",
                ]);
            }
        } else {
            $case->suggested_method_status = 'REJECTED';

            if ($case->tutor_id) {
                Notification::create([
                    'user_id' => $case->tutor_id,
                    'type' => 'method_suggestion_rejected',
                    'title' => 'Saran Perubahan Metode Ditolak',
                    'message' => "Mahasiswa {$user->name} tetap memilih menggunakan metode {$case->method}.",
                ]);
            }
        }

        $case->save();

        return response()->json([
            'message' => $action === 'accept' ? 'Metode konseling berhasil diperbarui.' : 'Saran perubahan metode ditolak.',
            'data' => $case,
        ]);
    }

    /**
     * Update case status (Tutor or Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:NEW,SCREENING_COMPLETED,WAITING_REVIEW,REVIEWED,WAITING_SCHEDULE,SCHEDULED,IN_PROGRESS,FOLLOW_UP,CLOSED',
            'priority' => 'nullable|in:LOW,MEDIUM,HIGH,URGENT',
            'tutor_id' => 'nullable|exists:users,id',
        ]);

        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $case = CounselingCase::findOrFail($id);
        $oldStatus = $case->status;
        $newStatus = $request->input('status');

        $case->status = $newStatus;
        if ($request->filled('priority')) {
            $case->priority = $request->input('priority');
        }
        if ($request->filled('tutor_id')) {
            $case->tutor_id = $request->input('tutor_id');
        }
        if ($newStatus === 'CLOSED') {
            $case->closed_at = now();
        }
        $case->save();

        AuditLogService::log('change_case_status', 'CounselingCase', (string)$case->id, [
            'from' => $oldStatus,
            'to' => $newStatus,
        ], $user->id);

        return response()->json([
            'message' => 'Status kasus berhasil diperbarui.',
            'data' => $case,
        ]);
    }
}
