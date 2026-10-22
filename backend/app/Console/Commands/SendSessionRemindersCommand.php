<?php

namespace App\Console\Commands;

use App\Mail\CounseleeSessionReminderMail;
use App\Mail\CounselorSessionReminderMail;
use App\Models\CounselingSession;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Services\AuditLogService;
use App\Services\MailConfigService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendSessionRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'counseling:send-reminders {--dry-run : Simulasi tanpa mengirimkan email sungguhan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi pengingat email dan in-app 1 jam sebelum sesi konseling dimulai';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai pengecekan sesi konseling yang butuh pengingat 1 jam...');

        // 1. Cek apakah pengingat sesi diaktifkan di pengaturan sistem
        $globalReminderEnabled = SystemSetting::get('reminder_notifications_enabled', 'true') === 'true';
        if (!$globalReminderEnabled) {
            $this->comment('Pengingat sesi dinonaktifkan di Pengaturan Sistem (reminder_notifications_enabled=false).');
            return Command::SUCCESS;
        }

        $emailReminderEnabled = SystemSetting::get('email_reminders_enabled', 'true') === 'true';
        $isDryRun = $this->option('dry-run');

        // 2. Terapkan konfigurasi mail dinamis (Gmail SMTP / env)
        MailConfigService::applySettings();

        // 3. Query sesi konseling: SCHEDULED, start_at dalam 60 menit ke depan, reminder_sent_at belum disetel
        $now = Carbon::now();
        $oneHourAhead = Carbon::now()->addMinutes(60);

        $sessions = CounselingSession::with(['user', 'tutor', 'counselingCase'])
            ->where('status', 'SCHEDULED')
            ->whereNull('reminder_sent_at')
            ->where('start_at', '<=', $oneHourAhead)
            ->where('start_at', '>', $now)
            ->get();

        if ($sessions->isEmpty()) {
            $this->line('Tidak ada sesi yang memerlukan pengingat pada jendela waktu saat ini.');
            return Command::SUCCESS;
        }

        $this->info("Ditemukan {$sessions->count()} sesi yang memerlukan pengingat 1 jam:");

        foreach ($sessions as $session) {
            $counselee = $session->user;
            $counselor = $session->tutor;
            $timeFormatted = $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->format('H:i') . ' WIB' : 'segera';

            $this->line("- Sesi #{$session->id} ({$session->method}): {$counselee?->name} & {$counselor?->name} pukul {$timeFormatted}");

            if ($isDryRun) {
                $this->comment("  [DRY-RUN] Melewati pengiriman email & update timestamp.");
                continue;
            }

            // Flag Idempoten: Tandai langsung agar tidak terkirim ganda bila proses berikutnya butuh waktu
            $session->update([
                'reminder_sent_at' => now(),
            ]);

            // A. Kirim Notifikasi In-App (Lonceng Web)
            if ($counselee) {
                Notification::create([
                    'user_id' => $counselee->id,
                    'type' => 'session_reminder_1h',
                    'title' => 'Pengingat: Sesi Dimulai 1 Jam Lagi',
                    'message' => "Sesi konseling Anda bersama " . ($counselor?->name ?: 'Konselor') . " akan dimulai pukul {$timeFormatted}. Silakan bersiap.",
                ]);
            }

            if ($counselor) {
                Notification::create([
                    'user_id' => $counselor->id,
                    'type' => 'session_reminder_1h',
                    'title' => 'Jadwal Bimbingan: 1 Jam Lagi',
                    'message' => "Sesi konseling bersama " . ($counselee?->name ?: 'Konseli') . " dijadwalkan pukul {$timeFormatted}.",
                ]);
            }

            // B. Kirim Email Notifikasi via Gmail SMTP jika email aktif
            if ($emailReminderEnabled) {
                // Email ke Konseli
                if ($counselee && filter_var($counselee->email, FILTER_VALIDATE_EMAIL)) {
                    try {
                        Mail::to($counselee->email)->send(new CounseleeSessionReminderMail($session));
                        $this->info("  ✓ Email pengingat konseli terkirim ke: {$counselee->email}");
                    } catch (\Throwable $e) {
                        Log::error("Gagal kirim email reminder konseli #{$counselee->id}: " . $e->getMessage());
                        $this->error("  ✗ Gagal kirim email konseli: {$e->getMessage()}");
                    }
                }

                // Email ke Konselor
                if ($counselor && filter_var($counselor->email, FILTER_VALIDATE_EMAIL)) {
                    try {
                        Mail::to($counselor->email)->send(new CounselorSessionReminderMail($session));
                        $this->info("  ✓ Email pengingat konselor terkirim ke: {$counselor->email}");
                    } catch (\Throwable $e) {
                        Log::error("Gagal kirim email reminder konselor #{$counselor->id}: " . $e->getMessage());
                        $this->error("  ✗ Gagal kirim email konselor: {$e->getMessage()}");
                    }
                }
            } else {
                $this->comment("  Email reminder dinonaktifkan di pengaturan (email_reminders_enabled=false).");
            }

            // Catat ke Audit Trail
            AuditLogService::log('send_session_reminder_1h', 'CounselingSession', (string)$session->id, [
                'session_id' => $session->id,
                'method' => $session->method,
                'start_at' => $session->start_at?->toIso8601String(),
                'email_sent' => $emailReminderEnabled,
            ]);
        }

        $this->info('Selesai memproses pengingat sesi konseling.');
        return Command::SUCCESS;
    }
}
