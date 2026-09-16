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
    { label: 'Daftar Mahasiswa', path: '/tutor/students', icon: Users },
    { label: 'Jadwal Konseling', path: '/tutor/schedule', icon: Calendar },
    { label: 'Daftar Kasus', path: '/tutor/cases', icon: FolderHeart },
    { label: 'Profil Tutor', path: '/tutor/profile', icon: User },
  ];

  const adminLinks = [
    { label: 'Dashboard Admin', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Kelola Pengguna', path: '/admin/users', icon: Users },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Pengaturan Sistem', path: '/admin/settings', icon: Settings },
  ];

  let links = studentLinks;
  if (isTutor) links = tutorLinks;
  if (isAdmin) links = adminLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-softborder p-5 z-20">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/logobk.png" alt="Logo Ruang BK" className="w-full h-full object-contain" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-[#164C53] tracking-wider uppercase leading-none">RUANG BK</h2>
          <span className="text-[11px] text-mutedtext mt-1 block">Bimbingan Konseling</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-soft-sm font-bold border border-emerald-200/60'
                    : 'text-mutedtext hover:text-darktext hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="pt-4 border-t border-softborder mt-auto">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-darktext truncate">{user?.name}</p>
            <p className="text-[10px] text-mutedtext truncate">{user?.email}</p>
          </div>
          <NotificationBell className="!w-8 !h-8 !rounded-xl shrink-0" />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors min-h-[40px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
