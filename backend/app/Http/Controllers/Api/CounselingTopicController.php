<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingTopic;
use App\Models\Tutor;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CounselingTopicController extends Controller
{
    /**
     * Get all active counseling topics
     */
    public function index()
    {
        $topics = CounselingTopic::where('is_active', true)
            ->orderBy('order')
            ->withCount('tutors')
            ->get();

        return response()->json([
            'data' => $topics,
        ]);
    }

    /**
     * Get single topic detail
     */
    public function show($id)
    {
        $topic = CounselingTopic::with(['tutors.user'])->findOrFail($id);

        return response()->json([
            'data' => $topic,
        ]);
    }

    /**
     * Jalur A: Get counselors matching a specific topic
     */
    public function getCounselorsByTopic(Request $request, $topicId)
    {
        $topic = CounselingTopic::findOrFail($topicId);

        // Fetch tutors who handle this topic
        $tutors = Tutor::whereHas('topics', function ($q) use ($topicId) {
                $q->where('counseling_topics.id', $topicId);
            })
            ->where('is_available', true)
            ->with([
                'user:id,name,email,avatar,role,status',
                'topics',
                'user.availabilities' => function ($q) {
                    $q->where('date', '>=', Carbon::today())
                      ->where('status', 'AVAILABLE')
                      ->orderBy('date')
                      ->orderBy('start_time');
                }
            ])
            ->get()
            ->map(function ($tutor) use ($topicId) {
                $user = $tutor->user;
                $matchingTopicPivot = $tutor->topics->firstWhere('id', (int)$topicId);
                $expertiseTags = [];
                if ($matchingTopicPivot && $matchingTopicPivot->pivot->expertise_tags) {
                    $raw = $matchingTopicPivot->pivot->expertise_tags;
                    $expertiseTags = is_array($raw) ? $raw : (json_decode($raw, true) ?: []);
                }

                $nextSlot = $user ? $user->availabilities->first() : null;

                // Methods supported
                $methodsSupported = ['CHAT', 'ZOOM', 'OFFLINE'];

                return [
                    'id' => $user ? $user->id : $tutor->id,
                    'tutor_profile_id' => $tutor->id,
                    'name' => $user ? $user->name : 'Konselor',
                    'email' => $user ? $user->email : null,
                    'avatar' => $user ? $user->avatar : null,
                    'nip' => $tutor->nip,
                    'specialization' => $tutor->specialization,
                    'bio' => $tutor->bio,
                    'is_available' => $tutor->is_available,
                    'expertise_tags' => $expertiseTags,
                    'supported_methods' => $methodsSupported,
                    'next_available_slot' => $nextSlot ? [
                        'id' => $nextSlot->id,
                        'date' => $nextSlot->date->format('Y-m-d'),
                        'start_time' => substr($nextSlot->start_time, 0, 5),
                        'end_time' => substr($nextSlot->end_time, 0, 5),
                        'method' => $nextSlot->method,
                    ] : null,
                    'total_available_slots' => $user ? $user->availabilities->count() : 0,
                ];
            });

        return response()->json([
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'slug' => $topic->slug,
                'tag' => $topic->tag,
                'icon' => $topic->icon,
                'description' => $topic->description,
            ],
            'counselors' => $tutors,
            'data' => $tutors,
        ]);
    }
}
