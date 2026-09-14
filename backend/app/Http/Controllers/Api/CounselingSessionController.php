<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingCase;
use App\Models\CounselingNote;
use App\Models\CounselingSession;
use App\Models\Notification;
use App\Models\TutorAvailability;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;

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

        $availability = TutorAvailability::where('id', $request->input('availability_id'))
            ->where('status', 'AVAILABLE')
            ->first();

        if (!$availability) {
            return response()->json(['message' => 'Slot jadwal ini sudah tidak tersedia.'], 409);
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

        // Create notification for student
        Notification::create([
            'user_id' => $case->user_id,
            'type' => 'booking_confirmed',
            'title' => 'Jadwal Konseling Terkonfirmasi',
            'message' => "Sesi Anda dijadwalkan pada " . $startAt->translatedFormat('d F Y, H:i') . " WIB.",
        ]);

        // Notification for tutor
        Notification::create([
            'user_id' => $availability->tutor_id,
            'type' => 'tutor_booking_received',
            'title' => 'Jadwal Konseling Baru',
            'message' => "Anda memiliki sesi konseling baru pada " . $startAt->translatedFormat('d F Y, H:i') . " WIB.",
        ]);

        AuditLogService::log('book_session', 'CounselingSession', (string)$session->id, [
            'case_number' => $case->case_number,
            'start_at' => $startAt->toIso8601String(),
        ], $user->id);

        return response()->json([
            'message' => 'Jadwal konseling berhasil dikonfirmasi.',
            'data' => $session->load(['counselingCase', 'tutor:id,name,email', 'user:id,name,email']),
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
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        // For tutors and admins, load student's psychological screening responses & answers
        if ($user->isTutor() || $user->isAdmin()) {
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
        $minutesUntilStart = $now->lt($startTime) ? $now->diffInMinutes($startTime) : 0;

        if ($user->isStudent() || $user->isGeneral()) {
            if ($session->note) {
                $session->note->makeHidden('private_note');
            }
        }

        return response()->json([
            'data' => $session,
            'can_join' => $canJoin,
            'minutes_until_start' => $minutesUntilStart,
            'is_in_time_window' => $now->lte($endTime),
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
