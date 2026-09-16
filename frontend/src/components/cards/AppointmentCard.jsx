import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Building2,
  ChevronRight,
  User,
  Star,
  MapPin,
  FileText
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import SessionFeedbackModal from '../counseling/SessionFeedbackModal';

export const AppointmentCard = ({ session, isTutor = false }) => {
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(session.feedback || null);

  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);
  const now = new Date();

  // Active 15 minutes before until end
  const canJoin = now >= new Date(startDate.getTime() - 15 * 60 * 1000) && now <= endDate;
  const isPast = now > endDate || session.status === 'COMPLETED';

  const partnerName = isTutor ? session.user?.name : session.tutor?.name;
  const partnerRole = isTutor ? 'Mahasiswa / Klien' : 'Konselor BK';
  const method = (session.method || 'ZOOM').toUpperCase();
  const caseId = session.counseling_case_id || session.counseling_case?.id;

  const methodConfig = {
    CHAT: {
      icon: MessageSquare,
      title: 'Chat Konseling',
      actionText: 'Buka Chat Konseling',
      color: 'bg-emerald-50 text-emerald-700',
    },
    ZOOM: {
      icon: Video,
      title: 'Video Konseling (Zoom)',
      actionText: 'Masuk Sesi Zoom',
      color: 'bg-teal-50 text-teal-700',
    },
    OFFLINE: {
      icon: Building2,
      title: 'Tatap Muka Langsung',
      actionText: 'Lihat Lokasi Pertemuan',
      color: 'bg-blue-50 text-blue-700',
    },
  };

  const currentMethodConfig = methodConfig[method] || methodConfig.ZOOM;
  const MethodIcon = currentMethodConfig.icon;

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 border-b-[4px] border-b-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.14),0_2px_6px_rgba(0,0,0,0.06)] hover:border-emerald-300 hover:border-b-emerald-500 transition-all flex flex-col justify-between group"
    >
      <div>
        {/* Method Header & Status */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200/60 shadow-xs ${currentMethodConfig.color}`}>
              <MethodIcon className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                {session.counseling_case?.category
                  ? `${session.counseling_case.category}`
                  : 'Sesi Bimbingan Konseling'}
              </h4>
              <p className="text-[11px] font-semibold text-emerald-800">
                {currentMethodConfig.title}
              </p>
            </div>
          </div>
          <StatusBadge status={session.status} />
        </div>

        {/* Partner Info */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 mb-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-white">
            {partnerName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate">{partnerName || 'Nama Pengguna'}</p>
            <p className="text-[10px] text-slate-500 font-medium">{partnerRole}</p>
          </div>
          {currentFeedback && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-900 font-bold text-[11px] shadow-2xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{currentFeedback.rating}.0</span>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-between text-xs text-slate-600 mb-3 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {startDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-teal-700" />
            <span>
              {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} –{' '}
              {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
        </div>

        {/* Offline Location Note */}
        {method === 'OFFLINE' && (
          <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 mb-3 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
            <span>{session.location || 'Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2'}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2.5">
          {caseId && (
            <button
              type="button"
              onClick={() => navigate(`/app/cases/${caseId}`)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 border-b-[3px] border-b-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[42px] active:translate-y-0.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Lihat Detail</span>
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/counseling/session/${session.id}`)}
            className={`py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[42px] border-b-[3px] active:translate-y-0.5 ${
              caseId ? '' : 'col-span-2'
            } ${
              canJoin
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-b-emerald-800 shadow-md shadow-emerald-600/25 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 border-b-emerald-950 shadow-md shadow-emerald-800/20'
            }`}
          >
            <MethodIcon className="w-3.5 h-3.5" />
            <span>{canJoin ? currentMethodConfig.actionText : (method === 'OFFLINE' ? 'Info Lokasi' : 'Ruang Sesi')}</span>
          </motion.button>
        </div>

        {isPast && !isTutor && !currentFeedback && (
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Beri Rating & Evaluasi Sesi</span>
          </button>
        )}
      </div>

      {/* Feedback Modal for Student */}
      {isFeedbackOpen && (
        <SessionFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          session={session}
          onSubmitted={(fb) => setCurrentFeedback(fb)}
        />
      )}
    </motion.div>
  );
};

export default AppointmentCard;
