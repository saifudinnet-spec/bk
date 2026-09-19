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
  AlertTriangle,
  Key,
  ShieldCheck,
  Monitor
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

  // Instant session state
  const [isStartingInstantZoom, setIsStartingInstantZoom] = useState(false);

  // Server-to-Server OAuth state
  const [isTestingZoom, setIsTestingZoom] = useState(false);
  const [zoomTestResult, setZoomTestResult] = useState(null);
  const [showZoomSecret, setShowZoomSecret] = useState(false);
  const [showZoomGuide, setShowZoomGuide] = useState(false);

  // Meeting SDK state
  const [isTestingSdk, setIsTestingSdk] = useState(false);
  const [sdkTestResult, setSdkTestResult] = useState(null);
  const [showSdkSecret, setShowSdkSecret] = useState(false);
  const [showSdkGuide, setShowSdkGuide] = useState(false);

  const handleStartInstantZoomSession = async () => {
    setIsStartingInstantZoom(true);
    try {
      const res = await api.post('/sessions/instant', { method: 'ZOOM' });
      const sessionData = res.data?.data || res.data;
      if (showSuccess) showSuccess('Sesi Zoom resmi aktif! Mengalihkan ke ruang konseling...');
      navigate(`/counseling/session/${sessionData.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal memulai sesi Zoom.';
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

  const handleTestZoomSdk = async () => {
    setIsTestingSdk(true);
    setSdkTestResult(null);
    try {
      const res = await api.post('/admin/zoom/test-sdk', {
        zoom_sdk_key: settings.zoom_sdk_key,
        zoom_sdk_secret: settings.zoom_sdk_secret || undefined,
      });
      setSdkTestResult(res);
      if (res.success) {
        if (showSuccess) showSuccess('Kredensial Zoom Meeting SDK valid!');
        setSettings((prev) => ({
          ...prev,
          zoom_sdk_is_configured: true,
          zoom_has_sdk_secret: true,
        }));
      } else {
        if (showError) showError(res.message || 'Validasi Zoom Meeting SDK gagal.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menguji Zoom SDK.';
      setSdkTestResult({ success: false, message: msg });
      if (showError) showError(msg);
    } finally {
      setIsTestingSdk(false);
    }
  };

  const isSdkReady = Boolean(
    settings.zoom_sdk_key && (settings.zoom_has_sdk_secret || settings.zoom_sdk_secret)
  );

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-soft-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Integrasi Video Konseling Zoom</h3>
              <p className="text-xs text-slate-500">Konfigurasi Zoom Meeting SDK & Server-to-Server OAuth.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              isSdkReady
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isSdkReady ? '🟢 Meeting SDK Siap' : '⚪ SDK Belum Diisi'}
            </span>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              settings.zoom_mock_mode
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : settings.zoom_is_configured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {settings.zoom_mock_mode
                ? '🟡 Mock Mode (Lokal)'
                : settings.zoom_is_configured
                ? '🟢 S2S API Aktif'
                : '⚪ S2S Belum Diisi'}
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
                  <span>Zoom Meeting Standby</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tautan permanen untuk uji coba langsung dan konseling darurat. Bisa dibuka langsung di web atau app Zoom.
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
                  <span>Buka di App Zoom</span>
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
                    <span>⚡ Mulai Sesi Uji Coba Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Personal / Permanent Meeting Link (URL)
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ZOOM MEETING SDK (Video Call di Dalam Web Ruang BK) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-soft-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">1. Konfigurasi Zoom Meeting SDK (Video di Web)</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Gratis
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Frontend Web
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kredensial ini digunakan agar video Zoom tampil langsung di halaman web Ruang BK tanpa aplikasi Zoom eksternal.
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
            isSdkReady
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {isSdkReady ? '🟢 SDK Terpasang' : '⚪ Belum Dikonfigurasi'}
          </span>
        </div>

        {/* Penjelasan Singkat */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-[11px] text-indigo-950 leading-relaxed">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong>💡 Mengapa Membutuhkan Meeting SDK?</strong> Fitur ini membuat mahasiswa dan konselor tidak perlu keluar dari website Ruang BK. Panggilan video Zoom langsung terintegrasi di dalam halaman konseling. Penggunaan Meeting SDK ini <strong>100% GRATIS</strong> dari Zoom!
          </div>
        </div>

        {/* Panduan Cara Buat App Meeting SDK */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs text-indigo-950">
          <div
            onClick={() => setShowSdkGuide(!showSdkGuide)}
            className="flex items-center justify-between cursor-pointer font-bold select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Panduan Cara Buat App "Meeting SDK" di marketplace.zoom.us (1 Menit)</span>
            </div>
            <span className="text-[11px] text-indigo-700 underline font-bold">
              {showSdkGuide ? 'Sembunyikan' : 'Lihat Langkah Lengkap'}
            </span>
          </div>

          {showSdkGuide && (
            <div className="mt-3 pt-3 border-t border-indigo-200/70 space-y-2 text-[11px] leading-relaxed text-slate-700">
              <p>
                1. Buka <a href="https://marketplace.zoom.us/develop/create" target="_blank" rel="noreferrer" className="font-bold text-indigo-700 underline inline-flex items-center gap-0.5">marketplace.zoom.us/develop/create <ExternalLink className="w-2.5 h-2.5" /></a> dan login dengan akun Zoom Anda.
              </p>
              <p>
                2. Cari kartu bertuliskan <strong>Meeting SDK</strong>, lalu klik <strong>Create</strong>.
              </p>
              <p>
                3. Beri nama aplikasi (misal: <em>Ruang BK Web Client</em>).
              </p>
              <p>
                4. Pada tab <strong>App Credentials</strong>, Anda akan melihat <strong>Client ID</strong> (atau SDK Key) dan <strong>Client Secret</strong> (atau SDK Secret).
              </p>
              <p>
                5. Salin dan tempelkan <strong>Client ID</strong> dan <strong>Client Secret</strong> ke dua kolom di bawah ini.
              </p>
              <p>
                6. Klik tombol <strong>"Uji Kredensial Meeting SDK"</strong> untuk memastikan token JWT dapat di-generate dengan sukses.
              </p>
            </div>
          )}
        </div>

        {/* Inputs for Meeting SDK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Meeting SDK Client ID (SDK Key)</span>
            </label>
            <input
              type="text"
              value={settings.zoom_sdk_key || ''}
              onChange={(e) => setSettings({ ...settings, zoom_sdk_key: e.target.value })}
              placeholder="Contoh: u9zN2w1hS... atau Client ID dari Meeting SDK app"
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Didapatkan dari App bertipe "Meeting SDK" di Zoom App Marketplace.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Meeting SDK Client Secret (SDK Secret)</span>
            </label>
            <div className="relative">
              <input
                type={showSdkSecret ? 'text' : 'password'}
                value={settings.zoom_sdk_secret || ''}
                onChange={(e) => setSettings({ ...settings, zoom_sdk_secret: e.target.value })}
                placeholder={settings.zoom_has_sdk_secret ? `${settings.zoom_sdk_secret_masked} (Tersimpan - isi jika ingin ganti)` : 'Tempel Client Secret Meeting SDK di sini'}
                className="w-full h-11 px-3.5 pr-10 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowSdkSecret(!showSdkSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showSdkSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Digunakan untuk membuat token JWT signature aman saat join ke video call.
            </span>
          </div>
        </div>

        {/* Test Meeting SDK Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            disabled={isTestingSdk || !settings.zoom_sdk_key}
            onClick={handleTestZoomSdk}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-soft-xs flex items-center gap-2 transition-colors cursor-pointer min-h-[40px]"
          >
            {isTestingSdk ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memvalidasi Meeting SDK...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Uji Kredensial Meeting SDK</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-slate-500">
            Menguji apakah Client ID & Secret dapat membuat JWT Signature Zoom yang sah.
          </span>
        </div>

        {/* SDK Test Result Box */}
        {sdkTestResult && (
          <div className={`p-4 rounded-2xl border text-xs ${
            sdkTestResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {sdkTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{sdkTestResult.message}</span>
            </div>
            {sdkTestResult.success && (
              <p className="text-[11px] text-emerald-700 mt-1">
                Kredensial Meeting SDK berhasil diverifikasi dan disimpan! Ruang video web Ruang BK siap menggunakan Zoom resmi.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: ZOOM SERVER-TO-SERVER OAUTH (Pembuatan Link/Jadwal Otomatis) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-soft-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">2. Konfigurasi Server-to-Server OAuth (API Backend)</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Backend API
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kredensial ini digunakan backend Laravel untuk membuat meeting ID dan passcode Zoom otomatis saat jadwal konseling dipesan.
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
            settings.zoom_is_configured
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {settings.zoom_is_configured ? '🟢 S2S API Terhubung' : '⚪ Belum Dikonfigurasi'}
          </span>
        </div>

        {/* Quick Step-by-Step Guide Accordion for S2S */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-950">
          <div
            onClick={() => setShowZoomGuide(!showZoomGuide)}
            className="flex items-center justify-between cursor-pointer font-bold select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Panduan Cara Buat Kredensial Server-to-Server OAuth di marketplace.zoom.us</span>
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
                2. Klik menu <strong>Develop</strong> -&gt; <strong>Build an App</strong>.
              </p>
              <p>
                3. Pilih kartu <strong>Server-to-Server OAuth</strong>, lalu klik <strong>Create</strong> dan beri nama aplikasi (contoh: <em>Ruang BK API</em>).
              </p>
              <p>
                4. Pada tab <strong>App Credentials</strong>, salin <strong>Account ID</strong>, <strong>Client ID</strong>, dan <strong>Client Secret</strong> ke kolom di bawah.
              </p>
              <p>
                5. Pada tab <strong>Scopes</strong>, tambahkan scope <code>meeting:write:admin</code> (atau <code>meeting:write</code>) dan <code>user:read:admin</code>.
              </p>
              <p>
                6. Buka tab <strong>Activation</strong> lalu klik tombol <strong>Activate your app</strong>.
              </p>
            </div>
          )}
        </div>

        {/* S2S Credential Inputs */}
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
                Zoom Client ID (OAuth)
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
                Zoom Client Secret (OAuth)
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
                <span>Menguji Koneksi ke Zoom API...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Uji Koneksi Zoom API Langsung</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-slate-500">
            Memverifikasi apakah token Server-to-Server OAuth dapat diterbitkan dan berkomunikasi langsung dengan Zoom API.
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

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSavingSettings}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px] cursor-pointer"
        >
          {isSavingSettings ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Pengaturan Zoom...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Semua Konfigurasi Zoom</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AdminZoomTab;
