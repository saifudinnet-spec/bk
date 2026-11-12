<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembaruan Pengajuan Konseling - Ruang BK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 32px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; padding: 6px 16px; background-color: rgba(255,255,255,0.15); border-radius: 30px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; color: #e2e8f0;">
                📋 Pembaruan Status Pengajuan
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                Pengajuan Konseling Belum Dapat Diproses
              </h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #cbd5e1;">
                Ruang BK - Layanan Bimbingan &amp; Konseling
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #334155;">
                Halo <strong>{{ $case->user?->name ?: 'Konseli' }}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
                Kami ingin menyampaikan informasi terkait pengajuan konseling yang telah Anda kirimkan sebelumnya. Saat ini, pengajuan tersebut <strong>belum dapat diproses lebih lanjut</strong> oleh konselor yang bersangkutan.
              </p>

              <!-- Case Details -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px;" cellspacing="0" cellpadding="16">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                      <tr>
                        <td width="38%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nomor Tiket:</td>
                        <td style="font-size: 13px; font-weight: 700; font-family: monospace; color: #475569;">
                          #{{ $case->case_number ?? 'BK-' . $case->id }}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Topik Layanan:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #1e293b;">
                          {{ $case->category ?: 'Bimbingan Konseling' }}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Metode Dipilih:</td>
                        <td style="font-size: 13px; color: #1e293b;">
                          @if($case->method === 'ZOOM') 📹 Video Konseling (Zoom)
                          @elseif($case->method === 'CHAT') 💬 Chat Konseling
                          @else 🏛️ Tatap Muka Langsung
                          @endif
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Ditinjau oleh:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1e293b;">{{ $counselorName }}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alasan Penolakan -->
              <div style="background-color: #fef9f0; border: 1px solid #fcd34d; border-left: 4px solid #f59e0b; padding: 16px 18px; border-radius: 12px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #92400e;">
                  📝 Catatan dari Konselor:
                </h4>
                <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6;">
                  {{ $reason }}
                </p>
              </div>

              <!-- Langkah Selanjutnya -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #065f46;">
                  💡 Apa yang Dapat Anda Lakukan Selanjutnya?
                </h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #166534; line-height: 1.8;">
                  <li>Ajukan kembali permohonan konseling baru melalui dashboard Anda.</li>
                  <li>Pilih konselor lain yang sesuai dengan kebutuhan Anda.</li>
                  <li>Hubungi staf administrasi Ruang BK jika membutuhkan bantuan lebih lanjut.</li>
                </ul>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{{ $dashboardUrl }}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #047857 0%, #0f766e 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 12px rgba(4,120,87,0.3);">
                      Ajukan Konseling Baru &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0; text-align: center;">
                🔒 <em>Kerahasiaan bimbingan dan identitas Anda dijamin 100% aman sesuai kode etik konseling.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 4px; font-weight: 700; color: #64748b;">Ruang BK - Layanan Bimbingan &amp; Konseling Kampus</p>
              <p style="margin: 0;">Email ini dikirimkan otomatis oleh sistem. Jangan membalas langsung ke email ini.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>

