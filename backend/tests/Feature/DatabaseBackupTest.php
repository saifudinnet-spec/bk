<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseBackupTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $student;

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
    }

    public function test_admin_can_download_database_backup()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/admin/database/backup');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/sql', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="backup-bk-online-', $response->headers->get('Content-Disposition'));

        // Capture streamed content
        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('RUANG BK — BACKUP DATABASE SISTEM', $content);
        $this->assertStringContainsString('CREATE TABLE', $content);

        // Verify audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'backup_database',
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_non_admin_cannot_download_database_backup()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->get('/api/admin/database/backup');

        $response->assertStatus(403);
    }
}
