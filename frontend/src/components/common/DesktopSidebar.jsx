import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  MessageSquareHeart,
  ClipboardList,
  History,
  User,
  Users,
  Calendar,
  FolderHeart,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import NotificationBell from './NotificationBell';

export const DesktopSidebar = () => {
  const { user, isStudent, isGeneral, isTutor, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const studentLinks = [
    { label: 'Beranda', path: '/app', icon: Home },
    { label: 'Konseling Online', path: '/app/counseling', icon: MessageSquareHeart },
    { label: 'Screening Kebutuhan', path: '/app/screening', icon: ClipboardList },
    { label: 'Riwayat Sesi', path: '/app/history', icon: History },
    { label: 'Profil Saya', path: '/app/profile', icon: User },
  ];

  const tutorLinks = [
    { label: 'Dashboard Tutor', path: '/tutor/dashboard', icon: LayoutDashboard },
    { label: 'Jadwal Konseling', path: '/tutor/schedule', icon: Calendar },
    { label: 'Daftar Kasus', path: '/tutor/cases', icon: FolderHeart },
    { label: 'Profil Tutor', path: '/tutor/profile', icon: User },
    { label: 'Pratinjau Klien', path: '/app', icon: Sparkles },
  ];

  const adminLinks = [
    { label: 'Dashboard Admin', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Kelola Pengguna', path: '/admin/users', icon: Users },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Pengaturan Sistem', path: '/admin/settings', icon: Settings },
    { label: 'Pratinjau Klien', path: '/app', icon: Sparkles },
  ];

  let links = studentLinks;
  if (isTutor) links = tutorLinks;
  if (isAdmin) links = adminLinks;

  return (
    <aside className="hidden md:flex flex-col w-68 h-screen sticky top-0 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 border-r border-slate-200/80 shadow-[4px_0_24px_-6px_rgba(15,23,42,0.06)] p-5 z-20 backdrop-blur-md">
      {/* 3D Brand Logo Header */}
      <div className="flex items-center gap-3.5 px-1 py-2 mb-6 group cursor-pointer" onClick={() => navigate('/app')}>
        <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 shadow-[0_8px_18px_-4px_rgba(16,185,129,0.35),0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform duration-300 group-hover:scale-105">
          <div className="w-10 h-10 rounded-[14px] bg-white p-1 flex items-center justify-center overflow-hidden shadow-inner">
            <img src="/logobk.png" alt="Logo Ruang BK" className="w-full h-full object-contain" />
          </div>
        </div>
        <div>
          <h2 className="text-base font-black text-[#134E4A] tracking-wider uppercase leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            RUANG BK
          </h2>
          <span className="text-[10px] font-bold text-emerald-800/80 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200/60 mt-1 inline-block shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            Bimbingan Konseling
          </span>
        </div>
      </div>

      {/* Navigation Header Label */}
      <div className="px-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Menu Navigasi
        </span>
      </div>

      {/* 3D Nav Links */}
      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 min-h-[48px] border cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-950 font-extrabold shadow-[0_10px_22px_-6px_rgba(16,185,129,0.22),0_3px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] border-emerald-300/80 -translate-y-0.5'
                    : 'text-slate-600 font-semibold border-transparent hover:border-slate-200/70 hover:bg-white/90 hover:text-slate-900 hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* 3D Embossed Icon Container */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.38),inset_0_1px_1px_rgba(255,255,255,0.45)] border border-emerald-400/50 scale-105'
                        : 'bg-slate-100/90 text-slate-500 border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 group-hover:shadow-[0_3px_8px_rgba(16,185,129,0.15)] group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="truncate">{link.label}</span>

                  {/* 3D Active Indicator Pill */}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 3D Floating User Profile & Logout Card */}
      <div className="pt-4 mt-auto">
        <div className="p-3 rounded-2xl bg-gradient-to-b from-white to-slate-50/90 border border-slate-200/90 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] mb-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar with 3D Ring */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-950/20">
              {isTutor ? (
                <img
                  src={
                    user?.avatar ||
                    user?.profile?.photo ||
                    (user?.name?.toLowerCase().includes('nurlina') || user?.name?.toLowerCase().includes('dian')
                      ? '/images/counselor_dian.jpg'
                      : user?.name?.toLowerCase().includes('bambang')
                        ? '/images/counselor_bambang.jpg'
                        : '/images/counselor_ahmad.jpg')
                  }
                  alt={user?.name || 'Konselor'}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/counselor_ahmad.jpg';
                  }}
                />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'Pengguna'}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</p>
            </div>

            <NotificationBell className="!w-8 !h-8 !rounded-xl shrink-0 shadow-sm" />
          </div>
        </div>

        {/* 3D Tactile Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/70 shadow-[0_2px_6px_rgba(244,63,94,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.15)] active:translate-y-0.5 active:shadow-sm transition-all duration-150 min-h-[40px] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
