<?php

namespace App\Mail;

use App\Models\CounselingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CounseleeSessionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public CounselingSession $session;
    public string $sessionUrl;

    public function __construct(CounselingSession $session)
    {
        $this->session = $session;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $this->sessionUrl = rtrim($frontendUrl, '/') . '/counseling/session/' . $session->id;
    }

    public function envelope(): Envelope
    {
        $timeStr = $this->session->start_at ? $this->session->start_at->timezone('Asia/Jakarta')->format('H:i') . ' WIB' : '1 Jam Lagi';
        return new Envelope(
            subject: "[Ruang BK] Pengingat Sesi Konseling: Dimulai Pukul {$timeStr}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.counselee_reminder',
        );
    }
}
