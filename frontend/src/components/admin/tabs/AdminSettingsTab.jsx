import React, { useState } from 'react';
import {
  Globe,
  SlidersHorizontal,
  Settings,
  Mail,
  Phone,
  Building2,
  Clock,
  Megaphone,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Video,
  Mic,
  Send,
  Key,
  AlertCircle,
  Info,
  Bell,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';

export const AdminSettingsTab = ({
  activeTab,
  settings,
  setSettings,
  onSave,
  isSavingSettings,
  setActiveTab,
  onTestEmail,
  onRunReminders
}) => {
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);
  const [triggerRemindersResult, setTriggerRemindersResult] = useState(null);

  const handleRunEmailTest = async () => {
    if (!onTestEmail) return;
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await onTestEmail(testEmailTarget.trim() || undefined);
      setTestEmailResult(res);
    } catch (err) {
      setTestEmailResult({ success: false, message: err.message || 'Gagal mengirim email tes.' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTriggerReminders = async () => {
    if (!onRunReminders) return;
    setIsTriggeringReminders(true);
    setTriggerRemindersResult(null);
    try {
      const res = await onRunReminders();
      setTriggerRemindersResult(res);
    } catch (err) {
      setTriggerRemindersResult({
        success: false,
        message: err.message || 'Gagal memicu pengingat sesi.',
      });
    } finally {
      setIsTriggeringReminders(false);
    }
  };

  return (
    <>
      {/* 5. Web CMS & SEO Settings Tab */}
      {activeTab === 'web_settings' && (
        <form onSubmit={onSave} className="space-y-6 max-w-4xl mx-auto">
          {/* Card 1: Identitas & SEO Website */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Identitas Website & Optimasi Mesin Pencari (SEO)</h3>
                <p className="text-xs text-mutedtext">Atur nama portal, slogan kampus, dan bagaimana website Ruang BK tampil di hasil pencarian Google.</p>
              </div>
            </div>

            {/* Live Google Search Snippet Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pratinjau Tampilan di Google (SERP Preview)
              </span>
              <div className="font-sans text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                  <span className="text-emerald-700 font-semibold">https://bk-online.uinssc.ac.id</span>
                  <span className="text-slate-400">›</span>
                  <span className="text-slate-500">layanan-konseling</span>
                </div>
                <h4 className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                  {settings.site_title || 'Ruang BK - Layanan Bimbingan & Konseling Kampus'} | {settings.site_tagline || 'Ruang Aman'}
                </h4>
                <p className="text-[11px] text-[#4d5156] line-clamp-2 leading-relaxed">
                  {settings.site_meta_description || 'Layanan bimbingan dan konseling online & offline terpadu untuk civitas akademika kampus. Akses sesi privat dengan konselor terpercaya.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Nama / Judul Website (Site Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.site_title || ''}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  placeholder="Ruang BK - Layanan Bimbingan & Konseling Kampus"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <span className="text-[11px] text-mutedtext mt-1 block">Tampil pada tab browser dan judul utama portal.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Slogan / Tagline Website
                </label>
                <input
                  type="text"
                  value={settings.site_tagline || ''}
                  onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                  placeholder="Ruang Aman untuk Tumbuh dan Bercerita"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[11px] text-mutedtext mt-1 block">Subjudul pemikat di samping logo dan hero banner.</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-darktext">
                  Deskripsi Meta SEO (Google Meta Description)
                </label>
                <span className={`text-[10px] font-semibold ${
                  (settings.site_meta_description?.length || 0) > 160 ? 'text-amber-600 font-bold' : 'text-mutedtext'
                }`}>
                  {settings.site_meta_description?.length || 0} / 160 karakter disarankan
                </span>
              </div>
              <textarea
                rows={2}
                value={settings.site_meta_description || ''}
                onChange={(e) => setSettings({ ...settings, site_meta_description: e.target.value })}
                placeholder="Deskripsi singkat yang merangkum layanan BK kampus ketika tautan dibagikan atau dicari di Google..."
                className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Kata Kunci SEO (Meta Keywords)
              </label>
              <input
                type="text"
                value={settings.site_meta_keywords || ''}
                onChange={(e) => setSettings({ ...settings, site_meta_keywords: e.target.value })}
                placeholder="konseling online, bimbingan mahasiswa, kesehatan mental, konselor kampus"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-mutedtext mt-1 block">Pisahkan dengan tanda koma. Membantu indeksasi search engine kampus.</span>
            </div>
          </div>

          {/* Card 2: Kontak Resmi & Lokasi Fisik */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Kontak Resmi & Lokasi Kantor Pelayanan</h3>
                <p className="text-xs text-mutedtext">Informasi kontak publik untuk mahasiswa yang membutuhkan bantuan atau sesi tatap muka (offline).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Resmi Layanan BK</span>
                </label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  placeholder="konseling@syekhnurjati.ac.id"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp Hotline / Helpdesk BK</span>
                </label>
                <input
                  type="text"
                  value={settings.contact_whatsapp || ''}
                  onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value })}
                  placeholder="+62 812-3456-7890"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Alamat Fisik Gedung / Ruang Konseling</span>
                </label>
                <textarea
                  rows={2}
                  value={settings.campus_address || ''}
                  onChange={(e) => setSettings({ ...settings, campus_address: e.target.value })}
                  placeholder="Gedung PKM Lt. 2, Kampus Terpadu UINSSC, Cirebon"
                  className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jam Operasional Pelayanan</span>
                </label>
                <input
                  type="text"
                  value={settings.operating_hours || ''}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  placeholder="Senin - Jumat, 08:00 - 16:00 WIB"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[11px] text-mutedtext mt-1 block">Waktu ketersediaan konselor tatap muka di kampus.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Banner Pengumuman Website */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-darktext">Banner Pengumuman Atas (Announcement Bar)</h3>
                  <p className="text-xs text-mutedtext">Pita pengumuman darurat atau info penting di bagian teratas website publik.</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.announcement_bar_enabled}
                  onChange={(e) => setSettings({ ...settings, announcement_bar_enabled: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-darktext">
                  {settings.announcement_bar_enabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </label>
            </div>

            {settings.announcement_bar_enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">
                    Isi Pesan Pengumuman
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_text || ''}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    placeholder="Layanan Konseling Tatap Muka & Online tetap beroperasi penuh selama masa perkuliahan."
                    className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Live Preview Box */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Pratinjau Banner di Website Publik:
                  </span>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-soft-xs text-center">
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>{settings.announcement_text || 'Pengumuman informasi penting untuk civitas akademika.'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Pengaturan Web...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Web & SEO</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 6. BK Online App Settings Tab */}
      {(activeTab === 'counseling_settings' || activeTab === 'settings') && (
        <form onSubmit={onSave} className="space-y-6 max-w-4xl mx-auto">
          {/* Card 1: Parameter Sesi Konseling Mahasiswa */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Parameter Operasional Sesi Konseling</h3>
                <p className="text-xs text-mutedtext">Konfigurasi durasi tatap muka online/offline, kuota mahasiswa, dan batasan pembatalan.</p>
              </div>
            </div>

            {/* Durasi Sesi Konseling */}
            <div>
              <label className="block text-xs font-bold text-darktext mb-2">
                Durasi Standar per Sesi Konseling
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 30, label: '30 Menit', desc: 'Konseling Singkat' },
                  { value: 40, label: '40 Menit', desc: 'Standar' },
                  { value: 60, label: '60 Menit', desc: 'Mendalam' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, default_session_duration: item.value })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      Number(settings.default_session_duration) === item.value
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-soft-xs ring-2 ring-emerald-600/10'
                        : 'border-softborder bg-gray-50/70 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black text-darktext block">{item.label}</span>
                    <span className="text-[10px] text-mutedtext mt-0.5 block">{item.desc}</span>
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-mutedtext mt-1.5 block">Durasi ini otomatis menjadi acuan durasi meeting Zoom dan kalender konselor.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-gray-100">
              {/* Maksimal Kasus Aktif per Mahasiswa */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Batas Kasus Konseling Aktif per Mahasiswa
                </label>
                <select
                  value={settings.max_active_sessions_per_student}
                  onChange={(e) => setSettings({ ...settings, max_active_sessions_per_student: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value={1}>1 Sesi Aktif (Ketat - Wajib Selesai Sebelum Booking Baru)</option>
                  <option value={2}>2 Sesi Aktif (Rekomendasi - Fleksibel)</option>
                  <option value={3}>3 Sesi Aktif</option>
                  <option value={4}>4 Sesi Aktif</option>
                  <option value={5}>5 Sesi Aktif (Maksimal)</option>
                </select>
                <span className="text-[11px] text-mutedtext mt-1 block">Mencegah satu mahasiswa memborong banyak jadwal konselor sekaligus.</span>
              </div>

              {/* Cancellation Window Buffer */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Batas Waktu Pembatalan Mandiri (Cancellation Window)
                </label>
                <select
                  value={settings.cancellation_buffer_hours}
                  onChange={(e) => setSettings({ ...settings, cancellation_buffer_hours: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value={2}>2 Jam Sebelum Jadwal (Sangat Fleksibel)</option>
                  <option value={6}>6 Jam Sebelum Jadwal (Rekomendasi)</option>
                  <option value={12}>12 Jam Sebelum Jadwal (Moderat)</option>
                  <option value={24}>24 Jam Sebelum Jadwal (Ketat)</option>
                </select>
                <span className="text-[11px] text-mutedtext mt-1 block">Mahasiswa tidak dapat membatalkan mandiri jika waktu sesi mendekati batas ini.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Alur Penugasan Tutor & Persetujuan */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Alur Penugasan Konselor & Persetujuan Permohonan</h3>
                <p className="text-xs text-mutedtext">Tentukan bagaimana mahasiswa mendapatkan konselor dan apakah sesi langsung terkonfirmasi otomatis.</p>
              </div>
            </div>

            {/* Mode Penugasan Tutor */}
            <div>
              <label className="block text-xs font-bold text-darktext mb-2">
                Mode Penugasan Tutor (Tutor Assignment Mode)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    value: 'student_select',
                    title: 'Pilih Sendiri',
                    desc: 'Mahasiswa memilih konselor sendiri dari daftar tutor yang tersedia.',
                  },
                  {
                    value: 'manual',
                    title: 'Manual Admin',
                    desc: 'Kasus konseling masuk antrean, admin yang menentukan konselor yang tepat.',
                  },
                  {
                    value: 'automatic',
                    title: 'Otomatis Sistem',
                    desc: 'Sistem membagi merata ke konselor berdasarkan ketersediaan jadwal.',
                  },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      settings.tutor_assignment_mode === mode.value
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-soft-xs ring-2 ring-emerald-600/10'
                        : 'border-softborder bg-gray-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-darktext">{mode.title}</span>
                        <input
                          type="radio"
                          name="tutor_mode"
                          checked={settings.tutor_assignment_mode === mode.value}
                          onChange={() => setSettings({ ...settings, tutor_assignment_mode: mode.value })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-mutedtext leading-relaxed">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto Approve Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-darktext">Persetujuan Otomatis Permohonan Konseling (Auto-Approve)</h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Jika aktif, jadwal langsung terbit dan tautan Zoom otomatis digenerate tanpa perlu menunggu konfirmasi manual tutor.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_approve_counseling}
                onChange={(e) => setSettings({ ...settings, auto_approve_counseling: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ml-4"
              />
            </div>

            {/* Session Reminder Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-darktext">Pengingat Jadwal Konseling (Session Reminder)</h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Kirim notifikasi lonceng dan pemberitahuan berkala kepada mahasiswa dan tutor menjelang sesi konsultasi.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.reminder_notifications_enabled}
                onChange={(e) => setSettings({ ...settings, reminder_notifications_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ml-4"
              />
            </div>

            {/* General Counselee Consultation Access Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-darktext">Aktivasi Konseli Umum (Masyarakat Luar Kampus)</h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Jika dinonaktifkan, akun konseli umum / masyarakat tidak dapat mengajukan sesi konsultasi atau menjadwalkan bimbingan konselor.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.general_counselee_enabled !== false}
                onChange={(e) => setSettings({ ...settings, general_counselee_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ml-4 cursor-pointer"
              />
            </div>
          </div>

          {/* Card 3: Konfigurasi Email Notifikasi Booking & Pengingat Sesi (SMTP Gmail) */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
                    <span>Notifikasi Email Konseling (Booking Baru & Pengingat 1 Jam)</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      settings.mail_is_configured
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {settings.mail_is_configured ? '🟢 Gmail SMTP Siap' : '🟡 Belum Dikonfigurasi'}
                    </span>
                  </h3>
                  <p className="text-xs text-mutedtext">Atur pengiriman email langsung saat booking dibuat dan pengingat otomatis 1 jam sebelum jadwal dimulai.</p>
                </div>
              </div>
            </div>

            {/* Sub-Card 1: Saklar Notifikasi Email Otomatis */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-darktext uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                <span>Pengaturan Pengiriman Email Otomatis</span>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {/* Toggle 1: Email Booking Baru Langsung */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-slate-50/80 transition-all flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-darktext">Kirim Email Langsung Saat Booking Jadwal Dibuat</h5>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          settings.email_booking_notifications_enabled !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {settings.email_booking_notifications_enabled !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
                        Begitu konseli menyelesaikan booking jadwal, email konfirmasi rincian sesi otomatis dikirimkan ke <strong>Konseli</strong> dan <strong>Konselor</strong> secara instan.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.email_booking_notifications_enabled !== false}
                    onChange={(e) => setSettings({ ...settings, email_booking_notifications_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 shrink-0 mt-1 cursor-pointer"
                  />
                </div>

                {/* Toggle 2: Email Pengingat 1 Jam Sebelum Sesi */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-slate-50/80 transition-all flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-darktext">Kirim Ulang Email Pengingat (Reminder) 1 Jam Sebelum Mulai</h5>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          settings.email_reminders_enabled !== false
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {settings.email_reminders_enabled !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
                        Sistem otomatis mengirimkan email pengingat kepada <strong>Konseli</strong> dan <strong>Konselor</strong> tepat <strong>1 jam (60 menit)</strong> sebelum sesi konseling dimulai agar tidak melewatkan jadwal.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.email_reminders_enabled !== false}
                    onChange={(e) => setSettings({ ...settings, email_reminders_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 shrink-0 mt-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Sub-Card 2: Status Scheduler & Trigger Pengingat Manual */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-darktext flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                    <span>Status Scheduler Pengingat 1 Jam</span>
                  </h4>
                  <p className="text-[11px] text-mutedtext mt-0.5">
                    Scheduler Laravel otomatis memeriksa sesi setiap 1 menit (<code>counseling:send-reminders</code>) untuk mendeteksi sesi yang masuk jendela 60 menit ke depan.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isTriggeringReminders}
                  onClick={handleTriggerReminders}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-soft-xs"
                >
                  {isTriggeringReminders ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memeriksa Sesi...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Jalankan Pengingat Sekarang</span>
                    </>
                  )}
                </button>
              </div>

              {triggerRemindersResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold space-y-1 ${
                  triggerRemindersResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {triggerRemindersResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{triggerRemindersResult.message}</span>
                    {triggerRemindersResult.executed_at && (
                      <span className="text-[10px] text-mutedtext ml-auto font-normal">
                        {triggerRemindersResult.executed_at}
                      </span>
                    )}
                  </div>
                  {triggerRemindersResult.output && (
                    <pre className="text-[10px] font-mono p-2 bg-white/70 rounded-lg text-slate-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {triggerRemindersResult.output}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Sub-Card 3: Kredensial Akun Gmail SMTP */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-darktext uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Key className="w-3.5 h-3.5 text-teal-600" />
                <span>Konfigurasi Akun Pengirim Gmail SMTP</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gmail Username */}
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Alamat Gmail Pengirim (Akun Google Ruang BK)</span>
                  </label>
                  <input
                    type="email"
                    value={settings.mail_username || ''}
                    onChange={(e) => setSettings({ ...settings, mail_username: e.target.value })}
                    placeholder="ruangbk.official@gmail.com"
                    className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="text-[11px] text-mutedtext mt-1 block">Akun Gmail resmi yang digunakan sistem untuk mengirimkan email notifikasi.</span>
                </div>

                {/* Gmail App Password */}
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sandi Aplikasi Gmail (Google App Password 16-Digit)</span>
                  </label>
                  <input
                    type="password"
                    value={settings.mail_password || ''}
                    onChange={(e) => setSettings({ ...settings, mail_password: e.target.value })}
                    placeholder={settings.mail_password_masked || 'Contoh: abcd efgh ijkl mnop'}
                    className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="text-[11px] text-mutedtext mt-1 block">
                    {settings.mail_has_password
                      ? '🔒 Sandi tersimpan. Kosongkan jika tidak ingin mengubah.'
                      : 'Gunakan 16 karakter App Password dari menu Keamanan Akun Google.'}
                  </span>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">
                    Nama Tampilan Pengirim (Sender Name)
                  </label>
                  <input
                    type="text"
                    value={settings.mail_from_name || ''}
                    onChange={(e) => setSettings({ ...settings, mail_from_name: e.target.value })}
                    placeholder="Ruang BK Online"
                    className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="text-[11px] text-mutedtext mt-1 block">Nama instansi yang tampil di kolom 'Dari / From' pada kotak masuk penerima.</span>
                </div>

                {/* Reply-To Address */}
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">
                    Alamat Email Balasan (Reply-To / From Address)
                  </label>
                  <input
                    type="email"
                    value={settings.mail_from_address || ''}
                    onChange={(e) => setSettings({ ...settings, mail_from_address: e.target.value })}
                    placeholder="notifikasi@domain-anda.com (opsional)"
                    className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="text-[11px] text-mutedtext mt-1 block">Tujuan penerusan email jika konseli/konselor membalas email.</span>
                </div>
              </div>

              {/* Google App Password Guide Card */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2 text-xs">
                <h5 className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Panduan Membuat Sandi Aplikasi (Google App Password 16-Digit):</span>
                </h5>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] text-teal-950 leading-relaxed">
                  <li>Buka akun Gmail pengirim di <strong>myaccount.google.com</strong> &rarr; pilih menu <strong>Keamanan (*Security*)</strong>.</li>
                  <li>Pastikan <strong>Verifikasi 2 Langkah (*2-Step Verification*)</strong> pada akun Gmail tersebut sudah berstatus <strong>Aktif</strong>.</li>
                  <li>Cari menu <strong>Sandi Aplikasi (*App Passwords*)</strong>, lalu buat sandi baru dengan nama aplikasi: <code>Ruang BK</code>.</li>
                  <li>Salin 16 karakter sandi yang muncul (tanpa spasi) ke kolom <em>Sandi Aplikasi Gmail</em> di atas.</li>
                </ol>
              </div>

              {/* Test Email Section */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-sm">
                  <input
                    type="email"
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    placeholder="Kirim tes ke email ini (kosongkan untuk email admin)"
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <button
                  type="button"
                  disabled={isTestingEmail || !settings.mail_username}
                  onClick={handleRunEmailTest}
                  className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isTestingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                      <span>Mengirim Email Uji Coba...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-teal-700" />
                      <span>Uji Kirim Email (Test Gmail)</span>
                    </>
                  )}
                </button>
              </div>

              {testEmailResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testEmailResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testEmailResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testEmailResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Aturan Konseling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Aturan Operasional Konseling</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}



      {/* 9. General System Settings & Health Tab */}
      {activeTab === 'general_settings' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Informasi Lingkungan Sistem & Status Server</h3>
                <p className="text-xs text-mutedtext">Pemeriksaan integritas komponen backend, basis data, dan modul integrasi.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-mutedtext uppercase tracking-wider block">Versi Aplikasi</span>
                <span className="text-base font-black text-darktext mt-1 block">Ruang BK v2.4</span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">🟢 Status: Aktif & Stabil</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-mutedtext uppercase tracking-wider block">Backend & Basis Data</span>
                <span className="text-base font-black text-darktext mt-1 block">Laravel 11 / PHP 8.2</span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">🟢 MySQL Connected</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-mutedtext uppercase tracking-wider block">Modul Video Conference</span>
                <span className="text-base font-black text-darktext mt-1 block">
                  {settings.zoom_mock_mode ? 'Simulasi Mock' : 'Live Zoom OAuth'}
                </span>
                <span className={`text-[11px] font-semibold mt-0.5 block ${
                  settings.zoom_is_configured ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {settings.zoom_is_configured ? '🟢 OAuth API Terverifikasi' : '🟡 Belum Terhubung'}
                </span>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <h4 className="text-xs font-bold text-darktext">Pintas Navigasi CMS & Konfigurasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('web_settings')}
                  className="p-3 rounded-2xl border border-softborder hover:border-emerald-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-emerald-800 block">Pengaturan Identitas & SEO Web</span>
                      <span className="text-[11px] text-mutedtext block">Ubah judul, meta description, dan hotline</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('counseling_settings')}
                  className="p-3 rounded-2xl border border-softborder hover:border-emerald-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-emerald-800 block">Aturan Operasional Konseling</span>
                      <span className="text-[11px] text-mutedtext block">Durasi sesi, kuota mahasiswa, penugasan</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('zoom_settings')}
                  className="p-3 rounded-2xl border border-blue-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-blue-800 block">Zoom Meeting</span>
                      <span className="text-[11px] text-mutedtext block">Kredensial API & Uji Koneksi Langsung</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className="p-3 rounded-2xl border border-purple-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-purple-800 block">Rekaman Suara Asisten Nara 🎙️</span>
                      <span className="text-[11px] text-mutedtext block">Kelola audio salam, skrining & panduan</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSettingsTab;
