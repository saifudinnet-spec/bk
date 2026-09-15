import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  LayoutTemplate,
  Globe,
  SlidersHorizontal,
  Video,
  Mic,
  ShieldAlert,
  Users,
  ShieldCheck,
  Settings,
  ExternalLink,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const AdminSidebar = ({ zoomConfigured = false, totalUsers = null }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Determine active tab from URL search param or route path
  const currentTab = (() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) return tabParam;
    if (location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/admin/audit-logs')) return 'audit';
    if (location.pathname.includes('/admin/settings')) return 'general_settings';
    return 'overview';
  })();

  const handleNavClick = (tabId) => {
    setIsMobileOpen(false);
    // If not on /admin/dashboard, navigate there with tab query
    if (location.pathname !== '/admin/dashboard') {
      navigate(`/admin/dashboard?tab=${tabId}`);
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const navGroups = [
    {
      title: 'UTAMA',
      items: [
        {
          id: 'overview',
          label: 'Ringkasan & Statistik',
          icon: LayoutDashboard,
          iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/70',
          badge: null,
          description: 'Aktivitas sistem & antrean',
        },
      ],
    },
    {
      title: 'KONTEN WEB (CMS)',
      items: [
        {
          id: 'articles',
          label: 'Kelola Artikel Edukasi',
          icon: BookOpen,
          iconColor: 'text-rose-600 bg-rose-50 border-rose-200/70',
          badge: null,
          description: 'Edukasi & tips mental',
        },
        {
          id: 'cms',
          label: 'Editor Landing Page',
          icon: LayoutTemplate,
          iconColor: 'text-purple-600 bg-purple-50 border-purple-200/70',
          badge: null,
          description: 'Banner, topik, layanan web',
        },
        {
          id: 'web_settings',
          label: 'Identitas & SEO Web',
          icon: Globe,
          iconColor: 'text-sky-600 bg-sky-50 border-sky-200/70',
          badge: 'Web',
          description: 'Judul, SEO, kontak & banner',
        },
      ],
    },
    {
      title: 'APLIKASI BK ONLINE',
      items: [
        {
          id: 'counseling_settings',
          label: 'Operasional Konseling',
          icon: SlidersHorizontal,
          iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/70',
          badge: null,
          description: 'Durasi, kuota & persetujuan',
        },
        {
          id: 'zoom_settings',
          label: 'Integrasi Zoom Meeting',
          icon: Video,
          iconColor: 'text-blue-600 bg-blue-50 border-blue-200/70',
          badge: zoomConfigured ? '🟢 Siap' : '⚙️ OAuth',
          description: 'Server-to-Server OAuth API',
        },
        {
          id: 'voice',
          label: 'Suara Asisten Nara 🎙️',
          icon: Mic,
          iconColor: 'text-amber-600 bg-amber-50 border-amber-200/70',
          badge: null,
          description: 'Rekaman audio & narasi',
        },
        {
          id: 'crisis_settings',
          label: 'Deteksi Krisis & Skrining',
          icon: ShieldAlert,
          iconColor: 'text-red-600 bg-red-50 border-red-200/70',
          badge: null,
          description: 'Protokol darurat mahasiswa',
        },
      ],
    },
    {
      title: 'PENGGUNA & AKSES',
      items: [
        {
          id: 'users',
          label: 'Kelola Pengguna',
          icon: Users,
          iconColor: 'text-teal-600 bg-teal-50 border-teal-200/70',
          badge: totalUsers !== null ? `${totalUsers}` : null,
          description: 'Mahasiswa, tutor & admin',
        },
      ],
    },
    {
      title: 'SISTEM & AUDIT',
      items: [
        {
          id: 'audit',
          label: 'Audit Logs & Aktivitas',
          icon: ShieldCheck,
          iconColor: 'text-slate-600 bg-slate-100 border-slate-200/70',
          badge: null,
          description: 'Jejak log keamanan',
        },
        {
          id: 'general_settings',
          label: 'Pengaturan Umum Sistem',
          icon: Settings,
          iconColor: 'text-zinc-600 bg-zinc-100 border-zinc-200/70',
          badge: null,
          description: 'Status & cache aplikasi',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-4 border-b border-softborder">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logobk.png" alt="Logo Ruang BK" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#164C53] tracking-wider uppercase flex items-center gap-1.5">
                RUANG BK
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 normal-case tracking-normal">
                  CMS
                </span>
              </h2>
              <p className="text-[11px] text-mutedtext truncate">Admin & Management Portal</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-mutedtext hover:text-darktext hover:bg-gray-100"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick External Link to Landing Page */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 transition-all group"
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            <span>Lihat Website Utama</span>
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
        </a>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white font-bold shadow-md shadow-emerald-900/15'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30 shadow-inner'
                            : `${item.iconColor} group-hover:scale-105 shadow-sm`
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs truncate block">{item.label}</span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 transition-all ${
                          isActive
                            ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Admin User Footer Card */}
      <div className="p-3 border-t border-softborder bg-slate-50/60 mt-auto">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs shrink-0 border border-purple-200">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-darktext truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-mutedtext truncate">{user?.email || 'admin@bk.ac.id'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button (Floating Header Bar on small screens) */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2.5 rounded-2xl bg-white border border-softborder text-slate-700 shadow-soft-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          aria-label="Buka Menu Admin"
        >
          <Menu className="w-5 h-5 text-emerald-700" />
          <span className="text-xs font-bold text-slate-800">Menu Admin</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-white border-r border-softborder shrink-0 z-20">
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
