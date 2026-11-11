<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeploymentLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeployController extends Controller
{
    /**
     * Menerima webhook dari GitHub dan menjalankan deploy script.
     * Route: POST /api/deploy/webhook
     * Tidak butuh autentikasi token, tapi diverifikasi pakai HMAC secret.
     */
    public function webhook(Request $request)
    {
        @set_time_limit(300);
        @ignore_user_abort(true);

        // 1. Verifikasi signature dari GitHub
        $secret = config('app.deploy_secret');
        $signature = $request->header('X-Hub-Signature-256');

        if (!$signature || !$secret) {
            Log::warning('[Deploy] Webhook diterima tanpa signature atau secret tidak dikonfigurasi.');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->getContent();
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expected, $signature)) {
            Log::warning('[Deploy] Signature webhook tidak cocok.');
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        // 2. Hanya proses push ke branch main
        $data = json_decode($payload, true);
        $ref = $data['ref'] ?? '';
        if ($ref !== 'refs/heads/main') {
            return response()->json(['message' => 'Bukan push ke main, diabaikan.'], 200);
        }

        // 3. Ambil info commit
        $commitAfter  = $data['after'] ?? null;
        $commitBefore = $data['before'] ?? null;
        $pusher       = $data['pusher']['name'] ?? 'GitHub';

        // 4. Buat log entry dengan status 'running'
        $log = DeploymentLog::create([
            'triggered_by'  => $pusher . ' (webhook)',
            'action'        => 'full_deploy',
            'status'        => 'running',
            'commit_before' => $commitBefore,
            'commit_after'  => $commitAfter,
            'output'        => "Webhook diterima dari GitHub.\nMemulai deployment...\n",
            'started_at'    => now(),
        ]);

        // 5. Jalankan deploy script di background
        $scriptPath = base_path('deploy.sh');
        $logPath    = storage_path('logs/deploy_' . $log->id . '.txt');

        if (!file_exists($scriptPath)) {
            $log->update([
                'status'      => 'failed',
                'output'      => "ERROR: deploy.sh tidak ditemukan di " . $scriptPath,
                'finished_at' => now(),
            ]);
            return response()->json(['error' => 'deploy.sh not found'], 500);
        }

        // Jalankan script, simpan output ke file log, lalu update DB setelah selesai
        $command = "bash {$scriptPath} >> {$logPath} 2>&1";
        $exitCode = null;

        // Gunakan proc_open agar bisa ambil output setelah selesai
        $process = proc_open($command, [], $pipes);
        if (is_resource($process)) {
            $exitCode = proc_close($process);
        }

        $output = file_exists($logPath) ? file_get_contents($logPath) : 'Tidak ada output.';

        $log->update([
            'status'      => ($exitCode === 0) ? 'success' : 'failed',
            'output'      => $output,
            'finished_at' => now(),
        ]);

        Log::info("[Deploy] Selesai. Exit code: {$exitCode}");

        return response()->json(['message' => 'Deploy selesai', 'status' => $log->status], 200);
    }

    /**
     * Ambil riwayat deployment untuk Admin Panel.
     * Route: GET /api/admin/deploy/logs
     */
    public function logs(Request $request)
    {
        $this->ensureAdmin($request);

        $logs = [];
        try {
            $logs = DeploymentLog::orderBy('started_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($log) {
                    return [
                        'id'            => $log->id,
                        'triggered_by'  => $log->triggered_by,
                        'action'        => $log->action,
                        'status'        => $log->status,
                        'commit_before' => $log->commit_before ? substr($log->commit_before, 0, 7) : null,
                        'commit_after'  => $log->commit_after  ? substr($log->commit_after, 0, 7)  : null,
                        'output'        => $log->output,
                        'started_at'    => $log->started_at?->format('d M Y, H:i') . ' WIB',
                        'finished_at'   => $log->finished_at?->format('d M Y, H:i') . ' WIB',
                        'duration'      => $log->started_at && $log->finished_at
                            ? $log->started_at->diffInSeconds($log->finished_at) . ' detik'
                            : null,
                    ];
                });
        } catch (\Throwable $e) {
            Log::warning('[DeployController@logs] ' . $e->getMessage());
        }

        return response()->json(['logs' => $logs]);
    }

    /**
     * Ambil status server saat ini (versi git, branch, dll).
     * Route: GET /api/admin/deploy/status
     */
    public function status(Request $request)
    {
        $this->ensureAdmin($request);

        $rootPath = dirname(base_path());

        $gitCommit   = 'N/A';
        $gitBranch   = 'main';
        $behindCount = 0;
        $phpVersion  = PHP_VERSION;
        $nodeVersion = 'N/A';

        try {
            if (function_exists('shell_exec')) {
                $commitOut = @shell_exec("cd {$rootPath} && git log --oneline -1 2>&1");
                if ($commitOut && !str_contains($commitOut, 'fatal') && !str_contains($commitOut, 'not found')) {
                    $gitCommit = trim($commitOut);
                }

                $branchOut = @shell_exec("cd {$rootPath} && git branch --show-current 2>&1");
                if ($branchOut && !str_contains($branchOut, 'fatal')) {
                    $gitBranch = trim($branchOut);
                }

                $nodeOut = @shell_exec('node -v 2>&1');
                if ($nodeOut && str_starts_with(trim($nodeOut), 'v')) {
                    $nodeVersion = trim($nodeOut);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[DeployController@status] ' . $e->getMessage());
        }

        $lastDeploy = null;
        try {
            $lastDeploy = DeploymentLog::where('status', 'success')
                ->orderBy('finished_at', 'desc')
                ->first();
        } catch (\Throwable $e) {
            // Table belum ada sebelum migrasi dijalankan
        }

        return response()->json([
            'git_commit'   => $gitCommit,
            'git_branch'   => $gitBranch,
            'behind_count' => (int) $behindCount,
            'php_version'  => $phpVersion,
            'node_version' => $nodeVersion,
            'last_deploy'  => $lastDeploy ? [
                'at'            => $lastDeploy->finished_at?->format('d M Y, H:i') . ' WIB',
                'triggered_by'  => $lastDeploy->triggered_by,
                'commit_after'  => $lastDeploy->commit_after ? substr($lastDeploy->commit_after, 0, 7) : null,
            ] : null,
        ]);
    }

    /**
     * Trigger deploy manual oleh admin dari Admin Panel.
     * Route: POST /api/admin/deploy/run
     * Memerlukan autentikasi admin.
     */
    public function runManual(Request $request)
    {
        $this->ensureAdmin($request);

        @set_time_limit(300);
        @ignore_user_abort(true);

        $scriptPath = base_path('deploy.sh');

        if (!file_exists($scriptPath)) {
            return response()->json([
                'success' => false,
                'message' => 'deploy.sh tidak ditemukan di ' . $scriptPath,
                'output'  => null,
            ], 500);
        }

        $rootPath = dirname(base_path());
        $commitBefore = null;
        try {
            if (function_exists('shell_exec')) {
                $commitBefore = trim(@shell_exec("cd {$rootPath} && git rev-parse HEAD 2>&1") ?? '');
            }
        } catch (\Throwable $e) {}

        $log = null;
        try {
            $log = DeploymentLog::create([
                'triggered_by'  => ($request->user()->name ?? 'Admin') . ' (manual)',
                'action'        => 'full_deploy',
                'status'        => 'running',
                'commit_before' => $commitBefore ?: null,
                'commit_after'  => null,
                'output'        => "Deploy manual dimulai oleh admin.\n",
                'started_at'    => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('[DeployController@runManual] Gagal mencatat log awal: ' . $e->getMessage());
        }

        $logId   = $log ? $log->id : time();
        $logPath = storage_path('logs/deploy_' . $logId . '.txt');
        $command = "bash {$scriptPath} >> {$logPath} 2>&1";
        $exitCode = null;

        if (function_exists('proc_open')) {
            $process = proc_open($command, [], $pipes);
            if (is_resource($process)) {
                $exitCode = proc_close($process);
            }
        } else {
            @exec($command, $dummy, $exitCode);
        }

        $output      = file_exists($logPath) ? file_get_contents($logPath) : 'Tidak ada output.';
        $commitAfter = null;
        try {
            if (function_exists('shell_exec')) {
                $commitAfter = trim(@shell_exec("cd {$rootPath} && git rev-parse HEAD 2>&1") ?? '');
            }
        } catch (\Throwable $e) {}

        $status = ($exitCode === 0) ? 'success' : 'failed';

        if ($log) {
            try {
                $log->update([
                    'status'        => $status,
                    'commit_after'  => $commitAfter ?: null,
                    'output'        => $output,
                    'finished_at'   => now(),
                ]);
            } catch (\Throwable $e) {}
        }

        Log::info("[Deploy Manual] Selesai. Exit: {$exitCode}");

        return response()->json([
            'success' => $status === 'success',
            'message' => $status === 'success' ? 'Deploy berhasil!' : 'Deploy selesai dengan error.',
            'output'  => $output,
            'log_id'  => $log?->id,
            'status'  => $status,
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            abort(response()->json(['message' => 'Akses ditolak. Khusus Admin.'], 403));
        }
    }
}

