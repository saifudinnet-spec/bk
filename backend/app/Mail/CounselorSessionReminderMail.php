<?php

namespace App\Mail;

use App\Models\CounselingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CounselorSessionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public CounselingSession $session;
    public string $sessionUrl;
    public string $caseUrl;

    public function __construct(CounselingSession $session)
    {
        $this->session = $session;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $this->sessionUrl = rtrim($frontendUrl, '/') . '/counseling/session/' . $session->id;
        $this->caseUrl = rtrim($frontendUrl, '/') . '/app/cases/' . $session->counseling_case_id;
    }

    public function envelope(): Envelope
    {
        $counseleeName = $this->session->user?->name ?: 'Konseli';
        $timeStr = $this->session->start_at ? $this->session->start_at->timezone('Asia/Jakarta')->format('H:i') . ' WIB' : '1 Jam Lagi';
        return new Envelope(
            subject: "[Ruang BK] Jadwal Bimbingan: Konseling dengan {$counseleeName} pukul {$timeStr}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.counselor_reminder',
        );
    }
}
