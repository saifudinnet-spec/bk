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
  Stethoscope
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
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

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
      const list = res.data?.data || [];
      setMessages(list);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Adaptive visibility-aware polling: saves battery & bandwidth on background tabs
  useEffect(() => {
    fetchMessages();

    let intervalId = null;
    const startPolling = (ms) => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchMessages, ms);
    };

    // Active polling every 3.5s
    startPolling(3500);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Battery saver: slow down to 20s when user switches tab or locks screen
        startPolling(20000);
      } else {
        // Immediately fetch and resume 3.5s polling upon returning
        fetchMessages();
        startPolling(3500);
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
      if (latest && latest.sender_id !== user?.id && prevMessagesLengthRef.current > 0) {
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
      if (res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
        scrollToBottom();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal mengirim pesan.');
      setInputText(text); // Restore unsent text
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] sm:h-[82vh] sm:max-h-[82vh] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-soft-md overflow-hidden">
      {/* Chat Room Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
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
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Topik: <strong className="text-slate-700">{topicName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40">
        {/* Welcome message */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-center max-w-md mx-auto shadow-soft-xs space-y-1">
          <Sparkles className="w-4 h-4 text-emerald-600 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800">Ruang Chat Konseling Pribadi</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Percakapan ini bersifat rahasia antara Anda dan konselor. Riwayat chat akan tetap tersimpan sebagai catatan riwayat konseling.
          </p>
        </div>

        {isBefore && (
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-center max-w-sm mx-auto text-xs text-amber-900 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Sesi konseling belum dimulai. Anda tetap dapat menuliskan salam atau pesan awal di sini.</span>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const msgTime = new Date(msg.created_at);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 mb-1">
                  {msg.sender?.name?.charAt(0) || 'P'}
                </div>
              )}

              <div
                className={`max-w-[78%] sm:max-w-md rounded-2xl p-3 text-xs leading-relaxed shadow-soft-xs ${
                  isMe
                    ? 'bg-emerald-700 text-white rounded-br-xs'
                    : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-bold text-emerald-800 mb-0.5">
                    {msg.sender?.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{msg.message}</p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                    isMe ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msgTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (
                    <span>
                      {msg.is_read ? (
                        <CheckCheck className="w-3 h-3 text-emerald-200" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-300" />
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

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setTimeout(scrollToBottom, 250)}
            autoComplete="off"
            placeholder="Tulis pesan konseling Anda di sini..."
            className="flex-1 h-11 px-4 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-soft-sm transition-colors shrink-0"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
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
