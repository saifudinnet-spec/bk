import React from 'react';
import {
  Globe,
  SlidersHorizontal,
  ShieldAlert,
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
  Mic
} from 'lucide-react';

export const AdminSettingsTab = ({
  activeTab,
  settings,
  setSettings,
  onSave,
  isSavingSettings,
  setActiveTab
}) => {
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
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ml-4"
              />
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

      {/* 8. Crisis & Screening Settings Tab */}
      {activeTab === 'crisis_settings' && (
        <form onSubmit={onSave} className="space-y-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Deteksi Krisis & Skrining Kebutuhan Mental</h3>
                <p className="text-xs text-mutedtext">Konfigurasi perlindungan darurat untuk mendeteksi indikasi risiko tinggi pada mahasiswa.</p>
              </div>
            </div>

            {/* Crisis Flagging Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-darktext">Deteksi Crisis Flag Otomatis</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    Prioritas Darurat
                  </span>
                </div>
                <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
                  Tandai secara otomatis screening mahasiswa yang terdeteksi memiliki ide menyakiti diri sendiri, keputusasaan akut, atau skor depresi berat. Kasus ini langsung diprioritaskan di daftar konseling.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.crisis_flag_enabled}
                onChange={(e) => setSettings({ ...settings, crisis_flag_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 shrink-0 ml-4"
              />
            </div>

            {/* Emergency Notification Email */}
            <div>
              <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Notifikasi Darurat Tim Krisis Kampus</span>
              </label>
              <input
                type="email"
                value={settings.crisis_alert_email || ''}
                onChange={(e) => setSettings({ ...settings, crisis_alert_email: e.target.value })}
                placeholder="crisis-center@syekhnurjati.ac.id"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <span className="text-[11px] text-mutedtext mt-1 block">
                Saat ada screening terdeteksi krisis, sistem akan mengirimkan peringatan khusus ke email koordinator konselor atau satgas kesehatan mental.
              </span>
            </div>

            {/* SOP Protocol Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Prosedur Standar (SOP) Penanganan Krisis</span>
              </h5>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                <li>Mahasiswa dengan tanda krisis akan didahulukan dalam penentuan jadwal tanpa antrean reguler.</li>
                <li>Data screening dienkripsi dan hanya dapat diakses oleh konselor yang memiliki izin asesmen klinis.</li>
                <li>Asisten virtual Nara tidak akan memberikan diagnosis mandiri dan akan mengarahkan mahasiswa ke hotline darurat.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Pengaturan Krisis...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Krisis</span>
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
