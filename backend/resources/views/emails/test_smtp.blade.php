<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uji Coba SMTP Gmail - Ruang BK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                ✅ Koneksi SMTP Gmail Terhubung!
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #d1fae5;">
                Uji Coba Pengiriman Notifikasi Sistem Ruang BK
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 30px;">
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #334155;">
                Halo <strong>{{ $recipientName }}</strong>,
              </p>
              <p style="font-size: 13px; line-height: 1.6; margin: 0 0 20px; color: #475569;">
                Selamat! Konfigurasi akun Gmail pengirim dan kredensial App Password pada panel admin Ruang BK telah <strong>berhasil diverifikasi</strong> dan siap digunakan untuk mengirimkan notifikasi pengingat sesi konseling otomatis.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 12px;">
                <p style="margin: 0 0 6px; color: #64748b; font-weight: 700; text-transform: uppercase;">Informasi Pengujian:</p>
                <p style="margin: 0 0 4px; color: #1e293b;">• Status: <strong>Berhasil Terkirim (250 OK)</strong></p>
                <p style="margin: 0 0 4px; color: #1e293b;">• Protokol: <strong>SMTP TLS (smtp.gmail.com:587)</strong></p>
                <p style="margin: 0; color: #1e293b;">• Waktu Tes: <strong>{{ $sentAt }}</strong></p>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
                Fitur pengingat otomatis 1 jam sebelum sesi konseling kini akan berjalan lancar menjangkau mahasiswa dan konselor.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 18px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
              <p style="margin: 0; font-weight: 700; color: #64748b;">Ruang BK &middot; Panel Administrator</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
