<?php

namespace Tests\Feature;

use App\Models\DeploymentLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeployControllerTest extends TestCase
{
    use RefreshDatabase;

    private array $tempFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            if (file_exists($file)) {
                @unlink($file);
            }
        }
        parent::tearDown();
    }

    public function test_non_admin_cannot_access_deploy_endpoints(): void
    {
        $student = User::factory()->create(['role' => 'STUDENT', 'status' => 'active']);
        Sanctum::actingAs($student);

        $this->getJson('/api/admin/deploy/status')->assertStatus(403);
        $this->getJson('/api/admin/deploy/logs')->assertStatus(403);
        $this->getJson('/api/admin/deploy/progress')->assertStatus(403);
        $this->postJson('/api/admin/deploy/run')->assertStatus(403);
    }

    public function test_admin_deploy_status_and_idle_progress_return_ok(): void
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'status' => 'active']);
        Sanctum::actingAs($admin);

        $statusRes = $this->getJson('/api/admin/deploy/status');
        $statusRes->assertStatus(200)
            ->assertJsonStructure([
                'git_commit',
                'git_branch',
                'behind_count',
                'php_version',
                'node_version',
                'can_exec',
                'shell_runner',
                'disabled_functions',
            ]);

        // No running deployment -> returns 200 idle (not 404)
        $this->getJson('/api/admin/deploy/progress')
            ->assertStatus(200)
            ->assertJson([
                'status'   => 'idle',
                'finished' => true,
            ]);
    }

    public function test_progress_reconciles_running_log_from_exit_file_and_updates_database(): void
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'status' => 'active']);
        Sanctum::actingAs($admin);

        $log = DeploymentLog::create([
            'triggered_by' => 'Admin (manual)',
            'action'       => 'full_deploy',
            'status'       => 'running',
            'output'       => "Memulai deployment...\n",
            'started_at'   => now()->subSeconds(10),
        ]);

        $txtPath  = storage_path("logs/deploy_{$log->id}.txt");
        $exitPath = storage_path("logs/deploy_{$log->id}.exit");
        $this->tempFiles[] = $txtPath;
        $this->tempFiles[] = $exitPath;

        file_put_contents($txtPath, ">>> [1/6] Git OK\n>>> [6/6] DEPLOYMENT SELESAI!\n");
        file_put_contents($exitPath, "0\n");

        $res = $this->getJson("/api/admin/deploy/progress?log_id={$log->id}");
        $res->assertStatus(200)
            ->assertJson([
                'log_id'   => $log->id,
                'status'   => 'success',
                'finished' => true,
            ]);

        $this->assertStringContainsString('DEPLOYMENT SELESAI!', $res->json('output'));

        $log->refresh();
        $this->assertEquals('success', $log->status);
        $this->assertNotNull($log->finished_at);
    }

    public function test_progress_handles_file_only_fallback_and_nonexistent_log(): void
    {
        $admin = User::factory()->create(['role' => 'ADMIN', 'status' => 'active']);
        Sanctum::actingAs($admin);

        // Missing in both DB and disk -> 404
        $this->getJson('/api/admin/deploy/progress?log_id=99999999')
            ->assertStatus(404)
            ->assertJson(['status' => 'not_found', 'finished' => true]);

        // Present on disk even without DB row (e.g. before migration) -> 200
        $fallbackId = 88888888;
        $txtPath  = storage_path("logs/deploy_{$fallbackId}.txt");
        $exitPath = storage_path("logs/deploy_{$fallbackId}.exit");
        $this->tempFiles[] = $txtPath;
        $this->tempFiles[] = $exitPath;

        file_put_contents($txtPath, "ERROR: npm tidak ditemukan\n");
        file_put_contents($exitPath, "1\n");

        $this->getJson("/api/admin/deploy/progress?log_id={$fallbackId}")
            ->assertStatus(200)
            ->assertJson([
                'log_id'   => $fallbackId,
                'status'   => 'failed',
                'finished' => true,
            ]);
    }
}
