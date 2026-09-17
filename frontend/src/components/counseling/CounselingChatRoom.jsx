import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  User,
  Shield,
  ArrowLeft,
  FileText,
  AlertCircle,
  Sparkles,
  Stethoscope,
  Copy,
  Share2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import CounseleeDiagnosticModal from './CounseleeDiagnosticModal';

export const CounselingChatRoom = ({ session, user, isTutor, onLeaveSession }) => {
  const { showSuccess, showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showSuccess('Link ruang chat berhasil disalin! Buka link ini di laptop lain untuk terhubung ke sesi yang sama.');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showError('Gagal menyalin link secara otomatis.');
    }
  };

  const partner = isTutor ? session.user : session.tutor;
  const partnerRole = isTutor ? 'Mahasiswa / Klien' : 'Konselor BK';
  const topicName = session.counseling_case?.category || session.counseling_case?.topic?.title || 'Bimbingan Konseling';

  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);
  const now = new Date();

  // Status calculation
  const isBefore = now < new Date(startDate.getTime() - 10 * 60 * 1000);
  const isAfter = now > endDate || session.status === 'COMPLETED';
  const isInProgress = !isBefore && !isAfter;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 40, 30]);
      }
    } catch {
      // Audio context autoplay limitations
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/sessions/${session.id}/messages`);
      const list = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data)
          ? res.data.data
          : (Array.isArray(res) ? res : []));
      setMessages(list);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Adaptive visibility-aware polling: 1.8s for snappy real-time communication across devices
  useEffect(() => {
    fetchMessages();

    let intervalId = null;
    const startPolling = (ms) => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchMessages, ms);
    };

    // Active polling every 1.8s for fast instant delivery
    startPolling(1800);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Battery saver: slow down to 10s when user switches tab or locks screen
        startPolling(10000);
      } else {
        // Immediately fetch and resume 1.8s polling upon returning
        fetchMessages();
        startPolling(1800);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session.id]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const latest = messages[messages.length - 1];
      if (latest && Number(latest.sender_id) !== Number(user?.id) && prevMessagesLengthRef.current > 0) {
        playNotificationSound();
      }
      prevMessagesLengthRef.current = messages.length;
    }
    scrollToBottom();
  }, [messages, user?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await api.post(`/sessions/${session.id}/messages`, {
        message: text,
      });
      const newMsg = res.data?.data || res.data || res;
      if (newMsg && newMsg.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal mengirim pesan.');
      setInputText(text); // Restore unsent text
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-soft-md overflow-hidden min-h-0">
      {/* Chat Room Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveSession}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
            {partner?.name?.charAt(0) || 'P'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {partner?.name || 'Rekan Konseling'}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {partnerRole}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700" title="Nomor ID Ruang Sesi">
                #{session.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Topik: <strong className="text-slate-700">{topicName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Salin Link Sesi untuk Pengujian Lintas-Laptop */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Salin tautan ruang chat untuk dibuka langsung di laptop / perangkat lain"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Salin Link Sesi #{session.id}</span>
                <span className="md:hidden">Salin Link</span>
              </>
            )}
          </button>
          {/* Status Badge */}
          {isInProgress && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sesi Berlangsung</span>
            </span>
          )}
          {isBefore && (
            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Sesi Belum Dimulai
            </span>
          )}
          {isAfter && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              Sesi Selesai
            </span>
          )}

          {isTutor && (
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors flex items-center gap-1.5"
              title="Lihat Data Konseli & Asesmen"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Data Konseli</span>
            </button>
          )}

          <button
            onClick={onLeaveSession}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            {isTutor ? 'Catatan & Keluar' : 'Keluar'}
          </button>
        </div>
      </div>

      {/* Schedule Info Notice Banner */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          <span>
            Jadwal: {startDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })},{' '}
            {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} –{' '}
            {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>Ruang Chat Privat & Terenkripsi</span>
        </div>
      </div>

      {/* Messages Scroll Area with WhatsApp Doodle Wallpaper Background */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-2.5 relative selection:bg-[#d9fdd3]"
        style={{
          backgroundColor: '#efeae2',
          backgroundImage: `url('/images/wa-chat-bg.svg')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '380px',
        }}
      >
        {/* WhatsApp End-to-End Privacy / Security Pill */}
        <div className="flex justify-center my-1.5">
          <div className="bg-[#ffeecd]/95 text-[#54656f] text-[11px] px-3.5 py-1.5 rounded-lg shadow-xs border border-amber-200/60 flex items-center gap-2 max-w-md text-center leading-snug">
            <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Pesan dalam sesi ini bersifat rahasia dan terenkripsi antara Anda dan konselor.</span>
          </div>
        </div>

        {isBefore && (
          <div className="flex justify-center my-1.5">
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-3.5 py-1.5 text-center max-w-sm text-xs text-amber-900 flex items-center justify-center gap-1.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Sesi konseling belum dimulai. Anda tetap dapat menuliskan salam atau pesan awal di sini.</span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = Number(msg.sender_id) === Number(user?.id);
          const msgTime = new Date(msg.created_at);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0 mb-0.5 shadow-xs border border-emerald-200/60">
                  {msg.sender?.name?.charAt(0) || 'P'}
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-md p-2.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  isMe
                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tr-none border border-[#bbf7d0]/60'
                    : 'bg-white text-[#111b21] rounded-2xl rounded-tl-none border border-slate-200/60'
                }`}
              >
                {!isMe && (
                  <p className="text-[11px] font-bold text-[#008069] mb-0.5 tracking-tight">
                    {msg.sender?.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-[#111b21]">{msg.message}</p>
                <div
                  className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781] select-none"
                >
                  <span>{msgTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (
                    <span>
                      {msg.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Styled Input Form */}
      <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 bg-[#f0f2f5] border-t border-slate-200/90 flex items-center gap-2 shrink-0">
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setTimeout(scrollToBottom, 250)}
            autoComplete="off"
            placeholder="Ketik pesan..."
            className="w-full h-11 px-4 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#00a884]/30 focus:border-[#00a884] transition-all text-[#111b21] placeholder:text-slate-400 shadow-xs"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="h-11 w-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white font-bold flex items-center justify-center shadow-soft-sm transition-all shrink-0 cursor-pointer"
          title="Kirim Pesan"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </motion.button>
      </form>

      {/* Counselee Diagnostic Modal */}
      {showDiagnosticModal && (
        <CounseleeDiagnosticModal
          isOpen={showDiagnosticModal}
          counseleeUser={session.user}
          caseItem={session.counseling_case}
          assessmentAnswers={session.counseling_case?.assessment_answers}
          onClose={() => setShowDiagnosticModal(false)}
        />
      )}
    </div>
  );
};

export default CounselingChatRoom;
