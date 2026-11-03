import React from 'react';
import {
  LogIn,
  GraduationCap,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  UserCheck,
  ShieldCheck,
  FileText,
  Mail,
  Sliders,
  BarChart3,
  Layers,
  ArrowRight,
  Send,
  MessageSquare
} from 'lucide-react';

export const GuideMockupGraphic = ({ stepId, role }) => {
  // Common browser header bar
  const BrowserBar = ({ title }) => (
    <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium select-none">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="bg-white px-3 py-0.5 rounded-md border border-slate-200 text-slate-600 font-mono text-[10px] truncate max-w-[200px]">
        {title || 'ruangbk.uinssc.ac.id'}
      </div>
      <div className="w-8" />
    </div>
  );

  // Konseli Mockups
  if (role === 'konseli') {
    if (stepId === 'konseli-1') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/login" />
          <div className="p-5 flex flex-col items-center justify-center min-h-[220px] bg-gradient-to-b from-white to-emerald-50/30">
            <div className="w-full max-w-xs bg-white rounded-xl p-4 border border-emerald-100 shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Masuk SSO Cyber Campus</h4>
              <p className="text-[10px] text-slate-500 mb-3">Gunakan NIM dan Password Mahasiswa Anda</p>
              <div className="space-y-2 text-left">
                <div className="h-7 bg-slate-100 rounded-lg border border-slate-200 px-2.5 flex items-center text-[10px] text-slate-400">
                  <span>NIM: 220810100...</span>
                </div>
                <div className="h-7 bg-slate-100 rounded-lg border border-slate-200 px-2.5 flex items-center text-[10px] text-slate-400">
                  <span>Password: ••••••••</span>
                </div>
                <div className="h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-[11px] font-semibold gap-1.5 shadow-sm">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk Akun Mahasiswa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konseli-2') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/app/screening" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-teal-50/20">
            <div className="max-w-sm mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                  Kuesioner DASS-21 (Deteksi Dini)
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Pertanyaan 4 dari 21
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full w-[25%]" />
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  "Saya merasa sulit beristirahat atau merasa tegang dalam 2 minggu terakhir"
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {['Tidak Pernah', 'Kadang-kadang', 'Sering', 'Hampir Selalu'].map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-[10px] font-medium border text-center transition-all ${
                        i === 1
                          ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konseli-3') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/konselor" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-emerald-50/20">
            <div className="max-w-sm mx-auto space-y-2.5">
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px]">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-semibold">Semua Topik</span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">Kendala Skripsi</span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">Kecemasan</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-emerald-800 text-xs">
                    FK
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Fatimah Zahra, M.Psi.</h5>
                    <p className="text-[10px] text-emerald-700 font-medium">Psikolog Klinis & Akademik</p>
                    <span className="text-[9px] text-slate-400">Tersedia: 4 slot minggu ini</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                  Pilih Jadwal
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konseli-4') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/app/counseling/book" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-emerald-50/30">
            <div className="max-w-sm mx-auto bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih Tanggal & Waktu Sesi
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Online Video
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                {['09:00 - 10:00', '10:30 - 11:30', '13:30 - 14:30'].map((slot, i) => (
                  <div
                    key={i}
                    className={`py-1.5 px-1 rounded-lg border font-medium ${
                      i === 1
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 flex items-center justify-between">
                <span>Konfirmasi Janji Temu</span>
                <span className="font-bold text-emerald-700">Gratis (Fasilitas Kampus)</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konseli-5') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/app/sessions/room-102" />
          <div className="p-4 min-h-[220px] bg-slate-900 text-white flex flex-col justify-between rounded-b-xl">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-300">Sesi Konseling Privat Aktif</span>
              </div>
              <div className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Enkripsi TLS 256-bit
              </div>
            </div>
            <div className="py-4 space-y-2 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 max-w-[85%] text-[11px]">
                <p className="text-emerald-400 font-semibold text-[10px] mb-0.5">Konselor:</p>
                Halo, selamat pagi. Terima kasih sudah meluangkan waktu. Apa hal yang paling ingin Anda bagikan hari ini?
              </div>
              <div className="bg-emerald-800/90 p-2.5 rounded-lg border border-emerald-700 max-w-[85%] ml-auto text-[11px] text-right">
                <p className="text-emerald-200 font-semibold text-[10px] mb-0.5">Anda (Konseli):</p>
                Selamat pagi Bu, akhir-akhir ini saya merasa sangat kewalahan membagi waktu skripsi dan magang...
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <div className="flex-1 bg-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 border border-slate-700">
                Tulis pesan bimbingan konseling...
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konseli-6') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/app/action-plans" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-emerald-50/20">
            <div className="max-w-sm mx-auto bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Rencana Aksi Mandiri (Action Plan)
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  2/3 Selesai
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="line-through text-slate-400">Latihan pernapasan 4-7-8 setiap pagi</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="line-through text-slate-400">Tulis target mikro skripsi 1 lembar per hari</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium">
                  <div className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0" />
                  <span>Jadwalkan sesi evaluasi 2 minggu lagi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Konselor Mockups
  if (role === 'konselor') {
    if (stepId === 'konselor-1') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/tutor/dashboard" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-sky-50/20 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-sky-100 shadow-sm text-center">
                <span className="text-[10px] text-slate-500 block">Kasus Aktif</span>
                <span className="text-base font-extrabold text-sky-700">12</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-teal-100 shadow-sm text-center">
                <span className="text-[10px] text-slate-500 block">Jadwal Hari Ini</span>
                <span className="text-base font-extrabold text-teal-700">3 Sesi</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-sm text-center">
                <span className="text-[10px] text-slate-500 block">Selesai</span>
                <span className="text-base font-extrabold text-emerald-700">48</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Sesi Terdekat Hari Ini:</span>
              <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <div>
                  <h6 className="font-bold text-sky-950">Ahmad Farhan (NIM: 2208...)</h6>
                  <p className="text-[10px] text-sky-700">10:00 - 11:00 WIB • Online Video</p>
                </div>
                <div className="px-2.5 py-1 rounded bg-sky-600 text-white text-[10px] font-bold">
                  Buka Ruang
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konselor-2') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/tutor/schedule" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-sky-50/20 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              Kelola Slot Ketersediaan Konseling
            </span>
            <div className="space-y-1.5 text-xs">
              {['Senin', 'Selasa', 'Kamis'].map((hari, i) => (
                <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800">{hari}</span>
                    <span className="text-[10px] text-slate-500">(09:00 - 15:00 WIB)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'konselor-3' || stepId === 'konselor-4' || stepId === 'konselor-5') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/tutor/cases/record" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-sky-50/20 space-y-2">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Catatan Rekam Konseling (SOAP)
              </span>
              <span className="text-[10px] font-bold text-slate-500">ID Kasus: #BK-2026-089</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-[11px]">
              <div>
                <span className="font-bold text-slate-700 block text-[10px]">Ringkasan Anamnesis:</span>
                <p className="text-slate-500 text-[10px]">Konseli mengeluhkan kesulitan konsentrasi saat menghadapi deadline seminar proposal...</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 block text-[10px]">Rencana Tindak Lanjut:</span>
                <p className="text-slate-500 text-[10px]">Teknik regulasi emosi + evaluasi 1 minggu ke depan.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Admin Mockups
  if (role === 'admin') {
    if (stepId === 'admin-1') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/admin/users" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-purple-50/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                Manajemen Pengguna & Verifikasi
              </span>
              <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                128 Pengguna Aktif
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-800">Drs. M. Ridwan, M.Pd.</h6>
                  <p className="text-[10px] text-slate-400">Konselor Dosen BK</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Terverifikasi
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-slate-800">Rina Syafitri (Mahasiswa)</h6>
                  <p className="text-[10px] text-slate-400">Fakultas Tarbiyah</p>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Mahasiswa SSO
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'admin-2') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/admin/cms" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-purple-50/20 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              CMS Editor Antarmuka Publik
            </span>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Slide Banner Hero Carousel</span>
                <span className="text-purple-600 font-bold">2 Slide Aktif</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Topik Permasalahan Konseling</span>
                <span className="text-purple-600 font-bold">6 Topik</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Panduan Pengguna (Konseli/Konselor/Admin)</span>
                <span className="text-emerald-600 font-bold">Tersinkronisasi</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'admin-3') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/admin/settings/email" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-purple-50/20 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              Konfigurasi SMTP Google Workspace
            </span>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 border-b pb-1">
                <span>Alamat Pengirim:</span>
                <span className="font-mono font-bold text-purple-700">bk-online@uinssc.ac.id</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 border-b pb-1">
                <span>Sandi Aplikasi (App Password):</span>
                <span className="font-mono">•••• •••• •••• ••••</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Koneksi SMTP Terhubung
                </span>
                <div className="px-2 py-1 rounded bg-purple-600 text-white font-bold">
                  Tes Kirim Email
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'admin-4') {
      return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <BrowserBar title="ruangbk.uinssc.ac.id/admin/analytics" />
          <div className="p-4 min-h-[220px] bg-gradient-to-b from-white to-purple-50/20 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              Statistik & Tren Kesehatan Mental Kampus
            </span>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-[10px]">
              <div className="flex items-end justify-between h-20 px-2 pt-2 border-b border-slate-200">
                <div className="w-8 bg-purple-200 rounded-t h-[40%]" />
                <div className="w-8 bg-purple-400 rounded-t h-[65%]" />
                <div className="w-8 bg-purple-600 rounded-t h-[90%]" />
                <div className="w-8 bg-emerald-500 rounded-t h-[75%]" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 px-1">
                <span>Akademik</span>
                <span>Kecemasan</span>
                <span>Burnout</span>
                <span>Relasi</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className="w-full bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 text-center min-h-[200px]">
      <Sliders className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-xs font-medium">Ilustrasi Langkah Panduan</span>
    </div>
  );
};

