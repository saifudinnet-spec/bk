import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
//
// Konfigurasi dibedakan antara mode development dan production:
//
// [DEVELOPMENT - npm run dev]
//   - HTTPS aktif dengan self-signed SSL (basicSsl) agar browser mengizinkan
//     akses kamera & mikrofon dari perangkat lain di jaringan LAN/Wi-Fi.
//   - Proxy aktif: /api dan /storage diteruskan ke Laravel (port 8000).
//
// [PRODUCTION - npm run build]
//   - basicSsl TIDAK digunakan (SSL ditangani Nginx di server).
//   - Proxy TIDAK diperlukan (frontend dan backend di domain berbeda).
//   - Output: folder dist/ siap di-upload ke server.

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [
      react(),
      // basicSsl hanya aktif di development untuk akses kamera/mic via LAN
      ...(isDev ? [basicSsl()] : []),
    ],

    // Konfigurasi server hanya relevan saat 'npm run dev'
    server: isDev ? {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      https: true, // Wajib agar kamera/mic bisa diakses dari IP lokal
      // HMR WebSocket dikonfigurasi eksplisit agar tidak menyebabkan
      // delay koneksi saat diakses dari laptop lain via IP jaringan lokal
      hmr: {
        host: '0.0.0.0',
        port: 5173,
        protocol: 'wss', // WebSocket Secure karena HTTPS aktif
      },
      // Proxy meneruskan /api dan /storage ke Laravel dev server
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/storage': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    } : {},
  }
})
