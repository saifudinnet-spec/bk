<?php

namespace Tests\Feature;

use App\Models\CounselingActionPlan;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\TutorAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessLogicAuditTest extends TestCase
{
    use RefreshDatabase;

    private function futureWibDateString(int $daysAhead = 2): string
    {
        return Carbon::today('Asia/Jakarta')->addDays($daysAhead)->toDateString();
    }

    public function test_tutor_ownership_is_enforced_on_case_actions_and_approve_status_is_accurate(): void
    {
        $tutor1 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $tutor2 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $student = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);

        // Case assigned to tutor1 without any session yet
        $case = CounselingCase::create([
            'user_id' => $student->id,
            'tutor_id' => $tutor1->id,
            'category' => 'Akademik',
            'method' => 'CHAT',
            'initial_reason' => 'Kendala motivasi belajar',
            'status' => 'WAITING_REVIEW',
        ]);

        // Tutor2 must not be able to approve, reject, suggest method, or update status
        Sanctum::actingAs($tutor2);
        $this->postJson("/api/cases/{$case->id}/approve")->assertStatus(403);
        $this->postJson("/api/cases/{$case->id}/reject", ['reason' => 'Bukan kasus saya'])->assertStatus(403);
        $this->postJson("/api/cases/{$case->id}/suggest-method", [
            'suggested_method' => 'ZOOM',
            'note' => 'Pindah ke Zoom',
        ])->assertStatus(403);
        $this->putJson("/api/cases/{$case->id}/status", ['status' => 'CLOSED'])->assertStatus(403);

        // Tutor1 approves case without session -> status must become REVIEWED, NOT SCHEDULED
        Sanctum::actingAs($tutor1);
        $approveRes = $this->postJson("/api/cases/{$case->id}/approve");
        $approveRes->assertStatus(200);
        $this->assertEquals('REVIEWED', $approveRes->json('data.status'));

        // Invalid jump REVIEWED -> WAITING_REVIEW must be rejected
        $this->putJson("/api/cases/{$case->id}/status", ['status' => 'WAITING_REVIEW'])
            ->assertStatus(422);
    }

    public function test_case_number_generation_does_not_collide_after_deletes_or_test_cases(): void
    {
        $student = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);

        $c1 = CounselingCase::create([
            'user_id' => $student->id,
            'category' => 'Akademik',
            'method' => 'CHAT',
            'initial_reason' => 'Kasus 1',
            'status' => 'CLOSED',
        ]);
        $c2 = CounselingCase::create([
            'user_id' => $student->id,
            'category' => 'Akademik',
            'method' => 'CHAT',
            'initial_reason' => 'Kasus 2',
            'status' => 'CLOSED',
        ]);
        CounselingCase::create([
            'user_id' => $student->id,
            'case_number' => 'TEST-ABC123',
            'category' => 'Uji',
            'method' => 'CHAT',
            'initial_reason' => 'Kasus Test',
            'status' => 'CLOSED',
        ]);

        // Delete first case so count() drops, previously causing duplicate BK-YYYY-000002
        $c1->delete();

        $c3 = CounselingCase::create([
            'user_id' => $student->id,
            'category' => 'Karier',
            'method' => 'CHAT',
            'initial_reason' => 'Kasus 3 setelah penghapusan',
            'status' => 'CLOSED',
        ]);

        $this->assertNotEquals($c2->case_number, $c3->case_number);
        $this->assertStringEndsWith('-000003', $c3->case_number);
    }

    public function test_active_case_guard_and_followup_booking_and_note_closure_lifecycle(): void
    {
        Mail::fake();
        $tutor1 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $tutor2 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $student = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        $dateStr = $this->futureWibDateString(2);

        $slot1 = TutorAvailability::create([
            'tutor_id' => $tutor1->id,
            'date' => $dateStr,
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'slot_duration' => 30,
            'method' => 'ZOOM',
            'status' => 'AVAILABLE',
        ]);
        $slot2 = TutorAvailability::create([
            'tutor_id' => $tutor1->id,
            'date' => $dateStr,
            'start_time' => '09:30:00',
            'end_time' => '10:00:00',
            'slot_duration' => 30,
            'method' => 'ZOOM',
            'status' => 'AVAILABLE',
        ]);
        $otherTutorSlot = TutorAvailability::create([
            'tutor_id' => $tutor2->id,
            'date' => $dateStr,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'slot_duration' => 30,
            'method' => 'ZOOM',
            'status' => 'AVAILABLE',
        ]);

        // 1. Student creates initial case with slot1
        Sanctum::actingAs($student);
        $createRes = $this->postJson('/api/cases', [
            'category' => 'Akademik',
            'method' => 'ZOOM',
            'initial_reason' => 'Diskusi tugas akhir',
            'tutor_id' => $tutor1->id,
            'availability_id' => $slot1->id,
        ]);
        $createRes->assertStatus(201);
        $caseId = $createRes->json('data.id');
        $sessionId = $createRes->json('data.sessions.0.id');

        // 2. Duplicate new case while active must return 409
        $this->postJson('/api/cases', [
            'category' => 'Karier',
            'method' => 'CHAT',
            'initial_reason' => 'Coba buat kasus kedua paralel',
        ])->assertStatus(409);

        // 3. Feedback before session is COMPLETED must return 422
        $this->postJson("/api/sessions/{$sessionId}/feedback", [
            'rating' => 5,
            'comment' => 'Belum selesai sudah nilai',
        ])->assertStatus(422);

        // 4. Tutor saves note WITH follow_up_required = true -> session COMPLETED, case FOLLOW_UP
        Sanctum::actingAs($tutor1);
        $this->postJson("/api/sessions/{$sessionId}/notes", [
            'summary' => 'Sesi pertama berjalan baik, perlu tindak lanjut minggu depan.',
            'student_recommendation' => 'Lanjutkan penyusunan outline bab 1.',
            'follow_up_required' => true,
        ])->assertStatus(200);

        $this->assertDatabaseHas('counseling_sessions', ['id' => $sessionId, 'status' => 'COMPLETED']);
        $this->assertDatabaseHas('counseling_cases', ['id' => $caseId, 'status' => 'FOLLOW_UP']);

        // 5. Student now CAN submit feedback on completed session
        Sanctum::actingAs($student);
        $this->postJson("/api/sessions/{$sessionId}/feedback", [
            'rating' => 5,
            'comment' => 'Sangat membantu!',
        ])->assertStatus(201);

        // 6. Booking slot belonging to tutor2 on tutor1's case must fail 422
        $this->postJson('/api/sessions/book', [
            'counseling_case_id' => $caseId,
            'availability_id' => $otherTutorSlot->id,
        ])->assertStatus(422);

        // 7. Follow-up booking on same case with tutor1's slot2 succeeds -> status SCHEDULED
        $followUpBook = $this->postJson('/api/sessions/book', [
            'counseling_case_id' => $caseId,
            'availability_id' => $slot2->id,
        ]);
        $followUpBook->assertStatus(201);
        $session2Id = $followUpBook->json('data.id');
        $this->assertDatabaseHas('counseling_cases', ['id' => $caseId, 'status' => 'SCHEDULED']);

        // 8. Tutor saves note WITH follow_up_required = false -> case MUST transition to CLOSED
        Sanctum::actingAs($tutor1);
        $this->postJson("/api/sessions/{$session2Id}/notes", [
            'summary' => 'Sesi tindak lanjut selesai tuntas.',
            'student_recommendation' => 'Pertahankan progres penulisan.',
            'follow_up_required' => false,
        ])->assertStatus(200);

        $this->assertDatabaseHas('counseling_cases', ['id' => $caseId, 'status' => 'CLOSED']);

        // 9. Now that case is CLOSED, student CAN open a new case
        Sanctum::actingAs($student);
        $this->postJson('/api/cases', [
            'category' => 'Karier',
            'method' => 'CHAT',
            'initial_reason' => 'Kasus baru setelah kasus sebelumnya ditutup',
        ])->assertStatus(201);
    }

    public function test_past_slot_and_method_mismatch_are_rejected_when_booking(): void
    {
        Mail::fake();
        $tutor = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $student = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);

        $yesterday = Carbon::yesterday('Asia/Jakarta')->toDateString();
        $pastSlot = TutorAvailability::create([
            'tutor_id' => $tutor->id,
            'date' => $yesterday,
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'slot_duration' => 30,
            'method' => 'ALL',
            'status' => 'AVAILABLE',
        ]);

        $futureChatOnlySlot = TutorAvailability::create([
            'tutor_id' => $tutor->id,
            'date' => $this->futureWibDateString(3),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'slot_duration' => 30,
            'method' => 'CHAT',
            'status' => 'AVAILABLE',
        ]);

        Sanctum::actingAs($student);
        $this->postJson('/api/cases', [
            'category' => 'Akademik',
            'method' => 'ZOOM',
            'initial_reason' => 'Coba booking slot kemarin',
            'tutor_id' => $tutor->id,
            'availability_id' => $pastSlot->id,
        ])->assertStatus(422);

        $this->postJson('/api/cases', [
            'category' => 'Akademik',
            'method' => 'ZOOM',
            'initial_reason' => 'Coba booking slot khusus CHAT pakai ZOOM',
            'tutor_id' => $tutor->id,
            'availability_id' => $futureChatOnlySlot->id,
        ])->assertStatus(422);
    }

    public function test_signaling_feedback_privacy_and_dashboard_sqlite_compatibility(): void
    {
        $tutor = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $student1 = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        $student2 = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);

        $case = CounselingCase::create([
            'user_id' => $student1->id,
            'tutor_id' => $tutor->id,
            'category' => 'Pribadi',
            'method' => 'ZOOM',
            'initial_reason' => 'Sesi privat',
            'status' => 'SCHEDULED',
        ]);

        $session = CounselingSession::create([
            'counseling_case_id' => $case->id,
            'user_id' => $student1->id,
            'tutor_id' => $tutor->id,
            'start_at' => Carbon::now()->addHour(),
            'end_at' => Carbon::now()->addHours(2),
            'method' => 'ZOOM',
            'status' => 'SCHEDULED',
        ]);

        CounselingActionPlan::create([
            'counseling_case_id' => $case->id,
            'session_id' => $session->id,
            'user_id' => $student1->id,
            'tutor_id' => $tutor->id,
            'title' => 'Jurnal harian',
            'status' => 'PENDING',
        ]);

        // Unrelated student2 must be denied signaling, feedback view, and tutor ratings
        Sanctum::actingAs($student2);
        $this->postJson('/api/zoom/signaling', [
            'session_id' => $session->id,
            'type' => 'offer',
            'sender' => 'intruder',
        ])->assertStatus(403);
        $this->getJson("/api/zoom/signaling?session_id={$session->id}")->assertStatus(403);
        $this->getJson("/api/sessions/{$session->id}/feedback")->assertStatus(403);
        $this->getJson('/api/tutor/ratings')->assertStatus(403);

        // Dashboards & action plans must work cleanly on SQLite (no MySQL-only FIELD())
        Sanctum::actingAs($student1);
        $this->getJson('/api/student/dashboard')->assertStatus(200);
        $this->getJson('/api/action-plans')->assertStatus(200);

        Sanctum::actingAs($tutor);
        $this->getJson('/api/tutor/dashboard')->assertStatus(200);
        $this->getJson('/api/tutor/ratings')->assertStatus(200);
    }
}

