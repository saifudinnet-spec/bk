<?php

namespace App\Mail;

use App\Models\CounselingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CounseleeBookingConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public CounselingSession $session;
    public string $sessionUrl;

    public function __construct(CounselingSession $session)
    {
        $this->session = $session;

        $frontendUrl = env('FRONTEND_URL');
        if (empty($frontendUrl)) {
            $frontendUrl = config('app.url') ? str_replace(':8000', ':5173', config('app.url')) : 'http://localhost:5173';
        }
        $this->sessionUrl = rtrim($frontendUrl, '/') . '/counseling/session/' . $session->id;
    }

    public function envelope(): Envelope
    {
        $topic = $this->session->counselingCase?->category ?: 'Layanan Konseling';
        $timeStr = $this->session->start_at
            ? $this->session->start_at->timezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB'
            : 'Jadwal Baru';

        return new Envelope(
            subject: "[Ruang BK] Konfirmasi Booking Jadwal Konseling: {$topic} ({$timeStr})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.counselee_booking_confirmed',
        );
    }
}
