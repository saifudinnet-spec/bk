<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jadwal Bimbingan Konseling Baru - Ruang BK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f766e 100%); padding: 32px 30px; text-align: center; color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 6px 16px; background-color: rgba(255, 255, 255, 0.15); border-radius: 30px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; color: #5eead4;">
                      🧑‍🏫 Jadwal Konseling Baru Masuk
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                      Booking Konseling Baru dari Konseli
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #99f6e4;">
                      Portal Konselor - Layanan Ruang BK
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #334155;">
                Yth. Bapak/Ibu <strong>{{ $session->tutor?->name ?: 'Konselor' }}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
                Seorang konseli telah berhasil memilih dan menjadwalkan sesi bimbingan bersama Anda di Ruang BK. Berikut adalah rincian informasi sesi:
              </p>

              <!-- Session Details Card -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px;" cellspacing="0" cellpadding="16">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                      <tr>
                        <td width="36%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Konseli:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #0f766e;">
                          {{ $session->user?->name ?: 'Konseli' }}
                          <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: 4px;">({{ $session->user?->email ?: '-' }})</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nomor Kasus:</td>
                        <td style="font-size: 13px; font-family: monospace; font-weight: 700; color: #334155;">
                          #{{ $session->counselingCase?->case_number ?: 'KASUS-' . $session->counseling_case_id }}
                          @if($session->counselingCase?->category)
                            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background-color: #e0e7ff; color: #4338ca; font-size: 10px; font-weight: 700; margin-left: 6px;">
                              {{ $session->counselingCase->category }}
                            </span>
                          @endif
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Hari & Tanggal:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #1e293b;">
                          {{ $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->translatedFormat('l, d F Y') : '-' }}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Waktu Sesi:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #047857;">
                          Pukul {{ $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->format('H:i') : '-' }} - {{ $session->end_at ? $session->end_at->timezone('Asia/Jakarta')->format('H:i') : '-' }} WIB
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Metode:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1e293b;">
                          @if($session->method === 'ZOOM')
                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; background-color: #e0f2fe; color: #0369a1; font-weight: 700;">📹 Video Call Zoom</span>
                          @elseif($session->method === 'CHAT')
                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; background-color: #ecfdf5; color: #047857; font-weight: 700;">💬 Chat Interaktif Web</span>
                          @else
                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; background-color: #fef3c7; color: #92400e; font-weight: 700;">🏛️ Tatap Muka (Offline)</span>
                          @endif
                        </td>
                      </tr>
                      @if($session->method === 'ZOOM' && $session->meeting_number)
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Meeting Info:</td>
                        <td style="font-size: 12px; font-family: monospace; color: #334155;">
                          ID: <strong>{{ $session->meeting_number }}</strong>
                          @if($session->meeting_password)
                            | Pass: <strong>{{ $session->meeting_password }}</strong>
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
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{{ $caseUrl ?: $sessionUrl }}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0f766e 0%, #1e293b 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);">
                      Buka Detail Kasus & Sesi &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Automatic 1-Hour Reminder Highlight Box -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 12px; margin-bottom: 22px;">
                <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #065f46;">
                  ⏰ Pengingat Otomatis 1 Jam Sebelum Sesi:
                </h4>
                <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.6;">
                  Sistem Ruang BK akan mengirimkan <strong>email reminder otomatis 1 jam sebelum jadwal dimulai</strong> ke alamat email Anda dan konseli agar bimbingan dapat dimulai tepat waktu.
                </p>
              </div>

              <!-- Counselor Note -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #334155;">
                  Catatan Konselor:
                </h4>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                  Anda dapat meninjau riwayat skrining awal atau hasil asesmen konseli melalui portal konselor sebelum sesi dimulai.
                </p>
              </div>

              <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0; text-align: center;">
                🔒 <em>Kerahasiaan data bimbingan konseling civitas akademika terlindungi secara ketat.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 4px; font-weight: 700; color: #64748b;">Ruang BK - Portal Manajemen Konselor</p>
              <p style="margin: 0;">Email ini dikirimkan otomatis saat konseli membuat booking jadwal baru di sistem Ruang BK.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
