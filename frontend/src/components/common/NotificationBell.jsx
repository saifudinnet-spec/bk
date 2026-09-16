import React, { useState, useEffect } from 'react';
import { Bell, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import Modal from './Modal';

export const NotificationBell = ({ variant = 'light', className = '' }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const isDark = variant === 'dark';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setShowModal(true);
          fetchNotifications();
        }}
        className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-soft-xs ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-sm'
        } ${className}`}
        title="Pemberitahuan Sistem"
      >
        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-slate-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Pemberitahuan Sistem"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-mutedtext">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua telah dibaca'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
              <p>Belum ada pemberitahuan baru.</p>
            </div>
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
                    {new Date(n.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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

export default NotificationBell;
