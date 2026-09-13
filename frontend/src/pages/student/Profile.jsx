import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap, Mail, Phone, MapPin, ShieldCheck, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import Modal from '../../components/common/Modal';
import PageTransition from '../../components/common/PageTransition';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <PageTransition className="space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-soft-sm shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-darktext truncate">{user?.name}</h2>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <p className="text-xs text-mutedtext mt-0.5 truncate">{user?.email}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {user?.role === 'STUDENT' ? 'Mahasiswa Terdaftar' : user?.role === 'GENERAL' ? 'Pengguna Umum' : user?.role}
          </span>
        </div>
      </div>

      {/* Details List */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
        <h3 className="text-sm font-bold text-darktext border-b border-gray-100 pb-3">
          Informasi Akun & Data Diri
        </h3>

        <div className="space-y-3 text-xs">
          {user?.profile?.nim && (
            <div className="flex items-center justify-between py-1">
              <span className="text-mutedtext flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>NIM Kampus</span>
              </span>
              <span className="font-bold font-mono text-darktext">{user.profile.nim}</span>
            </div>
          )}

          {user?.profile?.program_study && (
            <div className="flex items-center justify-between py-1">
              <span className="text-mutedtext">Program Studi</span>
              <span className="font-semibold text-darktext text-right max-w-xs">{user.profile.program_study}</span>
            </div>
          )}

          {user?.profile?.degree && (
            <div className="flex items-center justify-between py-1">
              <span className="text-mutedtext">Jenjang / Semester</span>
              <span className="font-semibold text-darktext">
                {user.profile.degree} (Semester {user.profile.semester || 1})
              </span>
            </div>
          )}

          {(user?.profile?.birth_place || user?.profile?.birth_date) && (
            <div className="flex items-center justify-between py-1">
              <span className="text-mutedtext">Tempat, Tanggal Lahir (TTL)</span>
              <span className="font-semibold text-darktext text-right">
                {[user?.profile?.birth_place, user?.profile?.birth_date].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <span className="text-mutedtext flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600" />
              <span>Email</span>
            </span>
            <span className="font-semibold text-darktext">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-mutedtext flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-600" />
              <span>Nomor HP</span>
            </span>
            <span className="font-semibold text-darktext">{user?.phone || '-'}</span>
          </div>

          {user?.profile?.gender && (
            <div className="flex items-center justify-between py-1">
              <span className="text-mutedtext">Jenis Kelamin</span>
              <span className="font-semibold text-darktext">{user.profile.gender}</span>
            </div>
          )}

          {user?.profile?.address && (
            <div className="flex items-start justify-between py-1 gap-4">
              <span className="text-mutedtext flex items-center gap-2 shrink-0">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Alamat</span>
              </span>
              <span className="font-semibold text-darktext text-right text-xs leading-relaxed">
                {user.profile.address}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center gap-3 text-xs text-teal-900">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
        <p className="leading-relaxed text-[11px]">
          Data pribadi Anda terlindungi dalam sistem Ruang BK sesuai ketentuan kerahasiaan layanan bimbingan konseling institusi.
        </p>
      </div>

      {/* Logout Button */}
      <div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3.5 px-4 rounded-2xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors min-h-[48px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </motion.button>
      </div>

      {/* Logout Confirm Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Konfirmasi Keluar"
      >
        <p className="text-xs text-mutedtext mb-5 leading-relaxed">
          Apakah Anda yakin ingin keluar dari sesi aplikasi Ruang BK? Anda dapat masuk kembali kapan saja.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={() => {
              setShowLogoutModal(false);
              logout();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft-sm"
          >
            Ya, Keluar
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Profile;
