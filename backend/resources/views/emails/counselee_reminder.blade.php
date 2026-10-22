<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Sesi Konseling - Ruang BK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #024a35 0%, #047857 50%, #0f766e 100%); padding: 32px 30px; text-align: center; color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 6px 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 30px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; color: #a7f3d0;">
                      ⏰ Pengingat Sesi Konseling
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                      Sesi Konseling Anda Dimulai dalam 1 Jam
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #d1fae5;">
                      Ruang BK - Layanan Bimbingan & Konseling
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #334155;">
                Halo <strong>{{ $session->user?->name ?: 'Konseli' }}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
                Ini adalah pengingat bahwa sesi konseling Anda bersama konselor kami akan segera berlangsung dalam <strong>1 jam lagi</strong>.
              </p>

              <!-- Session Details Card -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 26px;" cellspacing="0" cellpadding="16">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                      <tr>
                        <td width="36%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Waktu Sesi:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #047857;">
                          {{ $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->translatedFormat('l, d F Y') : '-' }}<br>
                          Pukul {{ $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->format('H:i') : '-' }} WIB
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Konselor:</td>
                        <td style="font-size: 14px; font-weight: 600; color: #1e293b;">
                          {{ $session->tutor?->name ?: 'Konselor Ruang BK' }}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Metode:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1e293b;">
                          @if($session->method === 'ZOOM')
                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; background-color: #e0f2fe; color: #0369a1; font-weight: 700;">📹 Video Call Zoom</span>
                          @elseif($session->method === 'CHAT')
                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; background-color: #ecfdf5; color: #047857; font-weight: 700;">💬 Chat Interaktif</span>
                          @else
                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; background-color: #fef3c7; color: #92400e; font-weight: 700;">🏛️ Tatap Muka (Offline)</span>
                          @endif
                        </td>
                      </tr>
                      @if($session->method === 'ZOOM' && $session->meeting_number)
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Meeting ID:</td>
                        <td style="font-size: 13px; font-family: monospace; font-weight: 700; color: #1e293b;">
                          {{ $session->meeting_number }}
                          @if($session->meeting_password)
                            <span style="color: #64748b; font-weight: normal; margin-left: 8px;">(Passcode: <strong>{{ $session->meeting_password }}</strong>)</span>
                          @endif
                        </td>
                      </tr>
                      @endif
                      @if($session->location)
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Lokasi:</td>
                        <td style="font-size: 13px; color: #1e293b;">
                          {{ $session->location }}
                        </td>
                      </tr>
                      @endif
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="{{ $sessionUrl }}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #047857 0%, #0f766e 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.3);">
                      Masuk ke Ruang Konseling &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Preparation Tips -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #065f46;">
                  Tips Persiapan Sesi:
                </h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #166534; line-height: 1.6;">
                  <li>Pastikan Anda berada di tempat yang tenang, privat, dan nyaman.</li>
                  <li>Gunakan earphone/headset jika memungkinkan agar suara terdengar jelas.</li>
                  <li>Disarankan membuka tautan konseling 5 menit sebelum jadwal dimulai.</li>
                </ul>
              </div>

              <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0; text-align: center;">
                🔒 <em>Kerahasiaan data dan cerita Anda terlindungi 100% sesuai kode etik profesi bimbingan dan konseling.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 4px; font-weight: 700; color: #64748b;">Ruang BK - Layanan Konseling & Kesehatan Mental Mahasiswa</p>
              <p style="margin: 0;">Email ini dikirim otomatis oleh sistem notifikasi pengingat sesi Ruang BK. Jangan membalas langsung ke email ini.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
