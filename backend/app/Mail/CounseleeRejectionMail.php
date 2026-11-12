<?php

namespace App\Mail;

use App\Models\CounselingCase;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CounseleeRejectionMail extends Mailable
{
    use Queueable, SerializesModels;

    public CounselingCase $case;
    public string $reason;
    public string $counselorName;
    public string $dashboardUrl;

    public function __construct(CounselingCase $case, string $reason, string $counselorName)
    {
        $this->case          = $case;
        $this->reason        = $reason;
        $this->counselorName = $counselorName;

        $frontendUrl = env('FRONTEND_URL');
        if (empty($frontendUrl)) {
            $frontendUrl = config('app.url')
                ? str_replace(':8000', ':5173', config('app.url'))
                : 'http://localhost:5173';
        }
        $this->dashboardUrl = rtrim($frontendUrl, '/') . '/app';
    }

    public function envelope(): Envelope
    {
        $caseNum = $this->case->case_number;
        return new Envelope(
            subject: "[Ruang BK] Pembaruan Pengajuan Konseling #{$caseNum}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.counselee_rejection',
        );
    }
}

