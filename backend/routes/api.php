<?php

use App\Http\Controllers\Api\ActionPlanController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampusApiController;
use App\Http\Controllers\Api\CounselingCaseController;
use App\Http\Controllers\Api\CounselingChatController;
use App\Http\Controllers\Api\CounselingNoteController;
use App\Http\Controllers\Api\CounselingSessionController;
use App\Http\Controllers\Api\CounselingTopicController;
use App\Http\Controllers\Api\LandingContentController;
use App\Http\Controllers\Api\MoodCheckinController;
use App\Http\Controllers\Api\NaraVoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\QuestionnaireController;
use App\Http\Controllers\Api\SessionFeedbackController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\TtsController;
use App\Http\Controllers\Api\TutorProfileController;
use App\Http\Controllers\Api\TutorScheduleController;
use App\Http\Controllers\Api\ZoomController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register-student', [AuthController::class, 'registerStudent']);
    Route::post('/register-general', [AuthController::class, 'registerGeneral']);
});

// Landing Page Content (Public CMS)
Route::get('/landing-content', [LandingContentController::class, 'show']);

Route::post('/campus/lookup', [CampusApiController::class, 'lookup']);
Route::get('/questionnaires/active', [QuestionnaireController::class, 'getActive']);

// Nara Virtual Assistant Natural TTS Voice Stream
Route::get('/tts', [TtsController::class, 'stream']);
Route::get('/tts/voices', [TtsController::class, 'voices']);

// Nara Voice Recordings (Public active list & stream)
Route::get('/voice-recordings/active', [NaraVoiceController::class, 'publicActiveRecordings']);
Route::get('/voice-recordings/stream/{key}', [NaraVoiceController::class, 'stream']);

// Public Topics & Tutors for Jalur A & Jalur B
Route::get('/topics', [CounselingTopicController::class, 'index']);
Route::get('/topics/{id}', [CounselingTopicController::class, 'show']);
Route::get('/topics/{topicId}/counselors', [CounselingTopicController::class, 'getCounselorsByTopic']);
Route::get('/tutors/public', [TutorScheduleController::class, 'getTutors']);
Route::get('/tutors/public/{id}', [TutorScheduleController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & User
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Fast Aggregated Student Dashboard
    Route::get('/student/dashboard', [StudentDashboardController::class, 'getDashboardSummary']);

    // Mood Tracking
    Route::post('/mood/checkin', [MoodCheckinController::class, 'store']);
    Route::get('/mood/history', [MoodCheckinController::class, 'getHistory']);

    // Screening & Questionnaires
    Route::post('/questionnaires/{id}/submit', [QuestionnaireController::class, 'submit']);
    Route::get('/questionnaires/history', [QuestionnaireController::class, 'getHistory']);
    Route::get('/questionnaires/responses/{id}', [QuestionnaireController::class, 'getDetail']);

    // Counseling Cases
    Route::get('/cases', [CounselingCaseController::class, 'index']);
    Route::post('/cases', [CounselingCaseController::class, 'store']);
    Route::get('/cases/{id}', [CounselingCaseController::class, 'show']);
    Route::put('/cases/{id}/status', [CounselingCaseController::class, 'updateStatus']);
    Route::post('/cases/{id}/approve', [CounselingCaseController::class, 'approve']);
    Route::post('/cases/{id}/reject', [CounselingCaseController::class, 'reject']);
    Route::post('/cases/{id}/suggest-method', [CounselingCaseController::class, 'suggestMethod']);
    Route::post('/cases/{id}/respond-method-suggestion', [CounselingCaseController::class, 'respondMethodSuggestion']);

    // Tutor Schedules & Sessions
    Route::get('/tutor/students/{id}/diagnostics', [CounselingCaseController::class, 'studentDiagnostics']);
    Route::get('/tutor/my-profile', [TutorProfileController::class, 'getProfile']);
    Route::post('/tutor/my-profile', [TutorProfileController::class, 'updateProfile']);
    Route::put('/tutor/my-profile', [TutorProfileController::class, 'updateProfile']);

    Route::get('/tutors', [TutorScheduleController::class, 'getTutors']);
    Route::get('/tutors/{id}', [TutorScheduleController::class, 'show']);
    Route::get('/tutors/{id}/slots', [TutorScheduleController::class, 'getTutorSlots']);
    Route::post('/tutors/availability', [TutorScheduleController::class, 'setAvailability']);
    Route::delete('/tutors/availability/{slotId}', [TutorScheduleController::class, 'deleteAvailability']);

    Route::get('/sessions', [CounselingSessionController::class, 'index']);
    Route::post('/sessions/book', [CounselingSessionController::class, 'book']);
    Route::post('/sessions/instant', [CounselingSessionController::class, 'createInstantSession']);
    Route::get('/sessions/{id}', [CounselingSessionController::class, 'show']);
    Route::get('/sessions/{sessionId}/messages', [CounselingChatController::class, 'getMessages']);
    Route::post('/sessions/{sessionId}/messages', [CounselingChatController::class, 'sendMessage']);

    // Counseling Notes & Post-session
    Route::post('/sessions/{sessionId}/notes', [CounselingNoteController::class, 'store']);
    Route::get('/sessions/{sessionId}/notes', [CounselingNoteController::class, 'show']);

    // Post-counseling Session Feedback & Ratings
    Route::post('/sessions/{sessionId}/feedback', [SessionFeedbackController::class, 'store']);
    Route::get('/sessions/{sessionId}/feedback', [SessionFeedbackController::class, 'show']);
    Route::get('/tutor/ratings', [SessionFeedbackController::class, 'getTutorRatings']);

    // Counseling Action Plans / Homework
    Route::get('/action-plans', [ActionPlanController::class, 'index']);
    Route::post('/action-plans', [ActionPlanController::class, 'store']);
    Route::put('/action-plans/{id}', [ActionPlanController::class, 'update']);
    Route::delete('/action-plans/{id}', [ActionPlanController::class, 'destroy']);

    // Zoom Meeting SDK Signature
    Route::post('/zoom/signature', [ZoomController::class, 'getSignature']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Admin Operations
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'getDashboardStats']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::put('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::get('/audit-logs', [AdminController::class, 'getAuditLogs']);
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
        Route::post('/zoom/test-connection', [AdminController::class, 'testZoomConnection']);
        Route::put('/landing-content', [LandingContentController::class, 'update']);
        Route::post('/landing-content/reset', [LandingContentController::class, 'resetDefault']);

        // Nara Voice Recording Management
        Route::get('/voice-recordings', [NaraVoiceController::class, 'index']);
        Route::post('/voice-recordings', [NaraVoiceController::class, 'store']);
        Route::post('/voice-recordings/{key}/upload', [NaraVoiceController::class, 'upload']);
        Route::delete('/voice-recordings/{key}/audio', [NaraVoiceController::class, 'deleteAudio']);
        Route::put('/voice-recordings/{id}', [NaraVoiceController::class, 'update']);
        Route::delete('/voice-recordings/{id}', [NaraVoiceController::class, 'destroy']);
    });
});
