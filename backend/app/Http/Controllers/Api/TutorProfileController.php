<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\CounselingTopic;
use App\Models\SessionFeedback;
use App\Models\Tutor;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TutorProfileController extends Controller
{
    /**
     * Get the authenticated tutor's full profile, assigned topics, all system topics, and statistics.
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();

        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya akun konselor/tutor yang dapat mengakses profil konselor.',
            ], 403);
        }

        $tProfile = $user->tutorProfile;
        if (!$tProfile) {
            $tProfile = Tutor::create([
                'user_id' => $user->id,
                'nip' => 'NIP-' . $user->id,
                'specialization' => 'Konselor Umum',
                'bio' => 'Konselor Ruang BK UINSSC.',
                'is_available' => true,
            ]);
        }

        $tProfile->load('topics');

        // All system active topics
        $allTopics = CounselingTopic::where('is_active', true)->orderBy('order')->get();

        // Map assigned topics
        $assignedTopics = $tProfile->topics->map(function ($t) {
            $raw = $t->pivot->expertise_tags;
            $tags = is_array($raw) ? $raw : (json_decode($raw, true) ?: []);
            return [
                'id' => $t->id,
                'title' => $t->title,
                'slug' => $t->slug,
                'tag' => $t->tag,
                'icon' => $t->icon,
                'description' => $t->description,
                'expertise_tags' => $tags,
            ];
        });

        // Calculate statistics
        $totalSessions = CounselingSession::where('tutor_id', $user->id)->count();
        $completedSessions = CounselingSession::where('tutor_id', $user->id)->where('status', 'COMPLETED')->count();
        $activeCases = CounselingCase::where('tutor_id', $user->id)->whereIn('status', ['APPROVED', 'SCHEDULED', 'IN_PROGRESS'])->count();

        // Calculate rating from session feedbacks
        $feedbacks = SessionFeedback::whereHas('session', function ($q) use ($user) {
            $q->where('tutor_id', $user->id);
        })->get();

        $averageRating = $feedbacks->count() > 0 ? round($feedbacks->avg('rating'), 1) : 5.0;
        $totalReviews = $feedbacks->count();

        // Extract distinct tags across assigned topics
        $allExpertiseTags = [];
        foreach ($assignedTopics as $at) {
            if (!empty($at['expertise_tags']) && is_array($at['expertise_tags'])) {
                foreach ($at['expertise_tags'] as $tag) {
                    if (!in_array($tag, $allExpertiseTags)) {
                        $allExpertiseTags[] = $tag;
                    }
                }
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar ?: $tProfile->photo,
                'role' => $user->role,
            ],
            'tutor' => [
                'id' => $tProfile->id,
                'nip' => $tProfile->nip,
                'specialization' => $tProfile->specialization,
                'bio' => $tProfile->bio,
                'photo' => $tProfile->photo ?: $user->avatar,
                'is_available' => (bool)$tProfile->is_available,
            ],
            'assigned_topics' => $assignedTopics,
            'assigned_topic_ids' => $tProfile->topics->pluck('id')->toArray(),
            'expertise_tags' => $allExpertiseTags,
            'all_topics' => $allTopics,
            'stats' => [
                'total_sessions' => $totalSessions,
                'completed_sessions' => $completedSessions,
                'active_cases' => $activeCases,
                'average_rating' => $averageRating,
                'total_reviews' => $totalReviews,
            ],
        ]);
    }

    /**
     * Update counselor profile (Name, phone, specialization, bio, photo, availability, and topics with expertise tags)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user->isTutor() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya akun konselor yang dapat memperbarui profil ini.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:30',
            'nip' => 'nullable|string|max:50',
            'specialization' => 'required|string|max:255',
            'bio' => 'nullable|string|max:3000',
            'is_available' => 'nullable|boolean',
            'avatar' => 'nullable|string|max:500',
            'photo' => 'nullable',
            'topic_ids' => 'nullable|array',
            'topic_ids.*' => 'integer|exists:counseling_topics,id',
            'expertise_tags' => 'nullable', // string comma-separated or array
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi pembaruan profil konselor gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tProfile = $user->tutorProfile;
        if (!$tProfile) {
            $tProfile = Tutor::create([
                'user_id' => $user->id,
                'nip' => $request->input('nip') ?: 'NIP-' . $user->id,
                'specialization' => $request->input('specialization'),
                'bio' => $request->input('bio'),
                'is_available' => true,
            ]);
        }

        // 1. Photo handling (File upload OR preset string URL)
        $photoUrl = $user->avatar ?: $tProfile->photo;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'counselor_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('counselors', $filename, 'public');
            $photoUrl = '/storage/' . $path;
        } elseif ($request->filled('avatar')) {
            $photoUrl = $request->input('avatar');
        } elseif ($request->filled('photo') && is_string($request->input('photo'))) {
            $photoUrl = $request->input('photo');
        }

        // 2. Update User basic info
        $user->name = trim($request->input('name'));
        if ($request->has('phone')) {
            $user->phone = trim($request->input('phone'));
        }
        $user->avatar = $photoUrl;
        $user->save();

        // 3. Update Tutor profile
        $tProfile->specialization = trim($request->input('specialization'));
        if ($request->has('bio')) {
            $tProfile->bio = trim($request->input('bio'));
        }
        if ($request->has('nip')) {
            $tProfile->nip = trim($request->input('nip'));
        }
        if ($request->has('is_available')) {
            $tProfile->is_available = filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN);
        }
        $tProfile->photo = $photoUrl;
        $tProfile->save();

        // 4. Update Topics & Expertise Tags
        if ($request->has('topic_ids')) {
            $topicIds = $request->input('topic_ids') ?: [];
            
            // Parse expertise tags
            $rawExpertise = $request->input('expertise_tags');
            $parsedTags = [];
            if (is_array($rawExpertise)) {
                $parsedTags = array_values(array_filter(array_map('trim', $rawExpertise)));
            } elseif (is_string($rawExpertise)) {
                $parsedTags = array_values(array_filter(array_map('trim', explode(',', $rawExpertise))));
            }

            $syncData = [];
            foreach ($topicIds as $tid) {
                $syncData[$tid] = [
                    'expertise_tags' => json_encode($parsedTags),
                ];
            }

            $tProfile->topics()->sync($syncData);
        }

        AuditLogService::log('update_counselor_profile', 'Tutor', (string)$tProfile->id, [
            'name' => $user->name,
            'specialization' => $tProfile->specialization,
        ], $user->id);

        return response()->json([
            'message' => 'Profil konselor berhasil diperbarui.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'profile' => [
                    'type' => 'tutor',
                    'nip' => $tProfile->nip,
                    'specialization' => $tProfile->specialization,
                    'bio' => $tProfile->bio,
                    'photo' => $tProfile->photo,
                    'is_available' => $tProfile->is_available,
                ],
            ],
        ]);
    }
}
