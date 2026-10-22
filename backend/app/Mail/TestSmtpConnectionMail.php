<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestSmtpConnectionMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;
    public string $sentAt;

    public function __construct(string $recipientName = 'Administrator')
    {
        $this->recipientName = $recipientName;
        $this->sentAt = now()->timezone('Asia/Jakarta')->translatedFormat('d F Y, H:i:s') . ' WIB';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Ruang BK] Uji Coba Koneksi SMTP Gmail Berhasil! ✅',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.test_smtp',
        );
    }
}
