import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Share2,
  Users,
  Shield,
  Send,
  X,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import Modal from '../common/Modal';
import CounseleeDiagnosticModal from '../counseling/CounseleeDiagnosticModal';

export const ZoomMockView = ({ sessionData, session = null, onLeaveSession, isTutor = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'System', text: 'Ruang konseling terhubung. Sesi ini privat dan terlindungi.', time: '10:00' },
    { sender: isTutor ? sessionData.student_name : sessionData.tutor_name, text: 'Halo, suara saya terdengar jelas?', time: '10:01' },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [seconds, setSeconds] = useState(0);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { sender: isTutor ? sessionData.tutor_name : sessionData.student_name, text: inputMsg.trim(), time: timeStr },
    ]);
    setInputMsg('');
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] max-h-[850px] bg-slate-950 rounded-3xl overflow-hidden flex flex-col text-white shadow-2xl border border-slate-800 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Terhubung • {formatTime(seconds)}</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
            {sessionData.session_title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isTutor && session?.user && (
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs"
              title="Lihat Data Konseli & Asesmen Lengkap"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-200" />
              <span>Data Konseli</span>
            </button>
          )}
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-xl text-[11px] font-mono">
            Mode SDK: Development
          </span>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="relative flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden bg-slate-900">
        {/* Remote Participant (Tutor or Student) */}
        <div className="relative flex items-center justify-center bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-3xl font-black shadow-xl mb-3 border-2 border-emerald-400/40"
            >
              {(isTutor ? sessionData.student_name : sessionData.tutor_name)?.charAt(0) || 'P'}
            </motion.div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              {isTutor ? sessionData.student_name : sessionData.tutor_name}
            </h3>
            <p className="text-xs text-emerald-400 mt-0.5">
              {isTutor ? 'Klien Konseling' : 'Konselor Bimbingan Konseling'}
            </p>

            {/* Audio Waveform Indicator */}
            <div className="flex items-center gap-1 mt-4">
              {[40, 75, 55, 90, 60, 45, 80, 50].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [`${h * 0.3}px`, `${h * 0.7}px`, `${h * 0.3}px`] }}
                  transition={{ repeat: Infinity, duration: 0.8 + (i % 3) * 0.2, ease: 'easeInOut' }}
                  className="w-1 bg-emerald-500 rounded-full"
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-200 border border-slate-800 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isTutor ? sessionData.student_name : sessionData.tutor_name}</span>
          </div>
        </div>

        {/* Local Self Video */}
        <div className="relative flex items-center justify-center bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
          {isVideoOff ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl font-bold mb-2">
                {sessionData.user_name?.charAt(0) || 'Y'}
              </div>
              <p className="text-xs text-slate-400">Kamera dinonaktifkan</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl mb-3">
                  {sessionData.user_name?.charAt(0) || 'A'}
                </div>
                <h4 className="text-sm font-bold text-slate-200">{sessionData.user_name} (Anda)</h4>
                <span className="text-[11px] text-slate-400 mt-0.5">Video Kamera Aktif</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-200 border border-slate-800 flex items-center gap-2">
            <span>{sessionData.user_name} (Anda)</span>
            {isMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
          </div>
        </div>

        {/* Chat Drawer Side Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-20 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Obrolan Sesi</span>
                </h4>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-emerald-400">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed border border-slate-700/60">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik pesan..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Meeting Controls */}
      <div className="px-4 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 z-10">
        {/* Mic toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isMuted ? 'Nyalakan Mikrofon' : 'Matikan Mikrofon'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video camera toggle */}
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isVideoOff ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isVideoOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen share toggle */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`hidden sm:flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isScreenSharing ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Bagi Layar"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Chat Drawer toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
          title="Buka Obrolan"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* End Call Button */}
        <button
          onClick={() => setShowEndModal(true)}
          className="flex items-center justify-center gap-2 px-5 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-colors"
          title="Akhiri Sesi"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">Akhiri Sesi</span>
        </button>
      </div>

      {/* End Call Confirmation Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Akhiri Sesi Konseling?"
      >
        <p className="text-xs text-mutedtext mb-5 leading-relaxed">
          {isTutor
            ? 'Anda akan diarahkan ke formulir ringkasan sesi konseling dan catatan tindak lanjut untuk mahasiswa.'
            : 'Apakah Anda yakin ingin menyelesaikan sesi video konseling ini?'}
        </p>

        <div className="flex gap-2.5 justify-end">
          <button
            onClick={() => setShowEndModal(false)}
            className="px-4 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext hover:bg-gray-50 transition-colors"
          >
            Kembali ke Sesi
          </button>
          <button
            onClick={() => {
              setShowEndModal(false);
              onLeaveSession();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft-sm transition-colors"
          >
            Ya, Selesaikan Sesi
          </button>
        </div>
      </Modal>

      {/* Counselee Diagnostic Modal */}
      {showDiagnosticModal && session?.user && (
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

export default ZoomMockView;
