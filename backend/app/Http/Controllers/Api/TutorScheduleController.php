<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingTopic;
use App\Models\Tutor;
use App\Models\TutorAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TutorScheduleController extends Controller
{
    /**
     * Get list of tutors with their profile, topics & availability preview
     */
    public function getTutors(Request $request)
    {
        $topicId = $request->query('topic_id');

        $query = User::where('role', 'TUTOR')
            ->where('status', 'active')
            ->with([
                'tutorProfile.topics',
                'availabilities' => function ($q) use ($request) {
                    $q->where('date', '>=', Carbon::today())
                      ->where('status', 'AVAILABLE');

                    if ($request->filled('method')) {
                        $method = strtoupper($request->query('method'));
                        $q->whereIn('method', [$method, 'ALL']);
                    }

                    $q->orderBy('date')->orderBy('start_time');
                }
            ]);

        if ($topicId) {
            $query->whereHas('tutorProfile.topics', function ($q) use ($topicId) {
                $q->where('counseling_topics.id', $topicId);
            });
        }

        $tutors = $query->get()->map(function ($tutor) use ($topicId) {
            $tProfile = $tutor->tutorProfile;
            $nextSlot = $tutor->availabilities->first();

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
                'total_available_slots' => $tutor->availabilities->count(),
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
        $user = User::where('role', 'TUTOR')
            ->with([
                'tutorProfile.topics',
                'availabilities' => function ($q) {
                    $q->where('date', '>=', Carbon::today())
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

        $nextSlot = $user->availabilities->first();

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
            'total_available_slots' => $user->availabilities->count(),
        ];

        return response()->json([
            'data' => $counselor,
        ]);
    }

    /**
     * Get available dates and slots for a specific tutor, filtered by method
     */
    public function getTutorSlots(Request $request, $tutorId)
    {
        $query = TutorAvailability::where('tutor_id', $tutorId)
            ->where('date', '>=', Carbon::today());

        if (!$request->boolean('include_booked') && !$request->boolean('all_statuses')) {
            $query->where('status', 'AVAILABLE');
        }

        if ($request->filled('method')) {
            $method = strtoupper($request->query('method'));
            $query->where(function ($q) use ($method) {
                $q->whereIn('method', [$method, 'ALL']);
                if (in_array($method, ['CHAT', 'ZOOM'])) {
                    $q->orWhere('method', 'ONLINE');
                }
            });
        }

        $slots = $query->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->groupBy(function ($item) {
                return $item->date->format('Y-m-d');
            });

        return response()->json([
            'tutor_id' => (int)$tutorId,
            'grouped_by_date' => $slots,
        ]);
    }

    /**
     * Tutor manages their own availability slots
     */
    public function setAvailability(Request $request)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'slots' => 'required|array|min:1',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time' => 'required|date_format:H:i|after:slots.*.start_time',
            'slots.*.method' => 'nullable|in:ALL,ONLINE,CHAT,ZOOM,OFFLINE',
            'slot_duration' => 'nullable|integer|min:30|max:120',
        ]);

        $user = $request->user();
        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json(['message' => 'Hanya konselor/tutor yang dapat mengatur ketersediaan jadwal.'], 403);
        }

        $date = $request->input('date');
        $duration = $request->input('slot_duration', 60);

        $createdSlots = [];
        foreach ($request->input('slots') as $slot) {
            $createdSlots[] = TutorAvailability::create([
                'tutor_id' => $user->id,
                'date' => $date,
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'method' => $slot['method'] ?? 'ALL',
                'slot_duration' => $duration,
                'status' => 'AVAILABLE',
            ]);
        }

        return response()->json([
            'message' => 'Jadwal ketersediaan berhasil ditambahkan.',
            'data' => $createdSlots,
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
