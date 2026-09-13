import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  ArrowLeft,
  FileText,
  MessageSquare,
  Send,
  Navigation,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

export const OfflineSessionView = ({ session, user, isTutor, onLeaveSession }) => {
  const { showSuccess, showError } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const partner = isTutor ? session.user : session.tutor;
  const partnerRole = isTutor ? 'Mahasiswa / Klien' : 'Konselor BK';
  const topicName = session.counseling_case?.category || session.counseling_case?.topic?.title || 'Bimbingan Konseling';
  const caseNumber = session.counseling_case?.case_number || `BK-${session.id}`;

  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/sessions/${session.id}/messages`);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    if (showChat) {
      fetchMessages();
    }
  }, [showChat]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const text = chatInput.trim();
    setChatInput('');
    setIsSending(true);

    try {
      const res = await api.post(`/sessions/${session.id}/messages`, {
        message: text,
      });
      if (res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      showError('Gagal mengirim pesan administratif.');
      setChatInput(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onLeaveSession}
          className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-soft-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{caseNumber}</span>
          <h2 className="text-base sm:text-lg font-black text-slate-900">Sesi Konseling Tatap Muka</h2>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Location Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-teal-500/10 border border-blue-200 shadow-soft-md space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-soft-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
              Lokasi Pertemuan
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              Ruang Layanan Bimbingan & Konseling
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {session.location || 'Gedung Pusat Mahasiswa / Pascasarjana Lt. 1, Kampus Siber UINSSC'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-blue-100/80 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Ruangan:</span>
            <p className="font-bold text-slate-800">Ruang Konseling Privat A</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Lantai / Gedung:</span>
            <p className="font-bold text-slate-800">Lantai 1, Ruang 104</p>
          </div>
        </div>
      </div>

      {/* Schedule & Partner Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date & Time */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900">Jadwal Sesi</span>
          </div>
          <p className="text-xs text-slate-600">
            {startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 pt-1 border-t border-slate-100">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} –{' '}
              {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
        </div>

        {/* Partner Info */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{partnerRole}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Tatap Muka
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
              {partner?.name?.charAt(0) || 'P'}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{partner?.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">Topik: {topicName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Arrival Guidelines */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-700" />
          <span>Panduan Kedatangan Konseling Tatap Muka</span>
        </h4>

        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>Hadir paling lambat <strong>10 menit</strong> sebelum jadwal yang ditentukan.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>Tunjukkan kode pengajuan ini: <strong className="font-mono text-emerald-800">{caseNumber}</strong> kepada resepsionis ruang BK.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>Ruang konseling ber-AC, tertutup, kedap suara, dan menjamin penuh kerahasiaan percakapan Anda.</span>
          </div>
        </div>
      </div>

      {/* Optional Administrative Chat Accordion */}
      <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800">
              Koordinasi Administratif / Pesan Tambahan
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            {showChat ? 'Tutup Pesan' : 'Buka Pesan'}
          </button>
        </div>

        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-2"
          >
            <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-white rounded-2xl border border-slate-200">
              {messages.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-2">
                  Belum ada pesan koordinasi. Tulis pesan jika Anda memerlukan konfirmasi kedatangan.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl text-xs ${
                      m.sender_id === user?.id
                        ? 'bg-emerald-50 text-emerald-950 ml-auto max-w-[80%]'
                        : 'bg-slate-100 text-slate-800 mr-auto max-w-[80%]'
                    }`}
                  >
                    <span className="text-[9px] font-bold block text-slate-500 mb-0.5">
                      {m.sender?.name}
                    </span>
                    <p>{m.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tulis pesan (misal: 'Saya sudah di resepsionis')..."
                className="flex-1 h-9 px-3 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="px-3 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Kirim
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onLeaveSession}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
        >
          Kembali ke Dashboard
        </button>

        {isTutor && (
          <button
            onClick={() => onLeaveSession()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft-sm transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Tulis Catatan Konseling</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineSessionView;
