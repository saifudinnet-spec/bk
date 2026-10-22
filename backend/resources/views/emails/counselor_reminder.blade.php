<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Jadwal Bimbingan Konselor - Ruang BK</title>
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
                      🧑‍🏫 Jadwal Bimbingan Konselor
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                      Sesi Konseling Dimulai dalam 1 Jam
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #99f6e4;">
                      Portal Manajemen Konselor - Ruang BK
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
                Yth. Bapak/Ibu <strong>{{ $session->tutor?->name ?: 'Konselor' }}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
                Ini adalah pengingat otomatis bahwa Anda memiliki jadwal pendampingan konseling yang akan dimulai dalam <strong>1 jam ke depan</strong>.
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
                          <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: 6px;">({{ $session->user?->email ?: '-' }})</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nomor Kasus:</td>
                        <td style="font-size: 13px; font-mono; font-weight: 700; color: #334155;">
                          #{{ $session->counselingCase?->case_number ?: 'KASUS-' . $session->counseling_case_id }}
                          @if($session->counselingCase?->category)
                            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background-color: #e0e7ff; color: #4338ca; font-size: 10px; font-weight: 700; margin-left: 6px;">
                              {{ $session->counselingCase->category }}
                            </span>
                          @endif
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Waktu Jadwal:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #1e293b;">
                          {{ $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->translatedFormat('l, d F Y') : '-' }}<br>
                          Pukul {{ $session->start_at ? $session->start_at->timezone('Asia/Jakarta')->format('H:i') : '-' }} WIB
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
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Meeting Info:</td>
                        <td style="font-size: 12px; font-family: monospace; color: #334155;">
                          ID: <strong>{{ $session->meeting_number }}</strong> | Pass: <strong>{{ $session->meeting_password ?: '-' }}</strong>
                        </td>
                      </tr>
                      @endif
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Case Background Note if any -->
              @if($session->counselingCase?->initial_reason)
              <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #854d0e; text-transform: uppercase; letter-spacing: 0.5px;">
                  Keluhan / Alasan Permohonan Awal Konseli:
                </h4>
                <p style="margin: 0; font-size: 13px; color: #713f12; line-height: 1.5; font-style: italic;">
                  "{{ $session->counselingCase->initial_reason }}"
                </p>
              </div>
              @endif

              <!-- Action Buttons Row -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{{ $sessionUrl }}" target="_blank" style="display: inline-block; padding: 13px 28px; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3); margin-right: 8px;">
                      Buka Ruang Sesi Sekarang &rarr;
                    </a>
                    <a href="{{ $caseUrl }}" target="_blank" style="display: inline-block; padding: 13px 22px; background-color: #f1f5f9; color: #334155; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 12px; border: 1px solid #cbd5e1;">
                      Lihat Rekam Kasus
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 4px; font-weight: 700; color: #64748b;">Ruang BK - Dashboard Manajemen Konselor</p>
              <p style="margin: 0;">Email ini dikirim otomatis oleh sistem notifikasi pengingat sesi Ruang BK.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
