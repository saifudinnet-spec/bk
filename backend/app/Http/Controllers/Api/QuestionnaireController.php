<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Questionnaire;
use App\Models\QuestionnaireResponse;
use App\Models\ResponseAnswer;
use App\Services\AuditLogService;
use App\Services\ScreeningScoringService;
use Illuminate\Http\Request;

class QuestionnaireController extends Controller
{
    /**
     * Get active published questionnaire for students/general users
     */
    public function getActive()
    {
        $questionnaire = Questionnaire::with(['questions.options'])
            ->where('status', 'published')
            ->latest()
            ->first();

        if (!$questionnaire) {
            return response()->json([
                'message' => 'Saat ini belum ada kuesioner screening yang aktif.',
            ], 404);
        }

        return response()->json([
            'data' => $questionnaire,
        ]);
    }

    /**
     * Submit questionnaire screening responses
     */
    public function submit(Request $request, $id)
    {
        $request->validate([
            'answers' => 'required|array|min:1',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.option_id' => 'nullable|exists:question_options,id',
            'answers.*.text_answer' => 'nullable|string',
        ]);

        $user = $request->user();
        $questionnaire = Questionnaire::findOrFail($id);

        $result = ScreeningScoringService::processSubmission($questionnaire->id, $request->input('answers'));

        $response = QuestionnaireResponse::create([
            'user_id' => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'total_score' => $result['total_score'],
            'category_scores' => $result['category_scores'],
            'has_crisis_flag' => $result['has_crisis_flag'],
            'status' => 'SUBMITTED',
            'submitted_at' => now(),
        ]);

        foreach ($result['answers'] as $ans) {
            ResponseAnswer::create([
                'response_id' => $response->id,
                'question_id' => $ans['question_id'],
                'option_id' => $ans['option_id'],
                'score' => $ans['score'],
                'text_answer' => $ans['text_answer'],
            ]);
        }

        // Create internal notification
        Notification::create([
            'user_id' => $user->id,
            'type' => 'screening',
            'title' => 'Screening Berhasil Dikirim',
            'message' => 'Terima kasih telah meluangkan waktu. Jawaban Anda akan membantu tutor dalam proses bimbingan.',
        ]);

        AuditLogService::log('submit_screening', 'QuestionnaireResponse', (string)$response->id, [
            'has_crisis_flag' => $result['has_crisis_flag'],
        ], $user->id);

        return response()->json([
            'message' => 'Screening berhasil dikirim.',
            'info' => 'Jawaban Anda akan digunakan untuk membantu tutor memahami kebutuhan Anda.',
            'response_id' => $response->id,
            'submitted_at' => $response->submitted_at,
        ], 201);
    }

    /**
     * Get user's screening history
     */
    public function getHistory(Request $request)
    {
        $user = $request->user();

        $responses = QuestionnaireResponse::with('questionnaire:id,title,version')
            ->where('user_id', $user->id)
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'data' => $responses,
        ]);
    }

    /**
     * Get detail of a screening response
     */
    public function getDetail(Request $request, $id)
    {
        $user = $request->user();
        $response = QuestionnaireResponse::with(['questionnaire', 'answers.question', 'answers.option', 'user.studentProfile'])
            ->findOrFail($id);

        // Security check: Student can only view own; Tutor and Admin can view with log
        if (!$user->isTutor() && !$user->isAdmin() && $response->user_id !== $user->id) {
            return response()->json([
                'message' => 'Akses ditolak ke data screening ini.',
            ], 403);
        }

        if ($user->isTutor() || $user->isAdmin()) {
            AuditLogService::log('view_screening', 'QuestionnaireResponse', (string)$response->id, [
                'target_user_id' => $response->user_id,
            ], $user->id);
        }

        return response()->json([
            'data' => $response,
        ]);
    }
}
