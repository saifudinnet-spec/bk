import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Calendar,
  CheckCircle2,
  FolderHeart,
  Inbox,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';

export const NotificationBell = ({ variant = 'light', className = '' }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (showDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDrawer]);

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

  const handleMarkOneRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSec = Math.floor((now - date) / 1000);

    if (diffInSec < 60) return 'Baru saja';
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 60) return `${diffInMin} menit lalu`;
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIconInfo = (title = '', message = '') => {
    const combined = (title + ' ' + message).toLowerCase();
    if (combined.includes('jadwal') || combined.includes('sesi') || combined.includes('zoom') || combined.includes('temu')) {
      return { icon: Calendar, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    }
    if (combined.includes('diterima') || combined.includes('selesai') || combined.includes('konfirmasi')) {
      return { icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (combined.includes('kasus') || combined.includes('pengajuan') || combined.includes('bimbingan')) {
      return { icon: FolderHeart, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    }
    return { icon: Bell, color: 'text-slate-600 bg-slate-100 border-slate-200' };
  };

  const displayedNotifications = activeTab === 'unread'
    ? notifications.filter((n) => !n.read_at)
    : notifications;

  const isDark = variant === 'dark';

  return (
    <>
      {/* 3D Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setShowDrawer(true);
          fetchNotifications();
        }}
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-soft-xs ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 shadow-sm hover:border-emerald-300'
        } ${className}`}
        title="Pemberitahuan Sistem"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Full-Screen Portal Slide-Over Drawer (Never trapped inside sidebar!) */}
      {showDrawer &&
        typeof document !== 'undefined' &&
        document.body &&
        createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[9999] overflow-hidden">
                {/* Full-Screen Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowDrawer(false)}
                  className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
                />

                {/* Slide-over Drawer Panel */}
                <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200/80"
                  >
                    {/* 1. Header */}
                    <div className="p-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-900 tracking-tight">
                            Pemberitahuan Sistem
                          </h2>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {unreadCount > 0 ? `${unreadCount} pesan belum dibaca` : 'Semua pesan telah dibaca'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDrawer(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Tutup"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* 2. Controls & Tabs */}
                    <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setActiveTab('all')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'all'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Semua ({notifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('unread')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'unread'
                              ? 'bg-white text-emerald-800 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Belum Dibaca ({unreadCount})
                        </button>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Tandai Semua</span>
                        </button>
                      )}
                    </div>

                    {/* 3. Notification List */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 divide-y divide-transparent">
                      {displayedNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                          <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner border border-emerald-200/60">
                            <Inbox className="w-7 h-7" />
                          </div>
                          <h4 className="text-sm font-black text-slate-800">
                            {activeTab === 'unread' ? 'Tidak Ada Notifikasi Baru' : 'Belum Ada Pemberitahuan'}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                            {activeTab === 'unread'
                              ? 'Bagus! Semua pemberitahuan bimbingan dan akun telah Anda baca.'
                              : 'Semua informasi status pengajuan dan jadwal bimbingan konseling akan muncul di sini.'}
                          </p>
                        </div>
                      ) : (
                        displayedNotifications.map((n) => {
                          const isUnread = !n.read_at;
                          const iconInfo = getNotificationIconInfo(n.title, n.message);
                          const IconComponent = iconInfo.icon;

                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (isUnread) handleMarkOneRead(n.id);
                              }}
                              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                isUnread
                                  ? 'bg-gradient-to-r from-emerald-50/70 via-white to-white border-l-4 border-l-emerald-500 border-t-emerald-200/80 border-r-emerald-200/80 border-b-emerald-200/80 shadow-soft-xs hover:shadow-soft-sm'
                                  : 'bg-white hover:bg-slate-50/90 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon Badge */}
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconInfo.color} shadow-xs`}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-black text-slate-900 leading-snug group-hover:text-emerald-900 transition-colors">
                                      {n.title}
                                    </h4>
                                    <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                                      {formatTimeAgo(n.created_at)}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                                    {n.message}
                                  </p>

                                  <div className="mt-2.5 flex items-center justify-between">
                                    {isUnread ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Baru
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium text-slate-400">
                                        Telah dibaca
                                      </span>
                                    )}

                                    {isUnread && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleMarkOneRead(n.id, e)}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Tandai dibaca</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* 4. Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                      <span>Layanan Ruang BK</span>
                      <button
                        type="button"
                        onClick={() => setShowDrawer(false)}
                        className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                      >
                        Tutup Panel
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default NotificationBell;
