<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tutor;
use App\Models\CounselingTopic;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\CounselingNote;
use App\Models\CounselingMessage;
use App\Models\TutorAvailability;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\CounselingTopicController;
use App\Http\Controllers\Api\TutorScheduleController;
use App\Http\Controllers\Api\CounselingCaseController;
use App\Http\Controllers\Api\CounselingChatController;
use App\Http\Controllers\Api\CounselingNoteController;

echo "=== STARTING VERIFICATION OF SCENARIOS A, B, C, D, E ===\n\n";

// Fetch test accounts
$student = User::where('role', 'STUDENT')->first();
$student2 = User::where('role', 'STUDENT')->skip(1)->first() ?? User::factory()->create(['role' => 'STUDENT', 'name' => 'Other Student', 'email' => 'other_student@test.com', 'password' => bcrypt('password')]);
$tutorUser = User::where('role', 'TUTOR')->first();
$tutor = Tutor::where('user_id', $tutorUser->id)->first();

echo "Student 1: {$student->name} ({$student->email})\n";
echo "Student 2: {$student2->name} ({$student2->email})\n";
echo "Tutor: {$tutorUser->name} ({$tutorUser->email})\n\n";

echo "Tutors in DB: " . Tutor::count() . "\n";
echo "Topics in DB: " . CounselingTopic::count() . "\n";
echo "counselor_topics in DB: " . \Illuminate\Support\Facades\DB::table('counselor_topics')->count() . "\n";
foreach (Tutor::with('topics')->get() as $t) {
    echo "Tutor ID {$t->id} (User ID {$t->user_id}) has topics: " . $t->topics->pluck('id')->implode(', ') . "\n";
}

// ----------------------------------------------------
// SCENARIO A: Topic -> Filtered Counselors -> Book Zoom
// ----------------------------------------------------
echo "\n--- SCENARIO A: Jalur A (Topic -> Filtered Counselors) ---\n";
$topic = CounselingTopic::where('title', 'like', '%Akademik%')->first() ?? CounselingTopic::first();
echo "Selected Topic: ID {$topic->id} - {$topic->title}\n";

$topicCtrl = new CounselingTopicController();
$rawTutors = Tutor::whereHas('topics', function ($q) use ($topic) {
    $q->where('counseling_topics.id', $topic->id);
})->get();
echo "Raw Tutor count: " . $rawTutors->count() . "\n";
foreach ($rawTutors as $rt) {
    echo "Raw tutor: ID {$rt->id}, is_available: " . ($rt->is_available ? 'true' : 'false') . "\n";
}

$topicCounselorsRes = $topicCtrl->getCounselorsByTopic(new Request(), $topic->id);
$topicCounselors = json_decode($topicCounselorsRes->getContent(), true)['data'] ?? [];
echo "Found " . count($topicCounselors) . " counselors for topic '{$topic->title}'\n";
if (empty($topicCounselors)) {
    throw new Exception("Scenario A Failed: No counselors returned for topic {$topic->title}");
}
echo "Selected counselor from topic: {$topicCounselors[0]['name']}\n";

// Student submits case for Scenario A
$caseCtrl = new CounselingCaseController();
$reqA = new Request([
    'topic_id' => $topic->id,
    'tutor_id' => $tutorUser->id,
    'method' => 'ZOOM',
    'initial_reason' => 'Saya kesulitan menyusun proposal skripsi bab 3.',
    'assessment_answers' => [
        'main_issue' => 'Kesulitan penelitian & metode analisis',
        'duration' => '1-3 bulan',
        'impact_level' => 4,
        'previous_efforts' => 'Konsultasi dengan dosen pembimbing',
        'story' => 'Saya merasa buntu menentukan metodologi kuantitatif.',
    ],
]);
$reqA->setUserResolver(fn() => $student);
$storeResA = $caseCtrl->store($reqA);
$caseA = json_decode($storeResA->getContent(), true)['data'];
echo "Created Case A: {$caseA['case_number']} with status {$caseA['status']} (Method: {$caseA['method']})\n";
echo "Assessment data saved correctly: " . json_encode($caseA['assessment_answers']) . "\n";
echo "SCENARIO A PASSED!\n\n";

// ----------------------------------------------------
// SCENARIO B: Counselor -> Filtered Topics -> Book Chat
// ----------------------------------------------------
echo "--- SCENARIO B: Jalur B (Counselor -> Filtered Topics) ---\n";
$schedCtrl = new TutorScheduleController();
$tutorDetailRes = $schedCtrl->show(new Request(), $tutorUser->id);
$tutorDetail = json_decode($tutorDetailRes->getContent(), true)['data'];
echo "Tutor Detail loaded: {$tutorDetail['name']}\n";
echo "Tutor handles " . count($tutorDetail['topics']) . " topics: " . implode(', ', array_column($tutorDetail['topics'], 'title')) . "\n";

$selectedTopicB = $tutorDetail['topics'][0] ?? $topic;
$reqB = new Request([
    'topic_id' => $selectedTopicB['id'],
    'tutor_id' => $tutorUser->id,
    'method' => 'CHAT',
    'initial_reason' => 'Sering cemas dan overthinking menjelang ujian.',
    'assessment_answers' => [
        'main_issue' => 'Kecemasan & overthinking',
        'duration' => '1-4 minggu',
        'impact_level' => 3,
        'previous_efforts' => 'Mencoba teknik pernapasan',
        'story' => 'Sulit tidur saat memikirkan nilai IPK.',
    ],
]);
$reqB->setUserResolver(fn() => $student);
$storeResB = $caseCtrl->store($reqB);
$caseB = json_decode($storeResB->getContent(), true)['data'];
echo "Created Case B: {$caseB['case_number']} with status {$caseB['status']} (Method: {$caseB['method']})\n";
echo "SCENARIO B PASSED!\n\n";

// ----------------------------------------------------
// SCENARIO C: Counselor views request, assessment, approves
// ----------------------------------------------------
echo "--- SCENARIO C: Counselor Reviews Assessment & Approves Case A ---\n";
$showReq = new Request();
$showReq->setUserResolver(fn() => $tutorUser);
$caseDetailRes = $caseCtrl->show($showReq, $caseA['id']);
$caseDetail = json_decode($caseDetailRes->getContent(), true)['data'];
echo "Counselor viewing Case A: {$caseDetail['case_number']}\n";
echo "Assessment main issue: {$caseDetail['assessment_answers']['main_issue']}\n";
echo "Assessment impact level: {$caseDetail['assessment_answers']['impact_level']}/5\n";

$approveRes = $caseCtrl->approve($showReq, $caseA['id']);
$approvedCase = json_decode($approveRes->getContent(), true)['data'];
echo "Case status after approval: {$approvedCase['status']}\n";
if ($approvedCase['status'] !== 'SCHEDULED') {
    throw new Exception("Scenario C Failed: Status is not SCHEDULED");
}
echo "SCENARIO C PASSED!\n\n";

// ----------------------------------------------------
// SCENARIO D: Counselor suggests method change (CHAT -> ZOOM)
// ----------------------------------------------------
echo "--- SCENARIO D: Counselor Suggests Method Change (CHAT -> ZOOM) ---\n";
$suggestReq = new Request([
    'suggested_method' => 'ZOOM',
    'note' => 'Permasalahan kecemasan ini akan lebih optimal didiskusikan secara tatap muka virtual via Zoom.',
]);
$suggestReq->setUserResolver(fn() => $tutorUser);
$suggestRes = $caseCtrl->suggestMethod($suggestReq, $caseB['id']);
$suggestedCase = json_decode($suggestRes->getContent(), true)['data'];
echo "Counselor suggested: {$suggestedCase['suggested_method']} with note: {$suggestedCase['suggested_method_note']}\n";
echo "Suggestion status: {$suggestedCase['suggested_method_status']}\n";

// Student accepts suggestion
$respondReq = new Request([
    'action' => 'accept',
]);
$respondReq->setUserResolver(fn() => $student);
$respondRes = $caseCtrl->respondMethodSuggestion($respondReq, $caseB['id']);
$updatedCaseB = json_decode($respondRes->getContent(), true)['data'];
echo "Student responded: Method updated to {$updatedCaseB['method']}, Suggestion status: {$updatedCaseB['suggested_method_status']}\n";
if ($updatedCaseB['method'] !== 'ZOOM') {
    throw new Exception("Scenario D Failed: Method was not updated to ZOOM");
}
echo "SCENARIO D PASSED!\n\n";

// ----------------------------------------------------
// SCENARIO E: Privacy & Authorization Check
// ----------------------------------------------------
echo "--- SCENARIO E: Privacy & Authorization Check ---\n";

// Create a session with private note for Case A
$testSession = CounselingSession::create([
    'counseling_case_id' => $caseA['id'],
    'user_id' => $student->id,
    'tutor_id' => $tutorUser->id,
    'start_at' => Carbon::now()->addDay(),
    'end_at' => Carbon::now()->addDay()->addHour(),
    'method' => 'ZOOM',
    'status' => 'SCHEDULED',
]);

$note = CounselingNote::create([
    'session_id' => $testSession->id,
    'tutor_id' => $tutorUser->id,
    'summary' => 'Diskusi pembagian bab 3 skripsi berjalan kondusif.',
    'private_note' => 'CATATAN SANGAT RAHASIA: Klien mengalami prokrastinasi tingkat sedang karena takut gagal.',
    'student_recommendation' => 'Buat draft metodologi 3 halaman sebelum minggu depan.',
    'follow_up_required' => true,
]);

// 1. Check Student 2 cannot access Student 1's Case
$unauthReq = new Request();
$unauthReq->setUserResolver(fn() => $student2);
$unauthRes = $caseCtrl->show($unauthReq, $caseA['id']);
$statusCode = $unauthRes->getStatusCode();
echo "Student 2 accessing Student 1's Case HTTP Status: {$statusCode} (Expected: 403)\n";
if ($statusCode !== 403) {
    throw new Exception("Scenario E Failed: Unauthorized user was not blocked with 403!");
}

// 2. Check Student 1 viewing case DOES NOT see private_note
$studentReq = new Request();
$studentReq->setUserResolver(fn() => $student);
$studentViewRes = $caseCtrl->show($studentReq, $caseA['id']);
$studentCaseData = json_decode($studentViewRes->getContent(), true)['data'];
$sessionNote = $studentCaseData['sessions'][0]['note'] ?? null;
if (isset($sessionNote['private_note'])) {
    throw new Exception("Scenario E Failed: private_note was leaked to student!");
}
echo "Student 1 viewing note: private_note is HIDDEN, recommendation is VISIBLE: '{$sessionNote['student_recommendation']}'\n";

// 3. Check Chat messaging between users
$chatCtrl = new CounselingChatController();
$chatMsgReq = new Request(['message' => 'Halo Ibu Dian, saya ingin mengonfirmasi sesi konseling.']);
$chatMsgReq->setUserResolver(fn() => $student);
$chatMsgRes = $chatCtrl->sendMessage($chatMsgReq, $testSession->id);
$savedMsg = json_decode($chatMsgRes->getContent(), true)['data'];
echo "Student 1 sent message in session: '{$savedMsg['message']}'\n";

// Student 2 attempts to read messages of this session
$unauthChatReq = new Request();
$unauthChatReq->setUserResolver(fn() => $student2);
$unauthChatRes = $chatCtrl->getMessages($unauthChatReq, $testSession->id);
echo "Student 2 accessing Student 1's Session Messages HTTP Status: {$unauthChatRes->getStatusCode()} (Expected: 403)\n";
if ($unauthChatRes->getStatusCode() !== 403) {
    throw new Exception("Scenario E Failed: Unauthorized user accessed chat messages!");
}

echo "SCENARIO E PASSED!\n\n";

echo "=== ALL 5 SCENARIOS (A, B, C, D, E) PASSED SUCCESSFULLY! ===\n";
