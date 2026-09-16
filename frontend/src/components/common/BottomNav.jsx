import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquareHeart,
  ClipboardList,
  History,
  User,
  Users,
  Calendar,
  FolderHeart,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const BottomNav = () => {
  const { user, isTutor, isAdmin } = useAuth();
  const location = useLocation();

  if (isAdmin || location.pathname.includes('/counseling/session')) {
    // Admin or live session room has minimal nav
    return null;
  }

  // Student & General User Nav Items
  const studentNavItems = [
    { label: 'Home', path: '/app', icon: Home },
    { label: 'Konseling', path: '/app/counseling', icon: MessageSquareHeart },
    { label: 'Screening', path: '/app/screening', icon: ClipboardList },
    { label: 'Riwayat', path: '/app/history', icon: History },
    { label: 'Profil', path: '/app/profile', icon: User },
  ];

  // Tutor Nav Items
  const tutorNavItems = [
    { label: 'Home', path: '/tutor/dashboard', icon: LayoutDashboard },
    { label: 'Jadwal', path: '/tutor/schedule', icon: Calendar },
    { label: 'Kasus', path: '/tutor/cases', icon: FolderHeart },
    { label: 'Profil', path: '/tutor/profile', icon: User },
  ];

  const items = isTutor ? tutorNavItems : studentNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-softborder/80 px-2 sm:px-6 safe-bottom md:hidden shadow-soft-lg">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/app' || item.path === '/tutor/dashboard'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-mutedtext hover:text-darktext font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-100/70 text-emerald-700' : 'text-mutedtext'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
