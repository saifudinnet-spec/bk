<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselingActionPlan;
use App\Models\CounselingCase;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ActionPlanController extends Controller
{
    /**
     * Get action plans list
     */
    public function index(Request $request)
    {
        $user = $request->user() ?? Auth::user();
        $query = CounselingActionPlan::with([
            'counselingCase:id,case_number,category',
            'tutor:id,name',
            'user:id,name',
        ]);

        if ($user->isStudent() || $user->isGeneral()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isTutor()) {
            // Tutor can only view tasks they assigned or are responsible for
            $query->where('tutor_id', $user->id);
            if ($request->has('case_id')) {
                $query->where('counseling_case_id', $request->query('case_id'));
            } elseif ($request->has('user_id')) {
                $query->where('user_id', $request->query('user_id'));
            }
        } elseif ($user->isAdmin()) {
            if ($request->has('case_id')) {
                $query->where('counseling_case_id', $request->query('case_id'));
            }
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $items = $query->orderByRaw("FIELD(status, 'PENDING', 'IN_PROGRESS', 'COMPLETED')")
            ->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $items,
            'summary' => [
                'total' => $items->count(),
                'completed' => $items->where('status', 'COMPLETED')->count(),
                'in_progress' => $items->where('status', 'IN_PROGRESS')->count(),
                'pending' => $items->where('status', 'PENDING')->count(),
            ],
        ]);
    }

    /**
     * Create a new action plan item (by counselor or student)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'counseling_case_id' => 'required|exists:counseling_cases,id',
            'session_id' => 'nullable|exists:counseling_sessions,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $case = CounselingCase::findOrFail($request->input('counseling_case_id'));
        $user = $request->user() ?? Auth::user();

        // Permission: Must be the case's client, assigned tutor, or admin
        if ($user->id !== $case->user_id && $user->id !== $case->tutor_id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk menambahkan rencana aksi pada kasus ini.',
            ], 403);
        }

        $actionPlan = CounselingActionPlan::create([
            'counseling_case_id' => $case->id,
            'session_id' => $request->input('session_id'),
            'user_id' => $case->user_id,
            'tutor_id' => $user->isTutor() ? $user->id : $case->tutor_id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'category' => $request->input('category', 'Self-Care'),
            'due_date' => $request->input('due_date'),
            'status' => 'PENDING',
        ]);

        AuditLogService::log('create_action_plan', 'CounselingActionPlan', (string)$actionPlan->id, [
            'case_id' => $case->id,
            'title' => $actionPlan->title,
        ], $user->id);

        return response()->json([
            'message' => 'Rencana aksi / tugas mandiri berhasil ditambahkan.',
            'data' => $actionPlan->load(['tutor:id,name', 'counselingCase:id,case_number,category']),
        ], 201);
    }

    /**
     * Update action plan status or notes
     */
    public function update(Request $request, $id)
    {
        $item = CounselingActionPlan::findOrFail($id);
        $user = $request->user() ?? Auth::user();

        if ($user->id !== $item->user_id && $user->id !== $item->tutor_id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk mengubah rencana aksi ini.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:PENDING,IN_PROGRESS,COMPLETED',
            'student_notes' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $dataToUpdate = [];

        // Status update
        if ($request->has('status')) {
            $newStatus = $request->input('status');
            $dataToUpdate['status'] = $newStatus;
            if ($newStatus === 'COMPLETED') {
                $dataToUpdate['completed_at'] = now();
            } elseif ($newStatus === 'PENDING') {
                $dataToUpdate['completed_at'] = null;
            }
        }

        // Student reflection / progress notes
        if ($request->has('student_notes')) {
            $dataToUpdate['student_notes'] = $request->input('student_notes');
        }

        // Counselor editing fields
        if ($user->isTutor() || $user->isAdmin()) {
            if ($request->has('title')) $dataToUpdate['title'] = $request->input('title');
            if ($request->has('description')) $dataToUpdate['description'] = $request->input('description');
            if ($request->has('category')) $dataToUpdate['category'] = $request->input('category');
            if ($request->has('due_date')) $dataToUpdate['due_date'] = $request->input('due_date');
        }

        $item->update($dataToUpdate);

        return response()->json([
            'message' => 'Rencana aksi berhasil diperbarui.',
            'data' => $item->fresh(['tutor:id,name', 'counselingCase:id,case_number,category']),
        ]);
    }

    /**
     * Delete an action plan item
     */
    public function destroy($id)
    {
        $item = CounselingActionPlan::findOrFail($id);
        $user = Auth::user();

        if ($user->id !== $item->tutor_id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya konselor yang menugaskan atau admin yang dapat menghapus rencana aksi.',
            ], 403);
        }

        $item->delete();

        return response()->json([
            'message' => 'Rencana aksi berhasil dihapus.',
        ]);
    }
}
