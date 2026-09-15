import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Info,
  ArrowRight,
  Stethoscope,
  Sparkles,
  Volume2,
  Headphones,
  CheckCircle2
} from 'lucide-react';
import CounseleeDiagnosticModal from '../counseling/CounseleeDiagnosticModal';

export const WaitingRoom = ({ session, onJoin, isTutor = false }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [checklist, setChecklist] = useState({
    headset: false,
    quietRoom: false,
    stableNetwork: true,
  });

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const playTestAudio = () => {
    try {
      setIsPlayingTestSound(true);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setIsPlayingTestSound(false);
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => setIsPlayingTestSound(false), 500);
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(session.start_at).getTime();
      const end = new Date(session.end_at).getTime();
      const fifteenMinsBefore = start - 15 * 60 * 1000;

      if (now >= fifteenMinsBefore && now <= end) {
        setCanJoin(true);
        setTimeLeft('Sesi siap dimulai!');
      } else if (now > end) {
        setCanJoin(false);
        setTimeLeft('Sesi telah berakhir.');
      } else {
        setCanJoin(false);
        const diff = fifteenMinsBefore - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? `${hours} jam ` : ''}${minutes} menit ${seconds} detik`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);
  const partnerName = isTutor ? session.user?.name : session.tutor?.name;
  const partnerRole = isTutor ? 'Klien / Mahasiswa' : 'Konselor Bimbingan Konseling';

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-soft-lg text-center">
        {/* Animated Icon */}
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4 shadow-soft-sm">
          <Video className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          Ruang Tunggu Konseling Online
        </span>

        <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">
          {session.counseling_case?.category ? `Konseling ${session.counseling_case.category}` : 'Konseling Online'}
        </h2>

        <p className="text-xs text-slate-500 mb-6">
          Sesi konseling privat terenkripsi melalui Zoom Meeting SDK.
        </p>

        {/* Counselor Readiness Status Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-left mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-soft-xs">
                  {partnerName?.charAt(0) || 'K'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{partnerName || 'Konselor BK'}</p>
                <p className="text-[11px] text-emerald-800 font-medium truncate">{partnerRole}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-emerald-800 border border-emerald-200 shadow-soft-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{canJoin ? 'Siap di Ruang Sesi' : 'Konselor Terjadwal'}</span>
            </span>
          </div>
        </div>

        {/* Schedule & Timing Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Counselor Quick View Button */}
        {isTutor && (
          <button
            type="button"
            onClick={() => setShowDiagnosticModal(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors flex items-center justify-center gap-1.5 mb-5 shadow-soft-xs"
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
            <span>Lihat Data & Asesmen Konseli</span>
          </button>
        )}

        {/* Pre-Session Preparation Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-left mb-6 space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tips Persiapan Konseling</span>
            </span>
            <button
              type="button"
              onClick={playTestAudio}
              disabled={isPlayingTestSound}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 rounded-xl border border-teal-200 transition-colors"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingTestSound ? 'animate-bounce text-emerald-600' : ''}`} />
              <span>{isPlayingTestSound ? 'Memutar...' : 'Tes Audio'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
            Centang hal-hal berikut agar sesi konseling Anda berjalan optimal:
          </p>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={checklist.headset}
              onChange={() => toggleChecklist('headset')}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
            />
            <span className="leading-snug">
              <strong>Gunakan earphone/headset</strong> agar percakapan lebih jernih dan menjaga privasi Anda.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={checklist.quietRoom}
              onChange={() => toggleChecklist('quietRoom')}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
            />
            <span className="leading-snug">
              <strong>Pilih tempat yang privat & tenang</strong> tanpa gangguan agar nyaman bercerita.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={checklist.stableNetwork}
              onChange={() => toggleChecklist('stableNetwork')}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
            />
            <span className="leading-snug">
              <strong>Koneksi internet memadai</strong> untuk kelancaran video & audio tatap layar.
            </span>
          </label>
        </div>

        {/* Countdown & Status */}
        <div className="mb-6 p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
          <p className="text-[11px] text-teal-800 font-medium mb-1">Status Ruang Sesi:</p>
          <p className="text-base font-bold text-teal-950">{timeLeft}</p>
          {!canJoin && (
            <p className="text-[10px] text-slate-500 mt-1">
              Tombol masuk sesi akan aktif otomatis 15 menit sebelum waktu konseling.
            </p>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={!canJoin}
          onClick={onJoin}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-soft-md transition-all min-h-[48px] ${
            canJoin
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 animate-pulse'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          <Video className="w-5 h-5" />
          <span>{canJoin ? 'Masuk Sesi Konseling Sekarang' : 'Menunggu Jadwal Sesi'}</span>
          {canJoin && <ArrowRight className="w-4 h-4" />}
        </motion.button>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sesi ini privat dan terjaga kerahasiaannya.</span>
        </div>
      </div>

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

export default WaitingRoom;
