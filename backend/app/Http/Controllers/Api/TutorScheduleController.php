<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingSession;
use App\Models\CounselingTopic;
use App\Models\Tutor;
use App\Models\TutorAvailability;
use App\Models\User;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TutorScheduleController extends Controller
{
    /**
     * Definisi 3 sesi konseling harian (WIB)
     */
    public const SESSION_RANGES = [
        'morning'   => ['start' => '08:00', 'end' => '11:00'],
        'afternoon' => ['start' => '11:00', 'end' => '14:00'],
        'evening'   => ['start' => '14:00', 'end' => '18:00'],
    ];

    public const SLOT_DURATION_MINUTES = 30;

    /**
     * Tentukan periode sesi ('morning' | 'afternoon' | 'evening') dari jam mulai WIB.
     */
    public static function resolveSessionPeriod(string $startTime): string
    {
        $hhmm = substr($startTime, 0, 5);
        if ($hhmm < '11:00') {
            return 'morning';
        }
        if ($hhmm < '14:00') {
            return 'afternoon';
        }
        return 'evening';
    }

    /**
     * Filter query TutorAvailability berdasarkan metode konseling.
     */
    private static function applyMethodFilter($query, string $method): void
    {
        $method = strtoupper($method);
        $query->where(function ($q) use ($method) {
            $q->whereIn('method', [$method, 'ALL']);
            if (in_array($method, ['CHAT', 'ZOOM'], true)) {
                $q->orWhere('method', 'ONLINE');
            }
        });
    }

    /**
     * Cek apakah rentang UTC [$startUtc, $endUtc] bertumpang tindih dengan daftar sesi aktif.
     */
    private static function hasSessionOverlap(Carbon $startUtc, Carbon $endUtc, $sessions): bool
    {
        foreach ($sessions as $session) {
            $sessStart = Carbon::parse($session->start_at)->utc();
            $sessEnd   = Carbon::parse($session->end_at)->utc();
            if ($startUtc->lt($sessEnd) && $endUtc->gt($sessStart)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate slot 30 menitan untuk seorang konselor berdasarkan template hari & sesi (WIB).
     */
    public static function applyScheduleTemplateForTutor(
        int $tutorId,
        array $days,
        array $sessions,
        string $method = 'ALL',
        int $weeksAhead = 4,
        bool $replaceExisting = false
    ): array {
        $normalizedDays = array_map('intval', $days);
        $method         = strtoupper($method ?: 'ALL');
        $startDate      = Carbon::today('Asia/Jakarta');
        $endDate        = Carbon::today('Asia/Jakarta')->addWeeks($weeksAhead);
        $startDateStr   = $startDate->toDateString();
        $endDateStr     = $endDate->toDateString();

        if ($replaceExisting) {
            TutorAvailability::where('tutor_id', $tutorId)
                ->whereDate('date', '>=', $startDateStr)
                ->whereDate('date', '<=', $endDateStr)
                ->where('status', 'AVAILABLE')
                ->delete();
        }

        // Ambil slot yang tersisa/sudah ada pada rentang tanggal ini (1 query untuk cegah N+1)
        $existingByDate = [];
        $existingSlots = TutorAvailability::where('tutor_id', $tutorId)
            ->whereDate('date', '>=', $startDateStr)
            ->whereDate('date', '<=', $endDateStr)
            ->get(['date', 'start_time', 'end_time']);

        foreach ($existingSlots as $ex) {
            $dKey = $ex->date->format('Y-m-d');
            $existingByDate[$dKey][] = [
                substr($ex->start_time, 0, 5),
                substr($ex->end_time, 0, 5),
            ];
        }

        $nowTs        = Carbon::now('UTC');
        $rowsToInsert = [];
        $created      = 0;
        $skipped      = 0;
        $current      = $startDate->copy();

        while ($current->lte($endDate)) {
            $dayOfWeek = (int) $current->format('N'); // 1=Senin .. 7=Minggu
            if (in_array($dayOfWeek, $normalizedDays, true)) {
                $dateStr = $current->toDateString();

                foreach ($sessions as $sessionKey) {
                    if (!isset(self::SESSION_RANGES[$sessionKey])) {
                        continue;
                    }
                    $range    = self::SESSION_RANGES[$sessionKey];
                    $cursor   = Carbon::parse($dateStr . ' ' . $range['start'], 'Asia/Jakarta');
                    $rangeEnd = Carbon::parse($dateStr . ' ' . $range['end'], 'Asia/Jakarta');

                    while ($cursor->copy()->addMinutes(self::SLOT_DURATION_MINUTES)->lte($rangeEnd)) {
                        $subStart = $cursor->format('H:i');
                        $subEnd   = $cursor->copy()->addMinutes(self::SLOT_DURATION_MINUTES)->format('H:i');

                        $overlaps = false;
                        foreach ($existingByDate[$dateStr] ?? [] as [$exStart, $exEnd]) {
                            if ($exStart < $subEnd && $exEnd > $subStart) {
                                $overlaps = true;
                                break;
                            }
                        }

                        if ($overlaps) {
                            $skipped++;
                        } else {
                            $rowsToInsert[] = [
                                'tutor_id'      => $tutorId,
                                'date'          => $dateStr,
                                'start_time'    => $subStart . ':00',
                                'end_time'      => $subEnd . ':00',
                                'method'        => $method,
                                'slot_duration' => self::SLOT_DURATION_MINUTES,
                                'status'        => 'AVAILABLE',
                                'created_at'    => $nowTs,
                                'updated_at'    => $nowTs,
                            ];
                            $existingByDate[$dateStr][] = [$subStart, $subEnd];
                            $created++;
                        }

                        $cursor->addMinutes(self::SLOT_DURATION_MINUTES);
                    }
                }
            }

            $current->addDay();
        }

        foreach (array_chunk($rowsToInsert, 500) as $chunk) {
            TutorAvailability::insert($chunk);
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'from'    => $startDateStr,
            'to'      => $endDateStr,
        ];
    }

    /**
     * Get list of tutors with their profile, topics & availability preview
     */
    public function getTutors(Request $request)
    {
        $topicId  = $request->query('topic_id');
        $todayWib = Carbon::today('Asia/Jakarta')->toDateString();
        $nowUtc   = Carbon::now('UTC');

        $query = User::where('role', 'TUTOR')
            ->where('status', 'active')
            ->with([
                'tutorProfile.topics',
                'availabilities' => function ($q) use ($request, $todayWib) {
                    $q->whereDate('date', '>=', $todayWib)
                      ->where('status', 'AVAILABLE');

                    if ($request->filled('method')) {
                        self::applyMethodFilter($q, $request->query('method'));
                    }

                    $q->orderBy('date')->orderBy('start_time');
                }
            ]);

        if ($topicId) {
            $query->whereHas('tutorProfile.topics', function ($q) use ($topicId) {
                $q->where('counseling_topics.id', $topicId);
            });
        }

        $tutors = $query->get()->map(function ($tutor) use ($topicId, $nowUtc) {
            $tProfile = $tutor->tutorProfile;
            $futureSlots = $tutor->availabilities->filter(function ($slot) use ($nowUtc) {
                $startUtc = Carbon::parse($slot->date->format('Y-m-d') . ' ' . substr($slot->start_time, 0, 5), 'Asia/Jakarta')->utc();
                return $startUtc->gt($nowUtc);
            })->values();
            $nextSlot = $futureSlots->first();

            $topicsList = [];
            $matchingExpertise = [];
            if ($tProfile && $tProfile->topics) {
                foreach ($tProfile->topics as $tp) {
                    $raw = $tp->pivot->expertise_tags;
                    $tags = is_array($raw) ? $raw : (json_decode($raw, true) ?: []);
                    $topicsList[] = [
                        'id' => $tp->id,
                        'title' => $tp->title,
                        'slug' => $tp->slug,
                        'tag' => $tp->tag,
                        'icon' => $tp->icon,
                        'expertise_tags' => $tags,
                    ];
                    if ($topicId && $tp->id == (int)$topicId) {
                        $matchingExpertise = $tags;
                    }
                }
            }

            $photo = $tProfile?->photo ?: $tutor->avatar ?: (
                (stripos($tutor->name, 'nurlina') !== false || stripos($tutor->name, 'dian') !== false)
                    ? '/images/counselor_dian.jpg'
                    : (stripos($tutor->name, 'bambang') !== false
                        ? '/images/counselor_bambang.jpg'
                        : '/images/counselor_ahmad.jpg')
            );

            return [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'email' => $tutor->email,
                'avatar' => $photo,
                'photo' => $photo,
                'nip' => $tProfile ? $tProfile->nip : null,
                'specialization' => $tProfile ? $tProfile->specialization : 'Konselor Umum',
                'bio' => $tProfile?->bio ?? '',
                'is_available' => $tProfile ? $tProfile->is_available : true,
                'topics' => $topicsList,
                'matching_expertise' => $matchingExpertise,
                'supported_methods' => ['CHAT', 'ZOOM', 'OFFLINE'],
                'service_days' => 'Senin – Jumat',
                'next_available_slot' => $nextSlot ? [
                    'id' => $nextSlot->id,
                    'date' => $nextSlot->date->format('Y-m-d'),
                    'start_time' => substr($nextSlot->start_time, 0, 5),
                    'end_time' => substr($nextSlot->end_time, 0, 5),
                    'method' => $nextSlot->method,
                ] : null,
                'total_available_slots' => $futureSlots->count(),
            ];
        });

        return response()->json([
            'data' => $tutors,
        ]);
    }

    /**
     * Jalur B: Get detailed profile of a counselor
     */
    public function show(Request $request, $id)
    {
        $todayWib = Carbon::today('Asia/Jakarta')->toDateString();
        $nowUtc   = Carbon::now('UTC');

        $user = User::where('role', 'TUTOR')
            ->with([
                'tutorProfile.topics',
                'availabilities' => function ($q) use ($todayWib) {
                    $q->whereDate('date', '>=', $todayWib)
                      ->where('status', 'AVAILABLE')
                      ->orderBy('date')
                      ->orderBy('start_time');
                }
            ])
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                  ->orWhereHas('tutorProfile', function ($sub) use ($id) {
                      $sub->where('id', $id);
                  });
            })
            ->firstOrFail();

        $tProfile = $user->tutorProfile;
        $topicsList = [];
        if ($tProfile && $tProfile->topics) {
            foreach ($tProfile->topics as $tp) {
                $raw = $tp->pivot->expertise_tags;
                $tags = is_array($raw) ? $raw : (json_decode($raw, true) ?: []);
                $topicsList[] = [
                    'id' => $tp->id,
                    'title' => $tp->title,
                    'slug' => $tp->slug,
                    'tag' => $tp->tag,
                    'icon' => $tp->icon,
                    'description' => $tp->description,
                    'expertise_tags' => $tags,
                ];
            }
        }

        $futureSlots = $user->availabilities->filter(function ($slot) use ($nowUtc) {
            $startUtc = Carbon::parse($slot->date->format('Y-m-d') . ' ' . substr($slot->start_time, 0, 5), 'Asia/Jakarta')->utc();
            return $startUtc->gt($nowUtc);
        })->values();
        $nextSlot = $futureSlots->first();

        $photo = $tProfile?->photo ?: $user->avatar ?: (
            (stripos($user->name, 'nurlina') !== false || stripos($user->name, 'dian') !== false)
                ? '/images/counselor_dian.jpg'
                : (stripos($user->name, 'bambang') !== false
                    ? '/images/counselor_bambang.jpg'
                    : '/images/counselor_ahmad.jpg')
        );

        $counselor = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $photo,
            'photo' => $photo,
            'nip' => $tProfile ? $tProfile->nip : null,
            'specialization' => $tProfile ? $tProfile->specialization : 'Konselor Kampus',
            'bio' => $tProfile?->bio ?? '',
            'is_available' => $tProfile ? $tProfile->is_available : true,
            'topics' => $topicsList,
            'supported_methods' => [
                ['id' => 'CHAT', 'name' => 'Chat Konseling', 'desc' => 'Ruang percakapan pribadi via teks interaktif'],
                ['id' => 'ZOOM', 'name' => 'Video Konseling', 'desc' => 'Sesi tatap maya via Zoom terintegrasi'],
                ['id' => 'OFFLINE', 'name' => 'Tatap Muka Langsung', 'desc' => 'Pertemuan fisik di Ruang BK Kampus'],
            ],
            'service_days' => 'Senin – Jumat (08:30 – 16:00 WIB)',
            'location_info' => 'Gedung Pusat Layanan Kemahasiswaan Lt. 2, Kampus Siber UINSSC',
            'next_available_slot' => $nextSlot ? [
                'id' => $nextSlot->id,
                'date' => $nextSlot->date->format('Y-m-d'),
                'start_time' => substr($nextSlot->start_time, 0, 5),
                'end_time' => substr($nextSlot->end_time, 0, 5),
                'method' => $nextSlot->method,
            ] : null,
            'total_available_slots' => $futureSlots->count(),
        ];

        return response()->json([
            'data' => $counselor,
        ]);
    }

    /**
     * Get available dates and slots for a specific tutor, filtered by method.
     * Slots dikelompokkan per tanggal dalam format WIB (Asia/Jakarta), termasuk deteksi konflik Zoom lintas konselor.
     */
    public function getTutorSlots(Request $request, $tutorId)
    {
        $todayWib        = Carbon::today('Asia/Jakarta')->toDateString();
        $nowUtc          = Carbon::now('UTC');
        $includeBooked   = $request->boolean('include_booked') || $request->boolean('all_statuses');
        $requestedMethod = $request->filled('method') ? strtoupper($request->query('method')) : null;

        $query = TutorAvailability::where('tutor_id', $tutorId)
            ->whereDate('date', '>=', $todayWib);

        if (!$includeBooked) {
            $query->whereIn('status', ['AVAILABLE', 'BOOKED']);
        }

        if ($requestedMethod) {
            self::applyMethodFilter($query, $requestedMethod);
        }

        $tutorActiveSessions = collect();
        $globalZoomSessions  = collect();

        if (!$includeBooked) {
            $tutorActiveSessions = CounselingSession::where('tutor_id', $tutorId)
                ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
                ->where('end_at', '>', $nowUtc)
                ->whereDoesntHave('counselingCase', fn ($q) => $q->where('case_number', 'LIKE', 'TEST-%'))
                ->get(['id', 'tutor_id', 'start_at', 'end_at', 'method']);

            if ($requestedMethod === 'ZOOM') {
                $globalZoomSessions = CounselingSession::where('method', 'ZOOM')
                    ->whereIn('status', ['SCHEDULED', 'READY', 'IN_PROGRESS'])
                    ->where('end_at', '>', $nowUtc)
                    ->whereDoesntHave('counselingCase', fn ($q) => $q->where('case_number', 'LIKE', 'TEST-%'))
                    ->get(['id', 'tutor_id', 'start_at', 'end_at', 'method']);
            }
        }

        $mapped = $query->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($slot) use ($includeBooked, $nowUtc, $requestedMethod, $tutorActiveSessions, $globalZoomSessions) {
                $dateStr = $slot->date->format('Y-m-d');
                $startHm = substr($slot->start_time, 0, 5);
                $endHm   = substr($slot->end_time, 0, 5);

                $startUtc = Carbon::parse($dateStr . ' ' . $startHm, 'Asia/Jakarta')->utc();
                $endUtc   = Carbon::parse($dateStr . ' ' . $endHm, 'Asia/Jakarta')->utc();

                if (!$includeBooked && $startUtc->lte($nowUtc)) {
                    return null;
                }

                $effectiveStatus = $slot->status;
                $conflictReason  = null;

                if (!$includeBooked) {
                    if ($effectiveStatus === 'BOOKED') {
                        $conflictReason = 'Slot sudah dibooking oleh konseli lain.';
                    } elseif (self::hasSessionOverlap($startUtc, $endUtc, $tutorActiveSessions)) {
                        $effectiveStatus = 'BOOKED';
                        $conflictReason  = 'Konselor sudah memiliki sesi terjadwal di jam ini.';
                    } elseif ($requestedMethod === 'ZOOM' && self::hasSessionOverlap($startUtc, $endUtc, $globalZoomSessions)) {
                        $effectiveStatus = 'ZOOM_CONFLICT';
                        $conflictReason  = 'Jadwal Zoom pada jam ini sudah terisi oleh sesi konseling lain.';
                    }
                }

                return [
                    'id'              => $slot->id,
                    'tutor_id'        => $slot->tutor_id,
                    'date'            => $dateStr,
                    'start_time'      => $startHm,
                    'end_time'        => $endHm,
                    'slot_duration'   => $slot->slot_duration,
                    'method'          => $slot->method,
                    'status'          => $effectiveStatus,
                    'conflict_reason' => $conflictReason,
                    'session_period'  => self::resolveSessionPeriod($startHm),
                ];
            })
            ->filter()
            ->values();

        $grouped = $mapped->groupBy('date')->map(fn ($daySlots) => $daySlots->values());

        if (!$includeBooked) {
            $grouped = $grouped->filter(function ($daySlots) {
                return $daySlots->contains(fn ($s) => $s['status'] === 'AVAILABLE');
            });
        }

        return response()->json([
            'tutor_id'        => (int) $tutorId,
            'grouped_by_date' => $grouped->isEmpty() ? (object) [] : $grouped,
        ]);
    }

    /**
     * Tutor applies a recurring weekly schedule template (30-min slots per Pagi/Siang/Sore session)
     */
    public function setTemplate(Request $request)
    {
        $user = $request->user();
        if (!$user || (!$user->isTutor() && !$user->isAdmin())) {
            return response()->json(['message' => 'Hanya konselor yang dapat mengatur template jadwal.'], 403);
        }

        $validated = $request->validate([
            'days'             => 'required|array|min:1',
            'days.*'           => 'in:1,2,3,4,5,6',
            'sessions'         => 'required|array|min:1',
            'sessions.*'       => 'in:morning,afternoon,evening',
            'method'           => 'nullable|in:ALL,ONLINE,CHAT,ZOOM,OFFLINE',
            'weeks_ahead'      => 'nullable|integer|min:1|max:12',
            'replace_existing' => 'nullable|boolean',
        ]);

        $days            = $validated['days'];
        $sessions        = $validated['sessions'];
        $method          = $validated['method'] ?? 'ALL';
        $weeksAhead      = (int) ($validated['weeks_ahead'] ?? 4);
        $replaceExisting = $request->boolean('replace_existing', false);

        $result = self::applyScheduleTemplateForTutor(
            (int) $user->id,
            $days,
            $sessions,
            $method,
            $weeksAhead,
            $replaceExisting
        );

        AuditLogService::log('tutor_set_schedule_template', 'TutorAvailability', (string) $user->id, [
            'tutor_id'    => $user->id,
            'days'        => $days,
            'sessions'    => $sessions,
            'method'      => $method,
            'weeks_ahead' => $weeksAhead,
            'created'     => $result['created'],
            'skipped'     => $result['skipped'],
        ], $user->id);

        return response()->json([
            'message' => "Template jadwal berhasil diterapkan. {$result['created']} slot 30 menit dibuat, {$result['skipped']} slot dilewati.",
            'created' => $result['created'],
            'skipped' => $result['skipped'],
        ]);
    }

    /**
     * Tutor clears all AVAILABLE (unbooked) slots in a date range
     */
    public function clearMySlots(Request $request)
    {
        $user = $request->user();
        if (!$user || (!$user->isTutor() && !$user->isAdmin())) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $from = $request->query('from', Carbon::today('Asia/Jakarta')->toDateString());
        $to   = $request->query('to', Carbon::today('Asia/Jakarta')->addWeeks(12)->toDateString());

        $deleted = TutorAvailability::where('tutor_id', $user->id)
            ->where('status', 'AVAILABLE')
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to)
            ->delete();

        AuditLogService::log('tutor_clear_slots', 'TutorAvailability', (string) $user->id, [
            'from'    => $from,
            'to'      => $to,
            'deleted' => $deleted,
        ], $user->id);

        return response()->json([
            'message' => "{$deleted} slot jadwal kosong berhasil dihapus.",
            'deleted' => $deleted,
        ]);
    }

    /**
     * Tutor manages their own availability slots for a specific date
     */
    public function setAvailability(Request $request)
    {
        $todayWib = Carbon::today('Asia/Jakarta')->toDateString();

        $request->validate([
            'date'               => ['required', 'date', 'after_or_equal:' . $todayWib],
            'slots'              => 'required|array|min:1',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time'   => 'required|date_format:H:i|after:slots.*.start_time',
            'slots.*.method'     => 'nullable|in:ALL,ONLINE,CHAT,ZOOM,OFFLINE',
            'slot_duration'      => 'nullable|integer|min:15|max:120',
            'replace_existing'   => 'nullable|boolean',
        ]);

        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Hanya konselor/tutor yang dapat mengatur ketersediaan jadwal.'], 403);
        }

        $date            = Carbon::parse($request->input('date'))->format('Y-m-d');
        $duration        = (int) $request->input('slot_duration', self::SLOT_DURATION_MINUTES);
        $replaceExisting = $request->boolean('replace_existing', false);

        if ($replaceExisting) {
            TutorAvailability::where('tutor_id', $user->id)
                ->whereDate('date', $date)
                ->where('status', 'AVAILABLE')
                ->delete();
        }

        $createdSlots = [];
        foreach ($request->input('slots') as $slot) {
            $startHi  = substr($slot['start_time'], 0, 5);
            $startHis = $startHi . ':00';
            $endHis   = substr($slot['end_time'], 0, 5) . ':00';

            $existing = TutorAvailability::where('tutor_id', $user->id)
                ->whereDate('date', $date)
                ->whereIn('start_time', [$startHis, $startHi])
                ->exists();

            if ($existing) {
                continue;
            }

            $createdSlots[] = TutorAvailability::create([
                'tutor_id'      => $user->id,
                'date'          => $date,
                'start_time'    => $startHis,
                'end_time'      => $endHis,
                'method'        => strtoupper($slot['method'] ?? 'ALL'),
                'slot_duration' => $duration,
                'status'        => 'AVAILABLE',
            ]);
        }

        return response()->json([
            'message' => count($createdSlots) . ' slot jadwal berhasil ditambahkan.',
            'data'    => $createdSlots,
        ], 201);
    }

    /**
     * Tutor deletes an unbooked availability slot
     */
    public function deleteAvailability(Request $request, $slotId)
    {
        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $slot = TutorAvailability::where('id', $slotId)
            ->where('tutor_id', $user->id)
            ->first();

        if (!$slot) {
            return response()->json(['message' => 'Slot jadwal tidak ditemukan atau bukan milik Anda.'], 404);
        }

        if ($slot->status === 'BOOKED') {
            return response()->json(['message' => 'Slot ini sudah dibooking oleh mahasiswa dan tidak dapat dihapus.'], 400);
        }

        $slot->delete();

        return response()->json([
            'message' => 'Slot jadwal berhasil dihapus.',
        ]);
    }
}
