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
use Illuminate\Support\Facades\DB;

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
                $q->select('id', 'name', 'email', 'phone', 'avatar', 'role')
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

        // Check if general counselee consultation is enabled
        if ($user->isGeneral() && SystemSetting::get('general_counselee_enabled', 'true') !== 'true') {
            return response()->json([
                'message' => 'Layanan bimbingan dan konsultasi untuk masyarakat umum saat ini sedang dinonaktifkan oleh Administrator.'
            ], 403);
        }

        // [FIX H5] Guard: konseli tidak boleh buat kasus baru jika masih ada kasus aktif
        if ($user->isStudent() || $user->isGeneral()) {
            $activeCase = CounselingCase::where('user_id', $user->id)
                ->whereNotIn('status', ['CLOSED'])
                ->where('case_number', 'NOT LIKE', 'TEST-%')
                ->first();

            if ($activeCase) {
                return response()->json([
                    'message' => "Anda masih memiliki kasus konseling aktif ({$activeCase->case_number}) dengan status {$activeCase->status}. Kasus baru hanya dapat dibuat setelah kasus sebelumnya ditutup.",
                    'active_case_id' => $activeCase->id,
                    'active_case_number' => $activeCase->case_number,
                    'active_case_status' => $activeCase->status,
                ], 409);
            }
        }

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
        if ($assignedTutorId) {
            $validTutor = User::where('id', $assignedTutorId)
                ->where('role', 'TUTOR')
                ->where('status', 'active')
                ->exists();
            if (!$validTutor) {
                return response()->json([
                    'message' => 'Konselor yang dipilih tidak valid atau sedang tidak aktif.',
                ], 422);
            }
        }
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

        $createdData = \Illuminate\Support\Facades\DB::transaction(function () use ($user, $assignedTutorId, $topicId, $customTopic, $category, $method, $initialReason, $assessmentAnswers, $location, $request) {
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

            // If slot booking was selected, reserve slot with pessimistic locking
            $session = null;
            if ($request->filled('availability_id')) {
                $availability = TutorAvailability::where('id', $request->input('availability_id'))
                    ->where('status', 'AVAILABLE')
                    ->lockForUpdate()
                    ->first();

                if (!$availability) {
                    abort(409, 'Slot jadwal yang dipilih baru saja dipesan oleh pengguna lain. Silakan pilih slot jam lain.');
                }

                if ($assignedTutorId && (int) $availability->tutor_id !== (int) $assignedTutorId) {
                    abort(422, 'Slot jadwal tidak sesuai dengan konselor yang dipilih.');
                }

                $slotTutorActive = User::where('id', $availability->tutor_id)
                    ->where('role', 'TUTOR')
                    ->where('status', 'active')
                    ->exists();
                if (!$slotTutorActive) {
                    abort(422, 'Konselor pada slot jadwal ini sedang tidak aktif.');
                }

                if (!TutorScheduleController::slotSupportsMethod($availability->method, $method)) {
                    abort(422, "Slot jadwal konselor hanya tersedia untuk metode {$availability->method}, bukan {$method}.");
                }

                $startAt = Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->start_time, 'Asia/Jakarta')->utc();
                $endAt   = Carbon::parse($availability->date->format('Y-m-d') . ' ' . $availability->end_time,   'Asia/Jakarta')->utc();

                if ($startAt->lte(Carbon::now('UTC'))) {
                    abort(422, 'Slot jadwal yang dipilih sudah terlewat. Silakan pilih slot waktu yang masih akan datang.');
                }

                CounselingSessionController::assertNoSlotConflicts((int) $availability->tutor_id, $startAt, $endAt, $method);

                $availability->status = 'BOOKED';
                $availability->save();

                $meetingNumber   = 'BK' . rand(100, 999) . rand(1000, 9999);
                $meetingPassword = 'bk' . rand(1000, 9999);
                $meetingUrl      = null;

                if ($method === 'ZOOM') {
                    $topic = "Bimbingan Konseling: {$case->category} - " . ($user->name ?? 'Mahasiswa');
                    $duration = max(15, Carbon::parse($availability->start_time)->diffInMinutes(Carbon::parse($availability->end_time)));
                    $zoomResult = \App\Services\ZoomApiService::createMeeting($topic, $startAt->toIso8601String(), $duration);

                    $meetingNumber   = $zoomResult['id'] ?? $meetingNumber;
                    $meetingPassword = $zoomResult['password'] ?? $meetingPassword;
                    $meetingUrl      = $zoomResult['join_url'] ?? null;
                }

                $session = CounselingSession::create([
                    'counseling_case_id' => $case->id,
                    'user_id'            => $user->id,
                    'tutor_id'           => $availability->tutor_id,
                    'start_at'           => $startAt,
                    'end_at'             => $endAt,
                    'method'             => $method,
                    'location'           => $location,
                    'status'             => 'SCHEDULED',
                    'meeting_provider'   => 'zoom',
                    'meeting_number'     => $meetingNumber,
                    'meeting_password'   => $meetingPassword,
                    'meeting_url'        => $meetingUrl,
                    'zoom_meeting_id'    => $meetingNumber,
                ]);

                // Ensure tutor on case is set
                $case->tutor_id = $availability->tutor_id;
                $case->save();
            }

            return ['case' => $case, 'session' => $session];
        });

        $case = $createdData['case'];

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

        // Jika konseli langsung memilih slot jadwal ketersediaan (booking session), kirim email konfirmasi ke konseli & konselor
        if (!empty($createdData['session'])) {
            \App\Services\CounselingMailService::sendBookingConfirmationEmails($createdData['session']);
        }

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
        if ($user->isStudent() || $user->isGeneral()) {
            if ($case->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Akses tidak diizinkan.',
                ], 403);
            }
        } elseif ($user->isTutor()) {
            // Tutor can only view if assigned to this case or if case is unassigned (waiting review)
            if ($case->tutor_id !== null && $case->tutor_id !== $user->id) {
                return response()->json([
                    'message' => 'Akses tidak diizinkan: Kasus ini ditangani oleh konselor lain.',
                ], 403);
            }
        } elseif (!$user->isAdmin()) {
            return response()->json([
                'message' => 'Akses tidak diizinkan.',
            ], 403);
        }

        // Mask private notes if viewed by student or admin
        if ($user->isStudent() || $user->isGeneral() || $user->isAdmin()) {
            foreach ($case->sessions as $session) {
                if ($session->note) {
                    $session->note->makeHidden('private_note');
                }
            }
        }

        // Only assigned tutors may load student's psychological screening questionnaire responses and detailed answers
        if ($user->isTutor()) {
            $case->user->load([
                'questionnaireResponses' => function ($q) {
                    $q->with([
                        'questionnaire:id,title,version,description',
                        'answers.question:id,question_text,category,order',
                        'answers.option:id,label,score'
                    ])->latest('submitted_at');
                }
            ]);
        }

        return response()->json([
            'data' => $case,
        ]);
    }

    /**
     * Tutor approves a counseling request
     * [FIX C1] Tutor hanya boleh approve kasus yang di-assign ke dirinya
     * [FIX C2] Status diset REVIEWED jika belum ada sesi, SCHEDULED jika sudah ada sesi
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $case = CounselingCase::with(['sessions', 'user'])->findOrFail($id);

        // [FIX C1] Tutor hanya boleh approve kasus miliknya, kecuali admin
        if ($user->isTutor() && $case->tutor_id !== null && $case->tutor_id !== $user->id) {
            return response()->json([
                'message' => 'Akses ditolak: Kasus ini tidak di-assign ke Anda.',
            ], 403);
        }

        // Jika tutor_id belum di-set, assign tutor yang melakukan approve
        if (!$case->tutor_id && $user->isTutor()) {
            $case->tutor_id = $user->id;
        }

        // [FIX C2] Status REVIEWED jika belum ada sesi terjadwal, SCHEDULED jika sudah ada
        $hasScheduledSession = $case->sessions->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])->isNotEmpty();
        $newStatus = $hasScheduledSession ? 'SCHEDULED' : 'REVIEWED';
        $case->status = $newStatus;
        $case->save();

        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'case_approved',
            'title' => 'Pengajuan Konseling Disetujui',
            'message' => $hasScheduledSession
                ? "Pengajuan konseling Anda ({$case->case_number}) telah disetujui oleh {$user->name}. Sesi Anda siap dilaksanakan sesuai jadwal."
                : "Pengajuan konseling Anda ({$case->case_number}) telah disetujui oleh {$user->name}. Silakan pilih jadwal sesi konseling Anda.",
        ]);

        return response()->json([
            'message' => 'Pengajuan konseling berhasil disetujui.',
            'data' => $case,
        ]);
    }

    /**
     * Cancel active (SCHEDULED/READY) sessions for a case and release their WIB availability slots.
     */
    private function cancelActiveSessionsAndReleaseSlots(CounselingCase $case): void
    {
        $activeSessions = $case->relationLoaded('sessions')
            ? $case->sessions->whereIn('status', ['SCHEDULED', 'READY'])
            : $case->sessions()->whereIn('status', ['SCHEDULED', 'READY'])->get();

        foreach ($activeSessions as $s) {
            $s->status = 'CANCELLED';
            $s->save();

            // Release slot in WIB (tutor_availabilities menyimpan tanggal & jam dalam Asia/Jakarta)
            $startWib = Carbon::parse($s->start_at)->timezone('Asia/Jakarta');
            TutorAvailability::where('tutor_id', $s->tutor_id)
                ->whereDate('date', $startWib->format('Y-m-d'))
                ->whereIn('start_time', [$startWib->format('H:i:s'), $startWib->format('H:i')])
                ->update(['status' => 'AVAILABLE']);
        }
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

        if ($user->isTutor() && $case->tutor_id !== null && $case->tutor_id !== $user->id) {
            return response()->json([
                'message' => 'Akses ditolak: Kasus ini ditangani oleh konselor lain.',
            ], 403);
        }

        if ($case->status === 'CLOSED') {
            return response()->json([
                'message' => 'Kasus ini sudah ditutup sebelumnya.',
            ], 422);
        }

        DB::transaction(function () use ($case, $user) {
            if (!$case->tutor_id && $user->isTutor()) {
                $case->tutor_id = $user->id;
            }
            $case->status = 'CLOSED';
            $case->closed_at = now();
            $case->save();

            $this->cancelActiveSessionsAndReleaseSlots($case);
        });

        $reason = $request->input('reason');

        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'case_rejected',
            'title' => 'Pembaruan Pengajuan Konseling',
            'message' => "Pengajuan konseling ({$case->case_number}) belum dapat disetujui oleh konselor. Catatan: {$reason}",
        ]);

        // ── [5] Kirim email notifikasi penolakan ke konseli ──────────────
        $case->loadMissing('user');
        try {
            \App\Services\CounselingMailService::sendRejectionEmail($case, $reason, $user->name);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("[reject] Gagal kirim email penolakan ke konseli: " . $e->getMessage());
        }

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

        if ($user->isTutor() && $case->tutor_id !== null && $case->tutor_id !== $user->id) {
            return response()->json([
                'message' => 'Akses ditolak: Kasus ini ditangani oleh konselor lain.',
            ], 403);
        }

        if ($case->status === 'CLOSED') {
            return response()->json([
                'message' => 'Kasus yang sudah ditutup tidak dapat diubah metodenya.',
            ], 422);
        }

        $suggestedMethod = strtoupper($request->input('suggested_method'));
        if ($suggestedMethod === strtoupper($case->method ?? '')) {
            return response()->json([
                'message' => 'Metode yang disarankan sudah sama dengan metode konseling saat ini.',
            ], 422);
        }

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

        if ($case->suggested_method_status !== 'PENDING' || empty($case->suggested_method)) {
            return response()->json([
                'message' => 'Tidak ada saran perubahan metode yang menunggu persetujuan pada kasus ini.',
            ], 422);
        }

        $action = $request->input('action');

        if ($action === 'accept') {
            DB::transaction(function () use ($case, $user) {
                $newMethod = strtoupper($case->suggested_method);

                if ($newMethod === 'ZOOM') {
                    foreach ($case->sessions as $s) {
                        if ($s->tutor_id && in_array($s->status, ['SCHEDULED', 'READY', 'IN_PROGRESS'], true)) {
                            CounselingSessionController::assertNoSlotConflicts(
                                (int) $s->tutor_id,
                                Carbon::parse($s->start_at)->utc(),
                                Carbon::parse($s->end_at)->utc(),
                                'ZOOM',
                                (int) $s->id
                            );
                        }
                    }
                }

                $case->method = $newMethod;
                $case->suggested_method_status = 'ACCEPTED';

                if ($case->method === 'OFFLINE') {
                    $case->location = 'Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2, Kampus Siber UINSSC';
                }

                foreach ($case->sessions as $s) {
                    $s->method = $newMethod;
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

                $case->save();
            });
        } else {
            DB::transaction(function () use ($case, $user) {
                $case->suggested_method_status = 'REJECTED';
                $case->save();

                if ($case->tutor_id) {
                    Notification::create([
                        'user_id' => $case->tutor_id,
                        'type' => 'method_suggestion_rejected',
                        'title' => 'Saran Perubahan Metode Ditolak',
                        'message' => "Mahasiswa {$user->name} tetap memilih menggunakan metode {$case->method}.",
                    ]);
                }
            });
        }

        return response()->json([
            'message' => $action === 'accept' ? 'Metode konseling berhasil diperbarui.' : 'Saran perubahan metode ditolak.',
            'data' => $case->fresh('sessions'),
        ]);
    }

    /**
     * Update case status (Tutor or Admin)
     * [FIX H2] Tutor hanya boleh update kasus yang di-assign ke dirinya
     * [FIX H2] Validasi whitelist transisi status yang diizinkan
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

        // Validate that the assigned tutor_id actually belongs to a TUTOR-role user
        if ($request->filled('tutor_id')) {
            $assignedTutor = User::find($request->input('tutor_id'));
            if (!$assignedTutor || !$assignedTutor->isTutor()) {
                return response()->json([
                    'message' => 'Penugasan gagal: pengguna yang dipilih bukan konselor.',
                ], 422);
            }
        }

        $case = CounselingCase::findOrFail($id);

        // [FIX H2] Tutor hanya boleh update status kasus yang di-assign ke dirinya
        if ($user->isTutor() && $case->tutor_id !== null && $case->tutor_id !== $user->id) {
            return response()->json([
                'message' => 'Akses ditolak: Kasus ini tidak di-assign ke Anda.',
            ], 403);
        }

        $oldStatus = $case->status;
        $newStatus = $request->input('status');

        // [FIX H2] Whitelist transisi status yang diizinkan per role
        $allowedTransitions = [
            'TUTOR' => [
                'NEW'                 => ['WAITING_REVIEW', 'REVIEWED', 'CLOSED'],
                'SCREENING_COMPLETED' => ['WAITING_REVIEW', 'REVIEWED', 'CLOSED'],
                'WAITING_REVIEW'      => ['REVIEWED', 'CLOSED'],
                'REVIEWED'            => ['WAITING_SCHEDULE', 'SCHEDULED', 'FOLLOW_UP', 'CLOSED'],
                'WAITING_SCHEDULE'    => ['SCHEDULED', 'FOLLOW_UP', 'CLOSED'],
                'SCHEDULED'           => ['IN_PROGRESS', 'FOLLOW_UP', 'CLOSED'],
                'IN_PROGRESS'         => ['FOLLOW_UP', 'CLOSED'],
                'FOLLOW_UP'           => ['WAITING_SCHEDULE', 'SCHEDULED', 'IN_PROGRESS', 'CLOSED'],
            ],
        ];

        if ($user->isTutor() && isset($allowedTransitions['TUTOR'][$oldStatus])) {
            if (!in_array($newStatus, $allowedTransitions['TUTOR'][$oldStatus], true)) {
                return response()->json([
                    'message' => "Transisi status dari {$oldStatus} ke {$newStatus} tidak diizinkan untuk konselor.",
                ], 422);
            }
        }

        DB::transaction(function () use ($case, $newStatus, $request) {
            $case->status = $newStatus;
            if ($request->filled('priority')) {
                $case->priority = $request->input('priority');
            }
            if ($request->filled('tutor_id')) {
                $case->tutor_id = $request->input('tutor_id');
            }
            if ($newStatus === 'CLOSED') {
                $case->closed_at = now();
                $this->cancelActiveSessionsAndReleaseSlots($case);
            }
            $case->save();
        });

        AuditLogService::log('change_case_status', 'CounselingCase', (string)$case->id, [
            'from' => $oldStatus,
            'to' => $newStatus,
        ], $user->id);

        return response()->json([
            'message' => 'Status kasus berhasil diperbarui.',
            'data' => $case,
        ]);
    }

    /**
     * Get comprehensive counselee diagnostic record for counselor/admin
     */
    public function studentDiagnostics(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isTutor()) {
            return response()->json(['message' => 'Akses ditolak: Hanya konselor yang dapat mengakses rekam diagnostik.'], 403);
        }

        // Verify this tutor is assigned to at least one case of this student
        $isAssigned = CounselingCase::where('user_id', $id)
            ->where('tutor_id', $user->id)
            ->exists();

        if (!$isAssigned) {
            return response()->json(['message' => 'Akses ditolak: Anda tidak memiliki penugasan kasus aktif dengan konseli ini.'], 403);
        }

        $student = User::with([
            'studentProfile',
            'generalProfile',
            'studentCases' => function ($q) {
                $q->with([
                    'topic:id,title',
                    'sessions' => function ($sq) {
                        $sq->with(['note', 'feedback'])->orderBy('start_at', 'desc');
                    },
                    'actionPlans' => function ($aq) {
                        $aq->with('tutor:id,name')->latest();
                    }
                ])->latest();
            },
            'questionnaireResponses' => function ($q) {
                $q->with([
                    'questionnaire:id,title,version,description',
                    'answers.question:id,question_text,category,order',
                    'answers.option:id,label,score'
                ])->latest('submitted_at');
            }
        ])->findOrFail($id);

        AuditLogService::log('view_student_diagnostics', 'User', (string)$student->id, [
            'viewed_by_tutor' => $user->id,
        ], $user->id);

        return response()->json([
            'data' => $student,
        ]);
    }
}
