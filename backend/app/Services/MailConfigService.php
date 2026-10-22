<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Config;

class MailConfigService
{
    /**
     * Apply dynamic mail configuration from SystemSetting or .env
     */
    public static function applySettings(): void
    {
        $mailUsername = SystemSetting::get('mail_username', env('MAIL_USERNAME'));
        $mailPassword = SystemSetting::get('mail_password', env('MAIL_PASSWORD'));
        $mailFromName = SystemSetting::get('mail_from_name', env('MAIL_FROM_NAME', 'Ruang BK Online'));
        $mailFromAddress = SystemSetting::get('mail_from_address', $mailUsername ?: env('MAIL_FROM_ADDRESS', 'noreply@ruangbk.com'));

        // If Gmail credentials are provided, dynamically configure SMTP for Gmail
        if (!empty($mailUsername) && !empty($mailPassword)) {
            Config::set('mail.default', 'smtp');
            Config::set('mail.mailers.smtp.transport', 'smtp');
            Config::set('mail.mailers.smtp.host', 'smtp.gmail.com');
            Config::set('mail.mailers.smtp.port', 587);
            Config::set('mail.mailers.smtp.encryption', 'tls');
            Config::set('mail.mailers.smtp.username', trim($mailUsername));
            Config::set('mail.mailers.smtp.password', trim($mailPassword));
            Config::set('mail.from.address', trim($mailFromAddress));
            Config::set('mail.from.name', trim($mailFromName));
        } elseif (!empty($mailFromName) || !empty($mailFromAddress)) {
            if (!empty($mailFromAddress)) {
                Config::set('mail.from.address', trim($mailFromAddress));
            }
            if (!empty($mailFromName)) {
                Config::set('mail.from.name', trim($mailFromName));
            }
        }
    }

    /**
     * Check if email reminder system is enabled
     */
    public static function isReminderEnabled(): bool
    {
        return SystemSetting::get('email_reminders_enabled', 'true') === 'true'
            && SystemSetting::get('reminder_notifications_enabled', 'true') === 'true';
    }

    /**
     * Check if mail credentials have been configured
     */
    public static function isConfigured(): bool
    {
        $mailUsername = SystemSetting::get('mail_username', env('MAIL_USERNAME'));
        $mailPassword = SystemSetting::get('mail_password', env('MAIL_PASSWORD'));
        return !empty($mailUsername) && !empty($mailPassword);
    }
}
