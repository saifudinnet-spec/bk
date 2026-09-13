<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MoodCheckin;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MoodCheckinController extends Controller
{
    /**
     * Submit daily mood checkin
     */
    public function store(Request $request)
    {
        $request->validate([
            'mood' => 'required|in:VERY_GOOD,GOOD,NEUTRAL,NOT_GOOD,BAD',
            'note' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        $checkin = MoodCheckin::create([
            'user_id' => $user->id,
            'mood' => $request->input('mood'),
            'note' => $request->input('note'),
        ]);

        return response()->json([
            'message' => 'Mood Anda hari ini berhasil disimpan.',
            'data' => $checkin,
        ], 201);
    }

    /**
     * Get user's today checkin and recent mood history
     */
    public function getHistory(Request $request)
    {
        $user = $request->user();

        $today = MoodCheckin::where('user_id', $user->id)
            ->whereDate('created_at', Carbon::today())
            ->latest()
            ->first();

        $history = MoodCheckin::where('user_id', $user->id)
            ->latest()
            ->take(14)
            ->get();

        return response()->json([
            'today' => $today,
            'history' => $history,
        ]);
    }
}
