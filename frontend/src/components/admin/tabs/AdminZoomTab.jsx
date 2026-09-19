import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  ExternalLink,
  Zap,
  Info,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';

export const AdminZoomTab = ({
  settings,
  setSettings,
  onSave,
  isSavingSettings,
  showSuccess,
  showError
}) => {
  const navigate = useNavigate();
  const [isStartingInstantZoom, setIsStartingInstantZoom] = useState(false);
  const [isTestingZoom, setIsTestingZoom] = useState(false);
  const [zoomTestResult, setZoomTestResult] = useState(null);
  const [showZoomSecret, setShowZoomSecret] = useState(false);
  const [showZoomGuide, setShowZoomGuide] = useState(false);

  const handleStartInstantZoomSession = async () => {
    setIsStartingInstantZoom(true);
    try {
      const res = await api.post('/sessions/instant', { method: 'ZOOM' });
      const sessionData = res.data?.data || res.data;
      if (showSuccess) showSuccess('Sesi simulasi Zoom langsung aktif! Mengalihkan ke ruang konseling...');
      navigate(`/counseling/session/${sessionData.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal memulai simulasi sesi Zoom.';
      if (showError) showError(msg);
    } finally {
      setIsStartingInstantZoom(false);
    }
  };

  const handleTestZoomConnection = async () => {
    setIsTestingZoom(true);
    setZoomTestResult(null);
    try {
      const res = await api.post('/admin/zoom/test-connection', {
        zoom_account_id: settings.zoom_account_id,
        zoom_client_id: settings.zoom_client_id,
        zoom_client_secret: settings.zoom_client_secret || undefined,
        zoom_host_email: settings.zoom_host_email,
      });
      setZoomTestResult(res);
      if (res.success) {
        if (showSuccess) showSuccess('Koneksi ke Akun Zoom berhasil terverifikasi!');
        if (res.data?.personal_meeting_url) {
          setSettings((prev) => ({
            ...prev,
            zoom_permanent_meeting_url: res.data.personal_meeting_url,
            zoom_permanent_meeting_id: res.data.pmi || prev.zoom_permanent_meeting_id,
          }));
        }
      } else {
        if (showError) showError(res.message || 'Koneksi ke Zoom gagal.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi server Zoom.';
      setZoomTestResult({ success: false, message: msg });
      if (showError) showError(msg);
    } finally {
      setIsTestingZoom(false);
    }
  };

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-soft-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Integrasi Akun Zoom Meeting (Server-to-Server OAuth)</h3>
              <p className="text-xs text-slate-500">Jadwalkan konseling otomatis langsung ke akun dan kalender Zoom Anda.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              settings.zoom_mock_mode
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : settings.zoom_is_configured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {settings.zoom_mock_mode
                ? '🟡 Mock Mode (Simulasi Lokal)'
                : settings.zoom_is_configured
                ? '🟢 Live Zoom API (Terkonfigurasi)'
                : '⚪ Belum Dikonfigurasi'}
            </span>
          </div>
        </div>

        {/* Tautan Zoom Meeting Tetap (Permanent / Standby Link) */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-4 sm:p-5 shadow-soft-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-soft-xs shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Zoom Meeting Tetap</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Siap Pakai Kapan Saja
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tautan permanen untuk uji coba langsung dan konseling online. Bisa digunakan setiap saat oleh Admin, Konselor, dan Mahasiswa.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {settings.zoom_permanent_meeting_url && (
                <button
                  type="button"
                  onClick={() => window.open(settings.zoom_permanent_meeting_url, '_blank')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-soft-xs transition-colors shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Aplikasi Zoom</span>
                </button>
              )}

              <button
                type="button"
                disabled={isStartingInstantZoom}
                onClick={handleStartInstantZoomSession}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-soft-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isStartingInstantZoom ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyiapkan Ruang Sesi...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>⚡ Mulai Simulasi Sesi Langsung (Tanpa Jadwal)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connected Account Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-slate-700 shadow-soft-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Akun Terhubung: <strong>Pasca UINSSC</strong> (<code>admpasca@uinssc.ac.id</code>) • <span className="text-emerald-700 font-semibold">Licensed / Pro</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Personal Meeting Link
            </label>
            <input
              type="url"
              value={settings.zoom_permanent_meeting_url || ''}
              onChange={(e) => setSettings({ ...settings, zoom_permanent_meeting_url: e.target.value })}
              placeholder="Contoh: https://us06web.zoom.us/j/3404109926?pwd=xxxx"
              className="w-full h-11 px-3.5 rounded-2xl border border-blue-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-soft-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Meeting ID Tetap (Opsional)
              </label>
              <input
                type="text"
                value={settings.zoom_permanent_meeting_id || ''}
                onChange={(e) => setSettings({ ...settings, zoom_permanent_meeting_id: e.target.value })}
                placeholder="Contoh: 849 2019 481"
                className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Passcode Meeting Tetap (Opsional)
              </label>
              <input
                type="text"
                value={settings.zoom_permanent_meeting_password || ''}
                onChange={(e) => setSettings({ ...settings, zoom_permanent_meeting_password: e.target.value })}
                placeholder="Contoh: 123456 atau bk123"
                className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/60 text-[11px] text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>💡 Solusi Lancar untuk Pengujian di HP:</strong> Mahasiswa yang mengakses dari HP cukup klik <em>"Buka di Aplikasi Zoom"</em> di ruang tunggu. Aplikasi Zoom resmi di HP akan langsung terbuka dengan video kamera & audio 100% aktif tanpa hambatan browser web!
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
              settings.zoom_mock_mode
                ? 'bg-white border-emerald-600 shadow-soft-xs ring-2 ring-emerald-600/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="zoom_mode"
              checked={settings.zoom_mock_mode}
              onChange={() => setSettings({ ...settings, zoom_mock_mode: true })}
              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">Simulasi / Mock Mode (Development)</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                Sesi video berjalan di browser tanpa perlu akun Zoom berbayar. Bebas testing alur konseling.
              </span>
            </div>
          </label>

          <label
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
              !settings.zoom_mock_mode
                ? 'bg-white border-blue-600 shadow-soft-xs ring-2 ring-blue-600/10'
                : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="zoom_mode"
              checked={!settings.zoom_mock_mode}
              onChange={() => setSettings({ ...settings, zoom_mock_mode: false })}
              className="mt-0.5 text-blue-600 focus:ring-blue-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">Live Akun Zoom Resmi (Otomatis)</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                Otomatis buat jadwal meeting di akun Zoom host & kirim link resmi ke mahasiswa.
              </span>
            </div>
          </label>
        </div>

        {/* Quick Step-by-Step Guide Accordion */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-950">
          <div
            onClick={() => setShowZoomGuide(!showZoomGuide)}
            className="flex items-center justify-between cursor-pointer font-bold select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Panduan Cara Buat Kredensial Server-to-Server OAuth di marketplace.zoom.us (Gratis)</span>
            </div>
            <span className="text-[11px] text-blue-700 underline font-bold">
              {showZoomGuide ? 'Sembunyikan' : 'Lihat Langkah Lengkap'}
            </span>
          </div>

          {showZoomGuide && (
            <div className="mt-3 pt-3 border-t border-blue-200/70 space-y-2 text-[11px] leading-relaxed text-slate-700">
              <p>
                1. Buka <a href="https://marketplace.zoom.us" target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline inline-flex items-center gap-0.5">marketplace.zoom.us <ExternalLink className="w-2.5 h-2.5" /></a> dan login dengan akun Zoom Anda.
              </p>
              <p>
                2. Klik menu <strong>Develop</strong> di navigasi atas/bawah, lalu pilih <strong>Build an App</strong>.
              </p>
              <p>
                3. Pilih kartu <strong>Server-to-Server OAuth</strong>, lalu klik <strong>Create</strong> dan beri nama aplikasi (contoh: <em>Ruang BK Kampus</em>).
              </p>
              <p>
                4. Pada tab <strong>App Credentials</strong>, Anda akan menemukan <strong>Account ID</strong>, <strong>Client ID</strong>, dan <strong>Client Secret</strong>. Salin ke kolom di bawah.
              </p>
              <p>
                5. Pada tab <strong>Scopes</strong>, klik <em>Add Scopes</em>, centang scope <code>meeting:write:admin</code> (atau <code>meeting:write</code>) dan <code>user:read:admin</code>.
              </p>
              <p>
                6. Buka tab <strong>Activation</strong> lalu klik tombol <strong>Activate your app</strong>. Selesai!
              </p>
            </div>
          )}
        </div>

        {/* Credential Inputs */}
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Zoom Account ID
            </label>
            <input
              type="text"
              value={settings.zoom_account_id || ''}
              onChange={(e) => setSettings({ ...settings, zoom_account_id: e.target.value })}
              placeholder="Contoh: xYzAbCdEfG123456"
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Zoom Client ID
              </label>
              <input
                type="text"
                value={settings.zoom_client_id || ''}
                onChange={(e) => setSettings({ ...settings, zoom_client_id: e.target.value })}
                placeholder="Contoh: aBcDeFgHiJkLmNoP"
                className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Zoom Client Secret
              </label>
              <div className="relative">
                <input
                  type={showZoomSecret ? 'text' : 'password'}
                  value={settings.zoom_client_secret || ''}
                  onChange={(e) => setSettings({ ...settings, zoom_client_secret: e.target.value })}
                  placeholder={settings.zoom_has_client_secret ? `${settings.zoom_client_secret_masked} (Tersimpan - isi jika ingin ganti)` : 'Tempel Client Secret di sini'}
                  className="w-full h-11 px-3.5 pr-10 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowZoomSecret(!showZoomSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showZoomSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Host Akun Zoom (Opsional)
            </label>
            <input
              type="email"
              value={settings.zoom_host_email || ''}
              onChange={(e) => setSettings({ ...settings, zoom_host_email: e.target.value })}
              placeholder="Kosongkan untuk otomatis menggunakan akun pemilik ('me') atau isi email akun Zoom"
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Jika akun Zoom Anda memiliki beberapa lisensi konselor, Anda dapat mengisi email host konselor di sini.
            </span>
          </div>
        </div>

        {/* Test Connection Button & Status */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            disabled={isTestingZoom || !settings.zoom_account_id || !settings.zoom_client_id}
            onClick={handleTestZoomConnection}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-soft-xs flex items-center gap-2 transition-colors cursor-pointer min-h-[40px]"
          >
            {isTestingZoom ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji Koneksi ke Zoom...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Uji Koneksi Zoom API Langsung</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-slate-500">
            Memverifikasi apakah token OAuth dapat diterbitkan dan berkomunikasi langsung dengan Zoom API.
          </span>
        </div>

        {/* Connection Test Result Box */}
        {zoomTestResult && (
          <div className={`p-4 rounded-2xl border text-xs ${
            zoomTestResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {zoomTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{zoomTestResult.message}</span>
            </div>
            {zoomTestResult.data && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-200/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Nama Akun:</span>
                  <strong className="text-slate-800">{zoomTestResult.data.name || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <strong className="text-slate-800">{zoomTestResult.data.email || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tipe Akun:</span>
                  <strong className="text-slate-800">{zoomTestResult.data.account_type || '-'}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSavingSettings}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
        >
          {isSavingSettings ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Pengaturan Zoom...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Konfigurasi Zoom</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AdminZoomTab;
