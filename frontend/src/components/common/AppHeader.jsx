import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, User as UserIcon, X, Check } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import Modal from './Modal';

export const AppHeader = ({ title, subtitle, showGreeting = true }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then((res) => {
          setNotifications(res.data || []);
          setUnreadCount(res.unread_count || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  const getRoleBadge = () => {
    if (user?.role === 'STUDENT') return { label: 'Mahasiswa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (user?.role === 'GENERAL') return { label: 'Umum', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    if (user?.role === 'TUTOR') return { label: 'Tutor / Konselor', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    if (user?.role === 'ADMIN') return { label: 'Administrator', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <>
      <header className="sticky top-0 z-30 glass-nav border-b border-softborder/80 px-4 sm:px-6 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow-soft-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              {showGreeting ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-bold text-darktext line-clamp-1">
                      Halo, {user?.name ? user.name.split(' ')[0] : 'Sahabat'} 👋
                    </h1>
                    {roleBadge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mutedtext">Ruang aman untuk bertumbuh</p>
                </>
              ) : (
                <>
                  <h1 className="text-base font-bold text-darktext">{title}</h1>
                  {subtitle && <p className="text-xs text-mutedtext">{subtitle}</p>}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="relative w-10 h-10 rounded-2xl bg-white border border-softborder flex items-center justify-center text-darktext hover:bg-gray-50 transition-colors shadow-soft-sm"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4 text-mutedtext" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        title="Pemberitahuan Sistem"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-mutedtext">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua telah dibaca'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-mutedtext text-center py-6">Belum ada pemberitahuan baru.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-colors ${
                  !n.read_at
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-softborder'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-darktext">{n.title}</h4>
                  <span className="text-[10px] text-mutedtext whitespace-nowrap">
                    {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-mutedtext mt-1 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};

export default AppHeader;
