import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock, ShieldCheck, User, Info, ArrowRight } from 'lucide-react';

export const WaitingRoom = ({ session, onJoin, isTutor = false }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);

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
    <div className="max-w-md mx-auto w-full px-4 py-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-softborder shadow-soft-lg text-center">
        {/* Animated Icon */}
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4 shadow-soft-sm">
          <Video className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          Ruang Tunggu Konseling Online
        </span>

        <h2 className="text-xl font-bold text-darktext mt-1 mb-2">
          {session.counseling_case?.category ? `Konseling ${session.counseling_case.category}` : 'Konseling Online'}
        </h2>

        <p className="text-xs text-mutedtext mb-6">
          Sesi konseling privat terenkripsi melalui Zoom Meeting SDK.
        </p>

        {/* Schedule & Tutor Card */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
              {partnerName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-darktext truncate">{partnerName || 'Tutor Konseling'}</p>
              <p className="text-[11px] text-mutedtext">{partnerRole}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-mutedtext">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>
                {startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>
                {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Countdown & Status */}
        <div className="mb-6 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
          <p className="text-[11px] text-teal-800 font-medium mb-1">Status Ruang Sesi:</p>
          <p className="text-base font-bold text-teal-900">{timeLeft}</p>
          {!canJoin && (
            <p className="text-[10px] text-mutedtext mt-1">
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
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          <Video className="w-5 h-5" />
          <span>{canJoin ? 'Masuk Sesi Konseling Sekarang' : 'Menunggu Jadwal Sesi'}</span>
          {canJoin && <ArrowRight className="w-4 h-4" />}
        </motion.button>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-mutedtext mt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sesi ini privat dan terjaga kerahasiaannya.</span>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
