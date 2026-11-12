<?php

namespace Tests\Feature;

use App\Mail\CounseleeRejectionMail;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\TutorAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScheduleAuditTest extends TestCase
{
    use RefreshDatabase;

    private function futureWibDateString(int $daysAhead = 2): string
    {
        return Carbon::today('Asia/Jakarta')->addDays($daysAhead)->toDateString();
    }

    public function test_tutor_and_admin_templates_generate_30_min_slots_and_clear_only_available(): void
    {
        $tutor = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $admin = User::factory()->create(['role' => 'ADMIN', 'status' => 'active']);

        // Pilih hari kerja dari tanggal +2 hari di WIB agar pasti minimal 1 hari kena dalam 1 minggu
        $targetDate = Carbon::today('Asia/Jakarta')->addDays(2);
        $targetIsoDay = (int) $targetDate->format('N');
        if ($targetIsoDay === 7) {
            $targetDate->addDay();
            $targetIsoDay = 1;
        }

        Sanctum::actingAs($tutor);
        $res = $this->postJson('/api/tutors/availability/template', [
            'days' => [$targetIsoDay],
            'sessions' => ['morning', 'afternoon', 'evening'],
            'method' => 'ALL',
            'weeks_ahead' => 1,
            'replace_existing' => false,
        ]);

        $res->assertStatus(200);
        $slots = TutorAvailability::where('tutor_id', $tutor->id)
            ->where('date', $targetDate->toDateString())
            ->orderBy('start_time')
            ->get();

        // Pagi 6 (08:00-11:00) + Siang 6 (11:00-14:00) + Sore 8 (14:00-18:00) = 20 slot 30 menit
        $this->assertCount(20, $slots);
        $this->assertEquals('08:00:00', $slots->first()->start_time);
        $this->assertEquals('08:30:00', $slots->first()->end_time);
        $this->assertEquals(30, $slots->first()->slot_duration);
        $this->assertEquals('17:30:00', $slots->last()->start_time);
        $this->assertEquals('18:00:00', $slots->last()->end_time);

        // Tandai 1 slot BOOKED lalu clear semua slot kosong
        $firstSlot = $slots->first();
        $firstSlot->update(['status' => 'BOOKED']);

        $clearRes = $this->deleteJson('/api/tutors/availability/clear');
        $clearRes->assertStatus(200);
        $this->assertEquals(1, TutorAvailability::where('tutor_id', $tutor->id)->count());
        $this->assertDatabaseHas('tutor_availabilities', ['id' => $firstSlot->id, 'status' => 'BOOKED']);

        // Admin template harus menghasilkan slot 30 menitan juga (6 slot untuk morning)
        $tutor2 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        Sanctum::actingAs($admin);
        $adminRes = $this->postJson('/api/admin/counselor-schedules/template', [
            'tutor_id' => $tutor2->id,
            'days' => [$targetIsoDay],
            'sessions' => ['morning'],
            'method' => 'ZOOM',
            'weeks_ahead' => 1,
        ]);
        $adminRes->assertStatus(200);

        $tutor2Slots = TutorAvailability::where('tutor_id', $tutor2->id)
            ->where('date', $targetDate->toDateString())
            ->get();
        $this->assertCount(6, $tutor2Slots);
        $this->assertTrue($tutor2Slots->every(fn ($s) => $s->slot_duration === 30));
    }

    public function test_migration_splits_legacy_large_available_blocks_into_30_min_slots(): void
    {
        $tutor = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $dateStr = $this->futureWibDateString(3);

        DB::table('tutor_availabilities')->insert([
            [
                'tutor_id' => $tutor->id,
                'date' => $dateStr,
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'slot_duration' => 60,
                'method' => 'ALL',
                'status' => 'AVAILABLE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tutor_id' => $tutor->id,
                'date' => $dateStr,
                'start_time' => '11:00:00',
                'end_time' => '14:00:00',
                'slot_duration' => 60,
                'method' => 'ALL',
                'status' => 'BOOKED',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $migration = require database_path('migrations/2026_11_12_000001_split_existing_availability_slots_to_30_minutes.php');
        $migration->up();

        $available = TutorAvailability::where('tutor_id', $tutor->id)
            ->where('date', $dateStr)
            ->where('status', 'AVAILABLE')
            ->orderBy('start_time')
            ->get();

        $this->assertCount(6, $available);
        $this->assertEquals('08:00:00', $available[0]->start_time);
        $this->assertEquals('08:30:00', $available[0]->end_time);
        $this->assertEquals('10:30:00', $available[5]->start_time);
        $this->assertEquals(30, $available[0]->slot_duration);

        // Slot BOOKED tetap dipertahankan
        $this->assertDatabaseHas('tutor_availabilities', [
            'tutor_id' => $tutor->id,
            'date' => $dateStr,
            'start_time' => '11:00:00',
            'status' => 'BOOKED',
        ]);
    }

    public function test_wib_slot_booking_stores_accurate_utc_and_resolves_session_periods(): void
    {
        Mail::fake();
        $tutor = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $student = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        $dateStr = $this->futureWibDateString(2);

        $slot = TutorAvailability::create([
            'tutor_id' => $tutor->id,
            'date' => $dateStr,
            'start_time' => '08:00:00',
            'end_time' => '08:30:00',
            'slot_duration' => 30,
            'method' => 'ALL',
            'status' => 'AVAILABLE',
        ]);

        TutorAvailability::create([
            'tutor_id' => $tutor->id,
            'date' => $dateStr,
            'start_time' => '14:30:00',
            'end_time' => '15:00:00',
            'slot_duration' => 30,
            'method' => 'ALL',
            'status' => 'AVAILABLE',
        ]);

        Sanctum::actingAs($student);

        // Cek session_period di getTutorSlots
        $slotsRes = $this->getJson("/api/tutors/{$tutor->id}/slots?method=CHAT");
        $slotsRes->assertStatus(200);
        $daySlots = $slotsRes->json("grouped_by_date.{$dateStr}");
        $this->assertCount(2, $daySlots);
        $this->assertEquals('morning', $daySlots[0]['session_period']);
        $this->assertEquals('evening', $daySlots[1]['session_period']);

        // Submit kasus pada 08:00–08:30 WIB
        $caseRes = $this->postJson('/api/cases', [
            'category' => 'Akademik',
            'method' => 'CHAT',
            'initial_reason' => 'Kendala penyusunan skripsi',
            'tutor_id' => $tutor->id,
            'availability_id' => $slot->id,
        ]);
        $caseRes->assertStatus(201);

        $session = CounselingSession::firstOrFail();
        // 08:00 WIB harus tersimpan sebagai 01:00 UTC di database & kembali ke 08:00 di Asia/Jakarta
        $this->assertEquals('01:00', Carbon::parse($session->start_at)->utc()->format('H:i'));
        $this->assertEquals('08:00', Carbon::parse($session->start_at)->timezone('Asia/Jakarta')->format('H:i'));
        $this->assertEquals($dateStr, Carbon::parse($session->start_at)->timezone('Asia/Jakarta')->format('Y-m-d'));
    }

    public function test_cross_counselor_zoom_conflict_blocks_same_30_min_slot_but_allows_chat_and_ignores_test_sessions(): void
    {
        Mail::fake();
        $tutor1 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $tutor2 = User::factory()->create(['role' => 'TUTOR', 'status' => 'active']);
        $student1 = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        $student2 = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        $dateStr = $this->futureWibDateString(2);

        // Sesi TEST-% di jam 10:00 WIB tidak boleh memblokir jadwal mahasiswa asli
        $testCase = CounselingCase::create([
            'user_id' => $student1->id,
            'tutor_id' => $tutor1->id,
            'case_number' => 'TEST-ZOOM-999',
            'category' => 'Uji Zoom',
            'method' => 'ZOOM',
            'initial_reason' => 'Sesi test internal',
            'status' => 'IN_PROGRESS',
            'opened_at' => now(),
        ]);
        CounselingSession::create([
            'counseling_case_id' => $testCase->id,
            'user_id' => $student1->id,
            'tutor_id' => $tutor1->id,
            'start_at' => Carbon::parse($dateStr . ' 10:00:00', 'Asia/Jakarta')->utc(),
            'end_at' => Carbon::parse($dateStr . ' 10:30:00', 'Asia/Jakarta')->utc(),
            'method' => 'ZOOM',
            'status' => 'SCHEDULED',
        ]);

        $t1Slot09 = TutorAvailability::create([
            'tutor_id' => $tutor1->id,
            'date' => $dateStr,
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'slot_duration' => 30,
            'method' => 'ALL',
            'status' => 'AVAILABLE',
        ]);

        $t2Slot09 = TutorAvailability::create([
            'tutor_id' => $tutor2->id,
            'date' => $dateStr,
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'slot_duration' => 30,
            'method' => 'ALL',
            'status' => 'AVAILABLE',
        ]);

        $t2Slot10 = TutorAvailability::create([
            'tutor_id' => $tutor2->id,
            'date' => $dateStr,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'slot_duration' => 30,
            'method' => 'ALL',
            'status' => 'AVAILABLE',
        ]);

        // Student 1 books Tutor 1 jam 09:00 WIB via ZOOM
        Sanctum::actingAs($student1);
        $this->postJson('/api/cases', [
            'category' => 'Karier',
            'method' => 'ZOOM',
            'initial_reason' => 'Konseling Zoom pertama',
            'tutor_id' => $tutor1->id,
            'availability_id' => $t1Slot09->id,
        ])->assertStatus(201);

        // Student 2 memeriksa slot Tutor 2 untuk ZOOM -> 09:00 harus ZOOM_CONFLICT, 10:00 harus AVAILABLE (karena TEST-% diabaikan)
        Sanctum::actingAs($student2);
        $zoomView = $this->getJson("/api/tutors/{$tutor2->id}/slots?method=ZOOM");
        $zoomView->assertStatus(200);
        $t2DaySlots = collect($zoomView->json("grouped_by_date.{$dateStr}"))->keyBy('start_time');
        $this->assertEquals('ZOOM_CONFLICT', $t2DaySlots['09:00']['status']);
        $this->assertEquals('AVAILABLE', $t2DaySlots['10:00']['status']);

        // Student 2 membooking Tutor 2 jam 09:00 WIB via ZOOM -> wajib ditolak 409
        $this->postJson('/api/cases', [
            'category' => 'Pribadi',
            'method' => 'ZOOM',
            'initial_reason' => 'Coba booking Zoom bentrok',
            'tutor_id' => $tutor2->id,
            'availability_id' => $t2Slot09->id,
        ])->assertStatus(409);

        // Lewat endpoint /sessions/book juga wajib 409 untuk ZOOM
        $pendingZoomCase = CounselingCase::create([
            'user_id' => $student2->id,
            'tutor_id' => $tutor2->id,
            'category' => 'Pribadi',
            'method' => 'ZOOM',
            'initial_reason' => 'Booking via /sessions/book',
            'status' => 'WAITING_REVIEW',
            'opened_at' => now(),
        ]);
        $this->postJson('/api/sessions/book', [
            'counseling_case_id' => $pendingZoomCase->id,
            'availability_id' => $t2Slot09->id,
        ])->assertStatus(409);

        // Student 2 memilih metode CHAT di jam 09:00 WIB -> DIPERBOLEHKAN
        $chatCaseRes = $this->postJson('/api/cases', [
            'category' => 'Pribadi',
            'method' => 'CHAT',
            'initial_reason' => 'Konseling via Chat paralel dengan Zoom orang lain',
            'tutor_id' => $tutor2->id,
            'availability_id' => $t2Slot09->id,
        ]);
        $chatCaseRes->assertStatus(201);
        $chatCaseId = $chatCaseRes->json('data.id');

        // Jika konselor sarankan ubah CHAT -> ZOOM di jam yang bentrok itu, accept wajib 409
        Sanctum::actingAs($tutor2);
        $this->postJson("/api/cases/{$chatCaseId}/suggest-method", [
            'suggested_method' => 'ZOOM',
            'note' => 'Mari pindahkan ke video Zoom.',
        ])->assertStatus(200);

        Sanctum::actingAs($student2);
        $this->postJson("/api/cases/{$chatCaseId}/respond-method-suggestion", [
            'action' => 'accept',
        ])->assertStatus(409);

        // Jam 10:00 WIB aman dibooking ZOOM karena TEST-% diabaikan
        $student3 = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        Sanctum::actingAs($student3);
        $this->postJson('/api/cases', [
            'category' => 'Sosial',
            'method' => 'ZOOM',
            'initial_reason' => 'Booking 10:00 WIB meski ada sesi TEST-%',
            'tutor_id' => $tutor2->id,
            'availability_id' => $t2Slot10->id,
        ])->assertStatus(201);
    }

    public function test_rejecting_counseling_case_releases_wib_slot_and_sends_email_notification(): void
    {
        Mail::fake();
        $tutor = User::factory()->create(['role' => 'TUTOR', 'name' => 'Dr. Dian Konselor', 'status' => 'active']);
        $student = User::factory()->create(['role' => 'STUDENT', 'email' => 'mahasiswa.uji@example.com', 'status' => 'active']);
        $dateStr = $this->futureWibDateString(2);

        $slot = TutorAvailability::create([
            'tutor_id' => $tutor->id,
            'date' => $dateStr,
            'start_time' => '08:30:00',
            'end_time' => '09:00:00',
            'slot_duration' => 30,
            'method' => 'ZOOM',
            'status' => 'AVAILABLE',
        ]);

        Sanctum::actingAs($student);
        $caseRes = $this->postJson('/api/cases', [
            'category' => 'Akademik',
            'method' => 'ZOOM',
            'initial_reason' => 'Mohon bimbingan rencana studi semester',
            'tutor_id' => $tutor->id,
            'availability_id' => $slot->id,
        ]);
        $caseRes->assertStatus(201);
        $caseId = $caseRes->json('data.id');

        $this->assertDatabaseHas('tutor_availabilities', [
            'id' => $slot->id,
            'status' => 'BOOKED',
        ]);

        Sanctum::actingAs($tutor);
        $rejectReason = 'Jadwal konselor bentrok dengan rapat prodi, silakan pilih slot hari berikutnya.';
        $rejectRes = $this->postJson("/api/cases/{$caseId}/reject", [
            'reason' => $rejectReason,
        ]);
        $rejectRes->assertStatus(200);

        // Slot harus kembali AVAILABLE (perbaikan bug konversi UTC -> Asia/Jakarta)
        $this->assertDatabaseHas('tutor_availabilities', [
            'id' => $slot->id,
            'status' => 'AVAILABLE',
        ]);

        // Email penolakan wajib dikirim ke konseli dengan alasan dan URL dashboard /app
        Mail::assertSent(CounseleeRejectionMail::class, function (CounseleeRejectionMail $mail) use ($student, $rejectReason) {
            return $mail->hasTo($student->email)
                && $mail->reason === $rejectReason
                && str_ends_with($mail->dashboardUrl, '/app');
        });
    }
}

