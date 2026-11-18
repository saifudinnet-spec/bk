<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeploymentLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeployController extends Controller
{
    /**
     * Menerima webhook dari GitHub dan menjalankan deploy script secara background.
     * Route: POST /api/deploy/webhook
     * Tidak butuh autentikasi token, tapi diverifikasi pakai HMAC secret.
     */
    public function webhook(Request $request)
    {
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

        $scriptPath = base_path('deploy.sh');
        if (!file_exists($scriptPath)) {
            return response()->json(['error' => 'deploy.sh not found'], 500);
        }

        if (!$this->availableShellRunner()) {
            Log::error('[Deploy] Webhook gagal: seluruh fungsi shell PHP dinonaktifkan.');
            return response()->json(['error' => 'Shell execution functions are disabled in PHP'], 500);
        }

        // 3. Ambil info commit & buat log entry
        $commitAfter  = $data['after'] ?? null;
        $commitBefore = $data['before'] ?? null;
        $pusher       = $data['pusher']['name'] ?? 'GitHub';

        $log = DeploymentLog::create([
            'triggered_by'  => $pusher . ' (webhook)',
            'action'        => 'full_deploy',
            'status'        => 'running',
            'commit_before' => $commitBefore,
            'commit_after'  => $commitAfter,
            'output'        => "Webhook diterima dari GitHub.\nMemulai deployment di latar belakang...\n",
            'started_at'    => now(),
        ]);

        // 4. Jalankan deploy script di background agar webhook GitHub tidak timeout (limit 10 detik)
        $launch = $this->launchDeployBackground($scriptPath, (int) $log->id, "Webhook diterima dari GitHub oleh {$pusher}.");
        if (!$launch['started']) {
            $log->update([
                'status'      => 'failed',
                'output'      => 'ERROR: ' . ($launch['error'] ?? 'Gagal memulai script deploy.'),
                'finished_at' => now(),
            ]);
            return response()->json(['error' => $launch['error'] ?? 'Failed to start deploy'], 500);
        }

        return response()->json([
            'message' => 'Deploy dimulai di latar belakang',
            'log_id'  => $log->id,
            'status'  => 'running',
        ], 202);
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
            $rows = DeploymentLog::orderBy('started_at', 'desc')
                ->limit(50)
                ->get();

            foreach ($rows as $row) {
                if ($row->status === 'running') {
                    $this->syncLogFromFiles($row, (int) $row->id);
                    $row->refresh();
                }
            }

            $logs = $rows->map(function ($log) {
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
     * Ambil status server saat ini (versi git, branch, PHP, Node, kemampuan exec).
     * Route: GET /api/admin/deploy/status
     */
    public function status(Request $request)
    {
        $this->ensureAdmin($request);

        $rootPath    = dirname(base_path());
        $gitCommit   = 'N/A';
        $gitBranch   = 'main';
        $behindCount = 0;
        $phpVersion  = PHP_VERSION;
        $nodeVersion = 'N/A';
        $runner      = $this->availableShellRunner();

        if ($runner) {
            try {
                $safeFlag = '-c safe.directory=' . escapeshellarg($rootPath);
                $cdRoot   = 'cd ' . escapeshellarg($rootPath);

                $commitOut = $this->runShellOutput("{$cdRoot} && git {$safeFlag} log --oneline -1 2>&1");
                if ($commitOut && !str_contains($commitOut, 'fatal') && !str_contains($commitOut, 'not found')) {
                    $gitCommit = $commitOut;
                }

                $branchOut = $this->runShellOutput("{$cdRoot} && git {$safeFlag} branch --show-current 2>&1");
                if ($branchOut && !str_contains($branchOut, 'fatal')) {
                    $gitBranch = $branchOut;
                }

                $behindOut = $this->runShellOutput("{$cdRoot} && git {$safeFlag} rev-list --count HEAD..origin/main 2>&1");
                if ($behindOut !== null && is_numeric($behindOut)) {
                    $behindCount = (int) $behindOut;
                }

                $nodeOut = $this->runShellOutput('node -v 2>&1');
                if ($nodeOut && str_starts_with($nodeOut, 'v')) {
                    $nodeVersion = $nodeOut;
                } else {
                    $nodeBins = glob('/www/server/nodejs/*/bin/node') ?: [];
                    rsort($nodeBins);
                    foreach ($nodeBins as $nodeBin) {
                        if (is_executable($nodeBin)) {
                            $aaNodeOut = $this->runShellOutput(escapeshellarg($nodeBin) . ' -v 2>&1');
                            if ($aaNodeOut && str_starts_with($aaNodeOut, 'v')) {
                                $nodeVersion = $aaNodeOut;
                                break;
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('[DeployController@status] ' . $e->getMessage());
            }
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
            'git_commit'         => $gitCommit,
            'git_branch'         => $gitBranch,
            'behind_count'       => (int) $behindCount,
            'php_version'        => $phpVersion,
            'node_version'       => $nodeVersion,
            'can_exec'           => $runner !== null,
            'shell_runner'       => $runner,
            'disabled_functions' => $this->getDisabledShellFunctions(),
            'last_deploy'        => $lastDeploy ? [
                'at'            => $lastDeploy->finished_at?->format('d M Y, H:i') . ' WIB',
                'triggered_by'  => $lastDeploy->triggered_by,
                'commit_after'  => $lastDeploy->commit_after ? substr($lastDeploy->commit_after, 0, 7) : null,
            ] : null,
        ]);
    }

    /**
     * Trigger deploy manual oleh admin dari Admin Panel.
     * Route: POST /api/admin/deploy/run
     * Berjalan secara background / non-blocking untuk mencegah 504 Gateway Timeout.
     */
    public function runManual(Request $request)
    {
        $this->ensureAdmin($request);

        $scriptPath = base_path('deploy.sh');
        if (!file_exists($scriptPath)) {
            return response()->json([
                'success' => false,
                'message' => 'deploy.sh tidak ditemukan di ' . $scriptPath,
                'output'  => null,
            ], 500);
        }

        if (!$this->availableShellRunner()) {
            $disabled = implode(', ', $this->getDisabledShellFunctions());
            return response()->json([
                'success' => false,
                'message' => "Server memblokir eksekusi shell PHP ({$disabled}). Di aaPanel, buka App Store -> PHP -> Disabled functions, hapus 'exec' atau 'shell_exec', lalu restart PHP.",
                'output'  => "ERROR: Fungsi shell PHP dinonaktifkan oleh konfigurasi php.ini server ({$disabled}).\n\nSolusi di aaPanel:\n1. Buka aaPanel -> App Store -> PHP (versi aktif) -> Settings -> Disabled functions.\n2. Hapus 'exec' dan/atau 'shell_exec' dari daftar.\n3. Restart PHP-FPM, lalu coba Pull & Update kembali.",
            ], 422);
        }

        // Cek apakah ada deployment yang benar-benar masih berjalan (sinkronkan dulu dari file .exit / .pid)
        try {
            $activeLog = DeploymentLog::where('status', 'running')
                ->orderBy('started_at', 'desc')
                ->first();

            if ($activeLog) {
                $synced = $this->syncLogFromFiles($activeLog, (int) $activeLog->id);
                if (!$synced['finished'] && $activeLog->started_at && $activeLog->started_at->gt(now()->subMinutes(10))) {
                    return response()->json([
                        'success' => true,
                        'log_id'  => $activeLog->id,
                        'status'  => 'running',
                        'output'  => $synced['output'],
                        'message' => 'Proses deployment sedang berjalan di latar belakang.',
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[DeployController@runManual] Cek activeLog: ' . $e->getMessage());
        }

        $rootPath     = dirname(base_path());
        $commitBefore = $this->runShellOutput(
            'cd ' . escapeshellarg($rootPath) . ' && git -c safe.directory=' . escapeshellarg($rootPath) . ' rev-parse HEAD 2>&1'
        );
        if ($commitBefore && (str_contains($commitBefore, 'fatal') || strlen($commitBefore) < 7)) {
            $commitBefore = null;
        }

        $log = null;
        try {
            $log = DeploymentLog::create([
                'triggered_by'  => ($request->user()->name ?? 'Admin') . ' (manual)',
                'action'        => 'full_deploy',
                'status'        => 'running',
                'commit_before' => $commitBefore ?: null,
                'commit_after'  => null,
                'output'        => "Memulai deployment...\n",
                'started_at'    => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('[DeployController@runManual] Gagal mencatat log awal: ' . $e->getMessage());
        }

        $logId  = $log ? (int) $log->id : time();
        $launch = $this->launchDeployBackground($scriptPath, $logId, 'Dipicu manual oleh ' . ($request->user()->name ?? 'Admin') . '.');

        if (!$launch['started']) {
            if ($log) {
                try {
                    $log->update([
                        'status'      => 'failed',
                        'output'      => 'ERROR: ' . ($launch['error'] ?? 'Gagal menjalankan proses deploy.'),
                        'finished_at' => now(),
                    ]);
                } catch (\Throwable $e) {}
            }

            return response()->json([
                'success' => false,
                'log_id'  => $logId,
                'status'  => 'failed',
                'message' => $launch['error'] ?? 'Gagal memulai proses deployment.',
                'output'  => 'ERROR: ' . ($launch['error'] ?? 'Gagal memulai proses deployment.'),
            ], 500);
        }

        // Jika selesai secara sinkron (misal di Windows), langsung sinkronkan status & output
        $synced = $this->syncLogFromFiles($log, $logId);

        return response()->json([
            'success'  => $synced['status'] !== 'failed',
            'log_id'   => $logId,
            'status'   => $synced['status'],
            'finished' => $synced['finished'],
            'output'   => $synced['output'],
            'message'  => $synced['finished']
                ? ($synced['status'] === 'success' ? 'Deploy berhasil!' : 'Deploy selesai dengan error.')
                : 'Deployment dimulai di latar belakang.',
        ]);
    }

    /**
     * Ambil progress real-time deploy untuk terminal konsol admin.
     * Route: GET /api/admin/deploy/progress
     */
    public function progress(Request $request)
    {
        $this->ensureAdmin($request);

        $logId = (int) $request->input('log_id');
        $log   = null;

        try {
            $log = $logId > 0
                ? DeploymentLog::find($logId)
                : DeploymentLog::where('status', 'running')->latest('id')->first();
        } catch (\Throwable $e) {
            Log::warning('[DeployController@progress] ' . $e->getMessage());
        }

        // Jika tidak ada log_id yang diminta dan tidak ada proses yang sedang berjalan -> idle (HTTP 200)
        if ($logId <= 0 && !$log) {
            return response()->json([
                'log_id'   => null,
                'status'   => 'idle',
                'finished' => true,
                'output'   => '',
            ]);
        }

        $effectiveLogId = $log ? (int) $log->id : $logId;
        $logPath        = $this->deployFilePath($effectiveLogId, 'txt');

        // Jika tidak ada di DB maupun di file log disk -> 404
        if (!$log && !file_exists($logPath)) {
            return response()->json([
                'status'   => 'not_found',
                'finished' => true,
                'output'   => 'Log deployment tidak ditemukan.',
            ], 404);
        }

        $synced = $this->syncLogFromFiles($log, $effectiveLogId);

        return response()->json([
            'log_id'   => $effectiveLogId,
            'status'   => $synced['status'],
            'finished' => $synced['finished'],
            'output'   => $synced['output'],
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            abort(response()->json(['message' => 'Akses ditolak. Khusus Admin.'], 403));
        }
    }

    private function deployFilePath(int $logId, string $ext): string
    {
        return storage_path("logs/deploy_{$logId}.{$ext}");
    }

    private function isFunctionEnabled(string $fn): bool
    {
        if (!function_exists($fn)) {
            return false;
        }
        $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));
        return !in_array($fn, $disabled, true);
    }

    private function availableShellRunner(): ?string
    {
        foreach (['exec', 'shell_exec', 'popen', 'proc_open'] as $fn) {
            if ($this->isFunctionEnabled($fn)) {
                return $fn;
            }
        }
        return null;
    }

    private function getDisabledShellFunctions(): array
    {
        $targets = ['exec', 'shell_exec', 'popen', 'proc_open'];
        return array_values(array_filter($targets, fn ($fn) => !$this->isFunctionEnabled($fn)));
    }

    private function runShellOutput(string $cmd): ?string
    {
        if ($this->isFunctionEnabled('shell_exec')) {
            $out = @shell_exec($cmd);
            return $out !== null ? trim($out) : null;
        }

        if ($this->isFunctionEnabled('exec')) {
            $lines = [];
            @exec($cmd, $lines);
            return trim(implode("\n", $lines));
        }

        if ($this->isFunctionEnabled('popen')) {
            $handle = @popen($cmd, 'r');
            if (is_resource($handle)) {
                $out = stream_get_contents($handle);
                pclose($handle);
                return $out !== false ? trim($out) : null;
            }
        }

        if ($this->isFunctionEnabled('proc_open')) {
            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ];
            $proc = @proc_open($cmd, $descriptors, $pipes);
            if (is_resource($proc)) {
                fclose($pipes[0]);
                $out = stream_get_contents($pipes[1]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                proc_close($proc);
                return $out !== false ? trim($out) : null;
            }
        }

        return null;
    }

    /**
     * Tentukan path binary PHP CLI (BUKAN php-fpm / php-cgi!).
     */
    private function resolvePhpCliBinary(): string
    {
        $isWindows = DIRECTORY_SEPARATOR === '\\';
        $binName   = $isWindows ? 'php.exe' : 'php';

        // 1. Cek PHP_BINDIR . '/php' (di aaPanel FPM: PHP_BINARY = .../sbin/php-fpm, sedangkan PHP_BINDIR = .../bin)
        if (defined('PHP_BINDIR') && PHP_BINDIR) {
            $candidate = rtrim(PHP_BINDIR, '/\\') . DIRECTORY_SEPARATOR . $binName;
            if (is_executable($candidate)) {
                return $candidate;
            }
        }

        // 2. Jika PHP_BINARY bukan fpm/cgi, gunakan langsung
        if (defined('PHP_BINARY') && PHP_BINARY && is_executable(PHP_BINARY)) {
            $base = strtolower(basename(PHP_BINARY));
            if (!str_contains($base, 'fpm') && !str_contains($base, 'cgi')) {
                return PHP_BINARY;
            }
        }

        // 3. Fallback scan aaPanel /www/server/php/*/bin/php (prioritaskan versi terbaru)
        if (!$isWindows) {
            $bins = glob('/www/server/php/*/bin/php') ?: [];
            rsort($bins);
            foreach ($bins as $bin) {
                if (is_executable($bin)) {
                    return $bin;
                }
            }
        }

        return $binName;
    }

    /**
     * Luncurkan deploy.sh di background tanpa memblokir request HTTP PHP.
     */
    private function launchDeployBackground(string $scriptPath, int $logId, string $headerNote): array
    {
        $logPath  = $this->deployFilePath($logId, 'txt');
        $exitPath = $this->deployFilePath($logId, 'exit');
        $pidPath  = $this->deployFilePath($logId, 'pid');

        if (file_exists($exitPath)) @unlink($exitPath);
        if (file_exists($pidPath)) @unlink($pidPath);

        $header = "=== DEPLOYMENT DIMULAI ===\n"
            . "Waktu: " . now()->format('Y-m-d H:i:s') . "\n"
            . $headerNote . "\n\n";

        if (@file_put_contents($logPath, $header) === false) {
            return [
                'started' => false,
                'error'   => "Tidak dapat menulis file log ke {$logPath}. Periksa izin folder storage/logs (chmod 775).",
            ];
        }

        $phpCli    = $this->resolvePhpCliBinary();
        $isWindows = DIRECTORY_SEPARATOR === '\\';

        if (!$isWindows) {
            // Gunakan subshell terisolasi + </dev/null + outer >/dev/null 2>&1 agar PHP langsung kembali dalam <50ms
            $innerCmd = 'PHP_BIN=' . escapeshellarg($phpCli)
                . ' nohup bash ' . escapeshellarg($scriptPath) . ' ' . $logId
                . ' </dev/null >> ' . escapeshellarg($logPath) . ' 2>&1 & echo $! > ' . escapeshellarg($pidPath);
            $bgCmd = '/bin/sh -c ' . escapeshellarg($innerCmd) . ' </dev/null >/dev/null 2>&1';

            if ($this->isFunctionEnabled('exec')) {
                @exec($bgCmd);
                return ['started' => true, 'error' => null];
            }

            if ($this->isFunctionEnabled('popen')) {
                $h = @popen($bgCmd, 'r');
                if (is_resource($h)) {
                    pclose($h);
                    return ['started' => true, 'error' => null];
                }
            }

            if ($this->isFunctionEnabled('proc_open')) {
                $proc = @proc_open($bgCmd, [0 => ['file', '/dev/null', 'r'], 1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes);
                if (is_resource($proc)) {
                    proc_close($proc);
                    return ['started' => true, 'error' => null];
                }
            }

            if ($this->isFunctionEnabled('shell_exec')) {
                @shell_exec($bgCmd);
                return ['started' => true, 'error' => null];
            }

            return ['started' => false, 'error' => 'Tidak ada fungsi eksekusi shell PHP yang tersedia.'];
        }

        // Fallback sinkron untuk pengujian lokal Windows
        $cmd = 'bash ' . escapeshellarg($scriptPath) . ' ' . $logId . ' >> ' . escapeshellarg($logPath) . ' 2>&1';
        if ($this->isFunctionEnabled('proc_open')) {
            $proc = @proc_open($cmd, [], $pipes);
            if (is_resource($proc)) {
                $exitCode = proc_close($proc);
                @file_put_contents($exitPath, (string) $exitCode);
                return ['started' => true, 'error' => null];
            }
        } elseif ($this->isFunctionEnabled('exec')) {
            $out = [];
            $exitCode = 1;
            @exec($cmd, $out, $exitCode);
            @file_put_contents($exitPath, (string) $exitCode);
            return ['started' => true, 'error' => null];
        }

        return ['started' => false, 'error' => 'Gagal menjalankan bash deploy.sh di lingkungan ini.'];
    }

    private function isProcessAlive(int $pid): bool
    {
        if ($pid <= 0 || DIRECTORY_SEPARATOR === '\\') {
            return false;
        }
        if (file_exists("/proc/{$pid}")) {
            return true;
        }
        if (function_exists('posix_kill')) {
            return @posix_kill($pid, 0);
        }
        return false;
    }

    /**
     * Sinkronkan status deployment dari file .txt, .exit, dan .pid agar tidak pernah stuck 'running'.
     */
    private function syncLogFromFiles(?DeploymentLog $log, int $logId): array
    {
        $logPath  = $this->deployFilePath($logId, 'txt');
        $exitPath = $this->deployFilePath($logId, 'exit');
        $pidPath  = $this->deployFilePath($logId, 'pid');

        $output  = file_exists($logPath) ? (file_get_contents($logPath) ?: '') : ($log?->output ?: 'Menunggu output script...');
        $status  = $log?->status ?? 'running';
        $hasExit = file_exists($exitPath);

        if ($hasExit && $status === 'running') {
            $exitCode = (int) trim((string) file_get_contents($exitPath));
            $status   = ($exitCode === 0) ? 'success' : 'failed';
            $this->finalizeLog($log, $status, $output);
            return ['status' => $status, 'finished' => true, 'output' => $output];
        }

        // Deteksi proses mati mendadak (OOM / killed / bash gagal start) agar UI tidak stuck selamanya
        if ($status === 'running' && !$hasExit && DIRECTORY_SEPARATOR !== '\\') {
            $ageSeconds = file_exists($logPath) ? (time() - (int) filemtime($logPath)) : 0;

            if (file_exists($pidPath)) {
                $pid = (int) trim((string) file_get_contents($pidPath));
                if ($pid > 0 && !$this->isProcessAlive($pid) && $ageSeconds >= 3) {
                    $output .= "\n\nERROR: Proses deployment (PID {$pid}) berhenti sebelum selesai (kemungkinan kehabisan RAM / OOM killer atau dihentikan server).";
                    $status = 'failed';
                    @file_put_contents($exitPath, '137');
                    $this->finalizeLog($log, $status, $output);
                    return ['status' => $status, 'finished' => true, 'output' => $output];
                }
            } elseif ($ageSeconds >= 15) {
                $output .= "\n\nERROR: Script deploy.sh gagal dimulai di latar belakang (PID tidak tercatat setelah 15 detik). Pastikan 'bash' tersedia dan izin folder storage/logs benar.";
                $status = 'failed';
                @file_put_contents($exitPath, '1');
                $this->finalizeLog($log, $status, $output);
                return ['status' => $status, 'finished' => true, 'output' => $output];
            }
        }

        $finished = $hasExit || in_array($status, ['success', 'failed'], true);

        return [
            'status'   => $status,
            'finished' => $finished,
            'output'   => $output,
        ];
    }

    private function finalizeLog(?DeploymentLog $log, string $status, string $output): void
    {
        if (!$log) {
            return;
        }

        $rootPath    = dirname(base_path());
        $commitAfter = $this->runShellOutput(
            'cd ' . escapeshellarg($rootPath) . ' && git -c safe.directory=' . escapeshellarg($rootPath) . ' rev-parse HEAD 2>&1'
        );
        if ($commitAfter && (str_contains($commitAfter, 'fatal') || strlen($commitAfter) < 7)) {
            $commitAfter = null;
        }

        try {
            $log->update([
                'status'       => $status,
                'commit_after' => $commitAfter ?: null,
                'output'       => $output,
                'finished_at'  => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('[DeployController@finalizeLog] ' . $e->getMessage());
        }
    }
}
