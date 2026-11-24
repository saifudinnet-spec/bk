<?php

namespace Tests\Feature;

use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\Tutor;
use App\Models\TutorAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CancellationAndReportingTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $student;
    protected $tutor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'ADMIN',
            'user_type' => 'admin',
            'status' => 'active',
        ]);

        $this->student = User::factory()->create([
            'role' => 'STUDENT',
            'user_type' => 'student',
            'status' => 'active',
        ]);

        $this->tutor = User::factory()->create([
            'role' => 'TUTOR',
            'user_type' => 'tutor',
            'status' => 'active',
        ]);

        Tutor::create([
            'user_id' => $this->tutor->id,
            'specialization' => 'Psikologi Pendidikan',
            'is_available' => true,
        ]);
    }

    public function test_student_can_cancel_their_pending_case()
    {
        $case = CounselingCase::create([
            'user_id' => $this->student->id,
            'category' => 'Akademik',
            'method' => 'ZOOM',
            'initial_reason' => 'Kesulitan membagi waktu skripsi.',
            'status' => 'WAITING_REVIEW',
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/cases/{$case->id}/cancel", [
                'reason' => 'Sudah terselesaikan secara mandiri.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'CANCELLED');

        $this->assertDatabaseHas('counseling_cases', [
            'id' => $case->id,
            'status' => 'CANCELLED',
        ]);
    }

    public function test_other_student_cannot_cancel_unowned_case()
    {
        $otherStudent = User::factory()->create(['role' => 'STUDENT']);

        $case = CounselingCase::create([
            'user_id' => $this->student->id,
            'category' => 'Pribadi',
            'method' => 'CHAT',
            'initial_reason' => 'Masalah motivasi belajar.',
            'status' => 'WAITING_REVIEW',
        ]);

        $response = $this->actingAs($otherStudent, 'sanctum')
            ->postJson("/api/cases/{$case->id}/cancel", [
                'reason' => 'Batal',
            ]);

        $response->assertStatus(403);
    }

    public function test_session_cancellation_releases_tutor_availability_slot()
    {
        $tomorrow = Carbon::tomorrow('Asia/Jakarta');
        $slotDate = $tomorrow->format('Y-m-d');
        $startTime = '10:00';
        $endTime = '10:40';

        // 1. Create booked slot
        $slot = TutorAvailability::create([
            'tutor_id' => $this->tutor->id,
            'date' => $slotDate,
            'start_time' => $startTime . ':00',
            'end_time' => $endTime . ':00',
            'status' => 'BOOKED',
            'method' => 'ZOOM',
        ]);

        // 2. Create case and scheduled session
        $case = CounselingCase::create([
            'user_id' => $this->student->id,
            'tutor_id' => $this->tutor->id,
            'category' => 'Akademik',
            'method' => 'ZOOM',
            'initial_reason' => 'Bimbingan berkala.',
            'status' => 'SCHEDULED',
        ]);

        $startAt = Carbon::parse("{$slotDate} {$startTime}:00", 'Asia/Jakarta')->utc();
        $endAt = Carbon::parse("{$slotDate} {$endTime}:00", 'Asia/Jakarta')->utc();

        $session = CounselingSession::create([
            'counseling_case_id' => $case->id,
            'user_id' => $this->student->id,
            'tutor_id' => $this->tutor->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'method' => 'ZOOM',
            'status' => 'SCHEDULED',
        ]);

        // 3. Cancel session by student
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/sessions/{$session->id}/cancel", [
                'reason' => 'Ada jadwal kuliah pengganti mendadak.',
            ]);

        $response->assertStatus(200);

        // Verify session status is CANCELLED
        $this->assertDatabaseHas('counseling_sessions', [
            'id' => $session->id,
            'status' => 'CANCELLED',
        ]);

        // Verify slot is freed back to AVAILABLE
        $this->assertDatabaseHas('tutor_availabilities', [
            'id' => $slot->id,
            'status' => 'AVAILABLE',
        ]);

        // Verify case reverted to REVIEWED so student can pick another slot
        $this->assertDatabaseHas('counseling_cases', [
            'id' => $case->id,
            'status' => 'REVIEWED',
        ]);
    }

    public function test_admin_can_access_report_stats()
    {
        // Seed a sample case
        CounselingCase::create([
            'user_id' => $this->student->id,
            'tutor_id' => $this->tutor->id,
            'category' => 'Pribadi',
            'method' => 'ZOOM',
            'initial_reason' => 'Audit test data.',
            'status' => 'COMPLETED',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/reports/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'meta' => ['institution', 'generated_at', 'period_from', 'period_to'],
                'summary' => [
                    'total_cases',
                    'completed_cases',
                    'active_cases',
                    'waiting_cases',
                    'cancelled_cases',
                    'completion_rate',
                    'total_sessions',
                    'unique_counselees',
                    'avg_satisfaction_rating',
                ],
                'category_breakdown',
                'method_breakdown',
                'counselor_performance',
                'monthly_trend',
                'cases_list',
            ]);
    }

    public function test_admin_can_export_report_csv()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/admin/reports/export');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename=', $response->headers->get('Content-Disposition'));
    }

    public function test_non_admin_cannot_access_reports()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/admin/reports/stats');

        $response->assertStatus(403);
    }
}
