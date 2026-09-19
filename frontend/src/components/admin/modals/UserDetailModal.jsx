import React from 'react';
import {
  X,
  Users,
  GraduationCap,
  Globe,
  ShieldCheck,
  Power
} from 'lucide-react';

export const UserDetailModal = ({ user, onClose, onToggleStatus }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-softborder shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-softborder flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center border ${
                user.role === 'STUDENT'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : user.role === 'GENERAL'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : user.role === 'TUTOR'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-darktext">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-darktext">
                  ID: #{user.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {user.status === 'active' ? 'Akun Aktif' : 'Akun Non-aktif'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-mutedtext hover:text-darktext hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Account Information */}
          <div>
            <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
              <Users className="w-4 h-4 text-emerald-700" />
              Informasi Akun & Kontak
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
              <div>
                <span className="text-[11px] text-mutedtext block">Email:</span>
                <span className="font-semibold text-darktext">{user.email}</span>
              </div>
              <div>
                <span className="text-[11px] text-mutedtext block">Nomor WhatsApp:</span>
                <span className="font-semibold text-darktext">{user.phone || 'Belum diisi'}</span>
              </div>
              <div>
                <span className="text-[11px] text-mutedtext block">Peran (Role):</span>
                <span className="font-semibold text-darktext">{user.role}</span>
              </div>
              <div>
                <span className="text-[11px] text-mutedtext block">Tanggal Pendaftaran:</span>
                <span className="font-semibold text-darktext font-mono text-[11px]">
                  {new Date(user.created_at).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Role-Specific Information */}
          {user.role === 'STUDENT' && user.student_profile && (
            <div>
              <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                <GraduationCap className="w-4 h-4 text-indigo-700" />
                Data Akademik Konseli Mahasiswa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <div>
                  <span className="text-[11px] text-mutedtext block">Nomor Induk Mahasiswa (NIM):</span>
                  <span className="font-semibold text-darktext font-mono">
                    {user.student_profile.nim || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Status Kampus:</span>
                  <span className="font-semibold text-emerald-700">
                    {user.student_profile.campus_status || 'AKTIF'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Program Studi:</span>
                  <span className="font-semibold text-darktext">
                    {user.student_profile.program_study || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Jenjang Pendidikan:</span>
                  <span className="font-semibold text-darktext">
                    {user.student_profile.degree || 'S1'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Tempat, Tanggal Lahir:</span>
                  <span className="font-semibold text-darktext">
                    {user.student_profile.birth_place || '-'}
                    {user.student_profile.birth_date ? `, ${new Date(user.student_profile.birth_date).toLocaleDateString('id-ID')}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Jenis Kelamin:</span>
                  <span className="font-semibold text-darktext">
                    {user.student_profile.gender || '-'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-mutedtext block">Alamat Domisili:</span>
                  <span className="font-semibold text-darktext">
                    {user.student_profile.address || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {user.role === 'GENERAL' && user.general_profile && (
            <div>
              <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                <Globe className="w-4 h-4 text-purple-700" />
                Data Kependudukan Klien Umum
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div>
                  <span className="text-[11px] text-mutedtext block">Nomor Induk Kependudukan (NIK):</span>
                  <span className="font-semibold text-darktext font-mono">
                    {user.general_profile.nik || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Jenis Kelamin:</span>
                  <span className="font-semibold text-darktext">
                    {user.general_profile.gender || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Tempat, Tanggal Lahir:</span>
                  <span className="font-semibold text-darktext">
                    {user.general_profile.birth_place || '-'}
                    {user.general_profile.birth_date ? `, ${new Date(user.general_profile.birth_date).toLocaleDateString('id-ID')}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Alamat Terdaftar:</span>
                  <span className="font-semibold text-darktext">
                    {user.general_profile.address || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {user.role === 'TUTOR' && user.tutor_profile && (
            <div>
              <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                Profil Konselor / Tutor BK
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <span className="text-[11px] text-mutedtext block">Nomor Induk Pegawai (NIP):</span>
                  <span className="font-semibold text-darktext font-mono">
                    {user.tutor_profile.nip || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-mutedtext block">Ketersediaan Konseling:</span>
                  <span className={`font-semibold ${user.tutor_profile.is_available ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {user.tutor_profile.is_available ? '🟢 Siap Menerima Jadwal' : '🔴 Jadwal Sedang Ditutup'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-mutedtext block">Bidang Spesialisasi:</span>
                  <span className="font-semibold text-darktext">
                    {user.tutor_profile.specialization || 'Konseling Umum'}
                  </span>
                </div>
                {user.tutor_profile.bio && (
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-mutedtext block">Bio Singkat:</span>
                    <p className="text-darktext/90 italic bg-white/60 p-2.5 rounded-xl border border-emerald-100">
                      "{user.tutor_profile.bio}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {user.role === 'ADMIN' && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
              <h4 className="font-bold text-amber-900 flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Izin Akses Tingkat Administrator
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Akun ini memiliki hak akses tertinggi ke seluruh panel administrasi, konfigurasi web, pengaturan integrasi Zoom Server-to-Server OAuth, manajemen protokol darurat krisis, serta audit log sistem.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-[11px] text-mutedtext">
            Status saat ini: <strong>{user.status === 'active' ? 'Aktif' : 'Non-aktif'}</strong>
          </span>
          <div className="flex items-center gap-2">
            {user.role !== 'ADMIN' && onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(user.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                  user.status === 'active'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {user.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-bold text-darktext transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
