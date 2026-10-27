<?php

namespace App\Services;

use App\Mail\CounseleeBookingConfirmedMail;
use App\Mail\CounselorNewBookingMail;
use App\Models\CounselingSession;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CounselingMailService
{
    /**
     * Send immediate booking confirmation emails to both Counselee and Counselor
     */
    public static function sendBookingConfirmationEmails(CounselingSession $session): array
    {
        $enabled = SystemSetting::get('email_booking_notifications_enabled', 'true') === 'true';
        if (!$enabled) {
            Log::info("Email booking notifications disabled via settings. Skipping for session #{$session->id}.");
            return [
                'enabled' => false,
                'counselee' => false,
                'counselor' => false,
                'reason' => 'email_booking_notifications_disabled',
            ];
        }

        // Apply dynamic SMTP configuration (Gmail credentials / env)
        MailConfigService::applySettings();

        // Ensure relations are loaded
        $session->loadMissing(['user', 'tutor', 'counselingCase']);

        $counselee = $session->user;
        $counselor = $session->tutor;

        $results = [
            'enabled' => true,
            'counselee' => false,
            'counselor' => false,
            'session_id' => $session->id,
        ];

        // 1. Send confirmation email to Counselee
        if ($counselee && filter_var($counselee->email, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($counselee->email)->send(new CounseleeBookingConfirmedMail($session));
                $results['counselee'] = true;
                Log::info("✓ Email konfirmasi booking berhasil terkirim ke Konseli: {$counselee->email} (Sesi #{$session->id})");
            } catch (\Throwable $e) {
                Log::error("✗ Gagal mengirim email konfirmasi booking ke Konseli {$counselee->email}: " . $e->getMessage());
                $results['counselee_error'] = $e->getMessage();
            }
        }

        // 2. Send new booking notification email to Counselor
        if ($counselor && filter_var($counselor->email, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($counselor->email)->send(new CounselorNewBookingMail($session));
                $results['counselor'] = true;
                Log::info("✓ Email jadwal booking baru berhasil terkirim ke Konselor: {$counselor->email} (Sesi #{$session->id})");
            } catch (\Throwable $e) {
                Log::error("✗ Gagal mengirim email jadwal booking baru ke Konselor {$counselor->email}: " . $e->getMessage());
                $results['counselor_error'] = $e->getMessage();
            }
        }

        // Log audit trail
        try {
            AuditLogService::log('send_booking_notification_emails', 'CounselingSession', (string)$session->id, [
                'session_id' => $session->id,
                'method' => $session->method,
                'start_at' => $session->start_at?->toIso8601String(),
                'counselee_sent' => $results['counselee'],
                'counselor_sent' => $results['counselor'],
            ]);
        } catch (\Throwable $e) {
            Log::warning("Gagal mencatat audit log email booking: " . $e->getMessage());
        }

        return $results;
    }

    /**
     * Check if booking confirmation emails are globally enabled
     */
    public static function isBookingEmailEnabled(): bool
    {
        return SystemSetting::get('email_booking_notifications_enabled', 'true') === 'true';
    }

    /**
     * Check if 1-hour session reminder emails are globally enabled
     */
    public static function isReminderEmailEnabled(): bool
    {
        return SystemSetting::get('email_reminders_enabled', 'true') === 'true'
            && SystemSetting::get('reminder_notifications_enabled', 'true') === 'true';
    }
}
