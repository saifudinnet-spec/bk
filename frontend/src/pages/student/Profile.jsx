import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap, Mail, Phone, MapPin, ShieldCheck, LogOut, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import Modal from '../../components/common/Modal';
import PageTransition from '../../components/common/PageTransition';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Profile Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-soft-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-2xs"
              title="Akun Aktif"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">{user?.name}</h1>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {user?.role === 'STUDENT' ? 'Mahasiswa Terdaftar' : user?.role === 'GENERAL' ? 'Pengguna Umum' : user?.role}
              </span>
              {user?.profile?.nim && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
                  NIM: {user.profile.nim}
                </span>
              )}
              <span className="text-[10px] font-semibold text-emerald-700 hidden sm:inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Terverifikasi Sistem Kampus</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Logout Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLogoutModal(true)}
          className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 w-full sm:w-auto justify-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar dari Akun</span>
        </motion.button>
      </div>

      {/* Main Content: 2-Column Responsive Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch">
        {/* Left Column: Academic & Status Card (4 of 12 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm p-4 sm:p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">Status Akademik</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Program Studi</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">{user?.profile?.program_study || 'Belum Diatur'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Jenjang</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{user?.profile?.degree || 'S1'}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status Akademik</span>
                  <span className="font-bold text-emerald-800 mt-0.5 block">{user?.profile?.campus_status || 'Aktif'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Nomor Induk Mahasiswa</span>
                <span className="font-bold font-mono text-emerald-950 mt-0.5 block">{user?.profile?.nim || '-'}</span>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Box */}
          <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100/90 text-teal-950 flex items-start gap-2.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug font-medium text-teal-900">
              Data pribadi & rekam konseling Anda terlindungi dengan standar kerahasiaan institusi.
            </p>
          </div>
        </div>

        {/* Right Column: Personal & Contact Details (8 of 12 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm p-4 sm:p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">Data Pribadi & Kontak</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>Email Akun</span>
                </div>
                <span className="font-semibold text-slate-900 block truncate">{user?.email}</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Nomor WhatsApp / HP</span>
                </div>
                <span className="font-semibold text-slate-900 block">{user?.phone || '-'}</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Jenis Kelamin</span>
                <span className="font-semibold text-slate-900 block">{user?.profile?.gender || '-'}</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Tempat, Tanggal Lahir</span>
                <span className="font-semibold text-slate-900 block truncate">
                  {[user?.profile?.birth_place, user?.profile?.birth_date].filter(Boolean).join(', ') || '-'}
                </span>
              </div>

              <div className="sm:col-span-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Alamat Domisili</span>
                </div>
                <span className="font-semibold text-slate-900 block leading-relaxed text-xs">
                  {user?.profile?.address || 'Belum mengisi alamat domisili.'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 mt-2">
            <span className="flex items-center gap-1 text-slate-500">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Ruang BK • Konseling Mahasiswa</span>
            </span>
            <span className="font-medium text-[10.5px]">Sinkronisasi Pangkalan Data Kampus</span>
          </div>
        </div>
      </div>

      {/* Logout Confirm Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Konfirmasi Keluar"
      >
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Apakah Anda yakin ingin keluar dari sesi aplikasi Ruang BK? Anda dapat masuk kembali kapan saja.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => {
              setShowLogoutModal(false);
              logout();
            }}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft-sm transition-colors"
          >
            Ya, Keluar
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Profile;

