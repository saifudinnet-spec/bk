import React, { useState } from 'react';
import {
  Users,
  HeartHandshake,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  Mail,
  Phone,
  Eye,
  Power,
  UserPlus,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import UserDetailModal from '../modals/UserDetailModal';
import CreateUserModal from '../modals/CreateUserModal';

export const AdminUsersTab = ({
  users = [],
  userRoleFilter = 'COUNSELEE',
  setUserRoleFilter,
  counseleeSubFilter = 'ALL',
  setCounseleeSubFilter,
  isLoadingUsers,
  reloadUsers,
  handleToggleUserStatus,
  generalCounseleeEnabled = true,
  onToggleGeneralCounselee
}) => {
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserRole, setCreateUserRole] = useState('TUTOR');

  // User Counts by Role & Status
  const userCounts = {
    all: users.length,
    counselee: users.filter((u) => u.role === 'STUDENT' || u.role === 'GENERAL').length,
    student: users.filter((u) => u.role === 'STUDENT').length,
    general: users.filter((u) => u.role === 'GENERAL').length,
    tutor: users.filter((u) => u.role === 'TUTOR').length,
    admin: users.filter((u) => u.role === 'ADMIN').length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status !== 'active').length,
    counseleeActive: users.filter((u) => (u.role === 'STUDENT' || u.role === 'GENERAL') && u.status === 'active').length,
    counseleeInactive: users.filter((u) => (u.role === 'STUDENT' || u.role === 'GENERAL') && u.status !== 'active').length,
    tutorActive: users.filter((u) => u.role === 'TUTOR' && u.status === 'active').length,
    tutorInactive: users.filter((u) => u.role === 'TUTOR' && u.status !== 'active').length,
    adminActive: users.filter((u) => u.role === 'ADMIN' && u.status === 'active').length,
    adminInactive: users.filter((u) => u.role === 'ADMIN' && u.status !== 'active').length,
  };

  // Filtered Users List based on Tab, Sub-filter, Status, and Search Query
  const filteredUsers = users.filter((u) => {
    // 1. Role Filter Tab (Only COUNSELEE, TUTOR, ADMIN)
    if (userRoleFilter === 'COUNSELEE') {
      if (u.role !== 'STUDENT' && u.role !== 'GENERAL') return false;
      if (counseleeSubFilter === 'STUDENT' && u.role !== 'STUDENT') return false;
      if (counseleeSubFilter === 'GENERAL' && u.role !== 'GENERAL') return false;
    } else if (userRoleFilter === 'TUTOR') {
      if (u.role !== 'TUTOR') return false;
    } else if (userRoleFilter === 'ADMIN') {
      if (u.role !== 'ADMIN') return false;
    } else {
      if (u.role !== 'STUDENT' && u.role !== 'GENERAL') return false;
    }

    // 2. Status Filter
    if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) {
      return false;
    }

    // 3. Search Query (name, email, phone, NIM, NIK, NIP, prodi, specialization)
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const phoneMatch = u.phone?.toLowerCase().includes(q);
      const nimMatch = u.student_profile?.nim?.toLowerCase().includes(q);
      const prodiMatch = u.student_profile?.program_study?.toLowerCase().includes(q);
      const nikMatch = u.general_profile?.nik?.toLowerCase().includes(q);
      const nipMatch = u.tutor_profile?.nip?.toLowerCase().includes(q);
      const specMatch = u.tutor_profile?.specialization?.toLowerCase().includes(q);

      return nameMatch || emailMatch || phoneMatch || nimMatch || prodiMatch || nikMatch || nipMatch || specMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Main Controls Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
        {/* Role Filter Tabs & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-softborder">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setUserRoleFilter('COUNSELEE');
                setCounseleeSubFilter('ALL');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                userRoleFilter === 'COUNSELEE'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-mutedtext hover:text-indigo-700 hover:bg-white/40'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Konseli
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {userCounts.counselee}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setUserRoleFilter('TUTOR')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                userRoleFilter === 'TUTOR'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-mutedtext hover:text-emerald-700 hover:bg-white/40'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Konselor
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {userCounts.tutor}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setUserRoleFilter('ADMIN')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                userRoleFilter === 'ADMIN'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-mutedtext hover:text-amber-700 hover:bg-white/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {userCounts.admin}
              </span>
            </button>
          </div>

          {/* Action Buttons: Add User & Refresh Data */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            {/* Add User Buttons */}
            {userRoleFilter === 'TUTOR' && (
              <button
                type="button"
                onClick={() => {
                  setCreateUserRole('TUTOR');
                  setIsCreateUserModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-soft-sm flex items-center gap-1.5 shrink-0"
                title="Tambah data akun konselor baru"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Konselor
              </button>
            )}

            {userRoleFilter === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setCreateUserRole('ADMIN');
                  setIsCreateUserModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-all shadow-soft-sm flex items-center gap-1.5 shrink-0"
                title="Tambah data akun administrator baru"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Admin
              </button>
            )}

            {userRoleFilter === 'COUNSELEE' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreateUserRole('TUTOR');
                    setIsCreateUserModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Tambah data konselor"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Konselor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateUserRole('ADMIN');
                    setIsCreateUserModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Tambah data admin"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  + Admin
                </button>
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={reloadUsers}
              disabled={isLoadingUsers}
              className="px-3.5 py-2 rounded-xl border border-softborder hover:bg-gray-50 text-xs font-semibold text-mutedtext hover:text-darktext transition-colors flex items-center gap-2 shrink-0"
              title="Segarkan daftar pengguna"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-emerald-700' : ''}`} />
              {isLoadingUsers ? 'Menyegarkan...' : 'Segarkan Data'}
            </button>
          </div>
        </div>

        {/* Konseli Specific Section: General Counselee Activation Banner */}
        {userRoleFilter === 'COUNSELEE' && (
          <div className="pt-1 pb-1">
            {/* General Counselee Consultation Status Banner & Toggle */}
            <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    generalCounseleeEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {generalCounseleeEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-darktext">
                      Status Konseli Umum (Masyarakat Luar Kampus)
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        generalCounseleeEnabled
                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100/80 text-rose-800 border-rose-300'
                      }`}
                    >
                      {generalCounseleeEnabled ? '🟢 Layanan Aktif' : '🔴 Layanan Dinonaktifkan'}
                    </span>
                  </div>
                  <p className="text-[11px] text-mutedtext mt-0.5 leading-relaxed">
                    {generalCounseleeEnabled
                      ? 'Masyarakat umum (non-civitas) dapat mendaftar dan mengajukan sesi konsultasi dengan konselor.'
                      : 'Masyarakat umum diblokir dan tidak dapat mengajukan atau menjadwalkan konsultasi konseling baru.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleGeneralCounselee}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border shadow-soft-xs ${
                  generalCounseleeEnabled
                    ? 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300'
                    : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {generalCounseleeEnabled ? 'Nonaktifkan Konseli Umum' : 'Aktifkan Konseli Umum'}
              </button>
            </div>
          </div>
        )}

        {/* Search and Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Cari nama, email, no HP, NIM, NIK, program studi, atau spesialisasi..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-softborder text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
            />
            {userSearch && (
              <button
                type="button"
                onClick={() => setUserSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedtext hover:text-darktext"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            {userRoleFilter === 'COUNSELEE' ? (
              <select
                value={
                  counseleeSubFilter === 'STUDENT'
                    ? 'STUDENT'
                    : counseleeSubFilter === 'GENERAL'
                    ? 'GENERAL'
                    : userStatusFilter === 'active'
                    ? 'ACTIVE'
                    : userStatusFilter === 'inactive'
                    ? 'INACTIVE'
                    : 'ALL'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'STUDENT') {
                    setCounseleeSubFilter('STUDENT');
                    setUserStatusFilter('ALL');
                  } else if (val === 'GENERAL') {
                    setCounseleeSubFilter('GENERAL');
                    setUserStatusFilter('ALL');
                  } else if (val === 'ACTIVE') {
                    setCounseleeSubFilter('ALL');
                    setUserStatusFilter('active');
                  } else if (val === 'INACTIVE') {
                    setCounseleeSubFilter('ALL');
                    setUserStatusFilter('inactive');
                  } else {
                    setCounseleeSubFilter('ALL');
                    setUserStatusFilter('ALL');
                  }
                }}
                className="px-3 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Konseli ({userCounts.counselee})</option>
                <optgroup label="Kategori Konseli">
                  <option value="STUDENT">🎓 Mahasiswa Kampus ({userCounts.student})</option>
                  <option value="GENERAL">🌐 Masyarakat Umum ({userCounts.general})</option>
                </optgroup>
                <optgroup label="Status Akun">
                  <option value="ACTIVE">🟢 Status: Aktif ({userCounts.counseleeActive})</option>
                  <option value="INACTIVE">🔴 Status: Non-aktif ({userCounts.counseleeInactive})</option>
                </optgroup>
              </select>
            ) : userRoleFilter === 'TUTOR' ? (
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Konselor ({userCounts.tutor})</option>
                <option value="active">🟢 Status: Aktif ({userCounts.tutorActive})</option>
                <option value="inactive">🔴 Status: Non-aktif ({userCounts.tutorInactive})</option>
              </select>
            ) : (
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Administrator ({userCounts.admin})</option>
                <option value="active">🟢 Status: Aktif ({userCounts.adminActive})</option>
                <option value="inactive">🔴 Status: Non-aktif ({userCounts.adminInactive})</option>
              </select>
            )}

            {(userSearch || userStatusFilter !== 'ALL' || userRoleFilter !== 'COUNSELEE' || counseleeSubFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setUserSearch('');
                  setUserStatusFilter('ALL');
                  setUserRoleFilter('COUNSELEE');
                  setCounseleeSubFilter('ALL');
                }}
                className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors"
                title="Reset semua filter"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Status Information Bar */}
        <div className="flex items-center justify-between text-xs text-mutedtext pt-1">
          <span>
            Menampilkan <strong className="text-darktext">{filteredUsers.length}</strong> dari {users.length} pengguna
          </span>
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Peran:{' '}
            {userRoleFilter === 'COUNSELEE'
              ? counseleeSubFilter === 'STUDENT'
                ? 'Konseli Mahasiswa'
                : counseleeSubFilter === 'GENERAL'
                ? 'Konseli Umum'
                : 'Semua Konseli'
              : userRoleFilter === 'TUTOR'
              ? 'Konselor'
              : 'Administrator'}
          </span>
        </div>

        {/* Users List Cards */}
        <div className="space-y-3 pt-1">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-softborder bg-gray-50/50 space-y-2">
              <Users className="w-8 h-8 text-mutedtext mx-auto" />
              <p className="text-xs font-bold text-darktext">Tidak ada pengguna yang cocok</p>
              <p className="text-[11px] text-mutedtext">
                Coba sesuaikan kata kunci pencarian atau ubah filter peran/status di atas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setUserSearch('');
                  setUserStatusFilter('ALL');
                  setUserRoleFilter('COUNSELEE');
                  setCounseleeSubFilter('ALL');
                }}
                className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isStudent = u.role === 'STUDENT';
              const isGeneral = u.role === 'GENERAL';
              const isTutor = u.role === 'TUTOR';
              const isAdmin = u.role === 'ADMIN';

              return (
                <div
                  key={u.id}
                  className="p-4 md:p-5 rounded-2xl border border-softborder hover:border-gray-300 hover:shadow-soft-sm transition-all bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                >
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-start gap-3.5 min-w-[280px]">
                    <div
                      className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border ${
                        isStudent
                          ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200'
                          : isGeneral
                          ? 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200'
                          : isTutor
                          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200'
                      }`}
                    >
                      {u.name?.charAt(0) || 'U'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-darktext text-sm hover:text-emerald-800 transition-colors">
                          {u.name}
                        </h4>
                        {/* Role Tag */}
                        {isStudent && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                            🎓 Konseli Mahasiswa
                          </span>
                        )}
                        {isGeneral && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                            🌐 Klien Umum
                          </span>
                        )}
                        {isTutor && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            🧑‍🏫 Konselor / Tutor BK
                          </span>
                        )}
                        {isAdmin && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            🛡️ Administrator Sistem
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-mutedtext text-[11px]">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <a
                            href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
                            title="Chat WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            {u.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Context Metadata */}
                  <div className="flex-1 px-0 lg:px-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {isStudent && (
                      <>
                        <div>
                          <span className="text-mutedtext block">NIM & Status:</span>
                          <span className="font-semibold text-darktext">
                            {u.student_profile?.nim || '-'} • {u.student_profile?.campus_status || 'AKTIF'}
                          </span>
                        </div>
                        <div>
                          <span className="text-mutedtext block">Program Studi:</span>
                          <span className="font-semibold text-darktext truncate block">
                            {u.student_profile?.program_study || 'Mahasiswa Aktif'}
                          </span>
                        </div>
                      </>
                    )}

                    {isGeneral && (
                      <>
                        <div>
                          <span className="text-mutedtext block">Identitas KTP (NIK):</span>
                          <span className="font-semibold text-darktext">
                            {u.general_profile?.nik || 'Terverifikasi'}
                          </span>
                        </div>
                        <div>
                          <span className="text-mutedtext block">Alamat / Domisili:</span>
                          <span className="font-semibold text-darktext truncate block">
                            {u.general_profile?.address || u.general_profile?.birth_place || 'Umum'}
                          </span>
                        </div>
                      </>
                    )}

                    {isTutor && (
                      <>
                        <div>
                          <span className="text-mutedtext block">NIP / ID Konselor:</span>
                          <span className="font-semibold text-darktext">
                            {u.tutor_profile?.nip || 'Konselor Kampus'}
                          </span>
                        </div>
                        <div>
                          <span className="text-mutedtext block">Spesialisasi:</span>
                          <span className="font-semibold text-darktext truncate block text-emerald-800" title={u.tutor_profile?.specialization}>
                            {u.tutor_profile?.specialization || 'Bimbingan Konseling'}
                          </span>
                        </div>
                      </>
                    )}

                    {isAdmin && (
                      <div className="sm:col-span-2">
                        <span className="text-mutedtext block">Hak Akses Superadmin:</span>
                        <span className="font-semibold text-darktext">
                          Kelola Pengguna, CMS Landing, Integrasi Zoom OAuth, dan Audit Logs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {u.status === 'active' ? 'Aktif' : 'Non-aktif'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedUserDetail(u)}
                      className="px-3 py-1.5 rounded-xl border border-softborder text-mutedtext hover:text-darktext hover:bg-gray-50 transition-colors font-semibold text-[11px] flex items-center gap-1.5"
                      title="Lihat profil detail pengguna"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Detail</span>
                    </button>

                    {u.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-3 py-1.5 rounded-xl border transition-colors font-semibold text-[11px] flex items-center gap-1.5 ${
                          u.status === 'active'
                            ? 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100'
                        }`}
                        title={u.status === 'active' ? 'Nonaktifkan akun pengguna ini' : 'Aktifkan kembali akun ini'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
        onToggleStatus={(userId) => {
          handleToggleUserStatus(userId);
          if (selectedUserDetail?.id === userId) {
            setSelectedUserDetail((prev) => prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null);
          }
        }}
      />

      {/* Create User Modal (Konselor / Admin) */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        initialRole={createUserRole}
        onClose={() => setIsCreateUserModalOpen(false)}
        onUserCreated={(newUser) => {
          if (reloadUsers) reloadUsers();
          if (newUser.role === 'TUTOR') {
            setUserRoleFilter('TUTOR');
          } else if (newUser.role === 'ADMIN') {
            setUserRoleFilter('ADMIN');
          }
        }}
      />
    </div>
  );
};

export default AdminUsersTab;
