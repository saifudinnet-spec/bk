import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  MessageSquareHeart,
  Calendar,
  Clock,
  Video,
  ArrowRight,
  Sparkles,
  ChevronRight,
  FolderHeart,
  FileCheck2,
  CheckCircle2,
  Star,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import api from '../../services/api';
import MoodPicker from '../../components/common/MoodPicker';
import StatusBadge from '../../components/common/StatusBadge';
import AppointmentCard from '../../components/cards/AppointmentCard';
import CaseCard from '../../components/cards/CaseCard';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import PageTransition from '../../components/common/PageTransition';
import ActionPlanSection from '../../components/counseling/ActionPlanSection';
import SessionFeedbackModal from '../../components/counseling/SessionFeedbackModal';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { startWithCounselor, setSelectedTopic } = useCounselingFlow();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [completedUnreviewedSession, setCompletedUnreviewedSession] = useState(null);
  const [feedbackModalSession, setFeedbackModalSession] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [latestScreening, setLatestScreening] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [actionPlans, setActionPlans] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/student/dashboard');
      setUpcomingSession(res.upcoming_session || null);
      setCompletedUnreviewedSession(res.unreviewed_session || null);
      setActiveCase(res.active_case || null);
      setLatestScreening(res.latest_screening || null);
      if (res.today_mood) {
        setTodayMood(res.today_mood);
      }
      setActionPlans(res.action_plans || []);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRespondMethodSuggestion = async (action) => {
    if (!activeCase?.id) return;
    try {
      await api.post(`/cases/${activeCase.id}/respond-method-suggestion`, { action });
      showSuccess(action === 'accept' ? 'Metode konseling berhasil diperbarui.' : 'Saran perubahan metode ditolak.');
      fetchDashboardData();
    } catch (err) {
      showError(err.message || 'Gagal merespons saran metode.');
    }
  };

  const hasFollowUpRequired = Boolean(
    activeCase?.sessions?.some((s) => s.note?.follow_up_required)
  );

  const handleQuickBookFollowUp = () => {
    if (activeCase?.tutor) {
      startWithCounselor(activeCase.tutor);
    }
    if (activeCase?.topic) {
      setSelectedTopic(activeCase.topic);
    } else if (activeCase?.category) {
      setSelectedTopic({ id: null, title: activeCase.category, tag: 'Lanjutan' });
    }
    navigate('/app/counseling/wizard');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasScreening = Boolean(latestScreening);

  return (
    <PageTransition className="space-y-6">
      {/* 1. Daily Mood Check-in */}
      <section>
        <MoodPicker initialMood={todayMood} onSaved={(m) => setTodayMood(m)} />
      </section>

      {/* 2. Primary Action Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-800 text-white p-6 sm:p-7 shadow-soft-md">
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Pendampingan Terstruktur</span>
          </span>

          <h2 className="text-xl sm:text-2xl font-black leading-snug">
            {hasScreening
              ? 'Siap Melanjutkan Bimbingan Konseling?'
              : 'Mulai dengan Screening Kebutuhan Mandiri'}
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
            {hasScreening
              ? 'Ajukan sesi konseling online dengan konselor terpercaya dan jadwalkan pertemuan Anda.'
              : 'Kuesioner membantu memetakan kebutuhan emosi, akademik, dan masa depan Anda tanpa penghakiman.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {hasScreening ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/app/counseling/new')}
                className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-bold shadow-soft-sm flex items-center gap-2 transition-all min-h-[44px]"
              >
                <MessageSquareHeart className="w-4 h-4 text-emerald-700" />
                <span>Ajukan Konseling Baru</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/app/screening')}
                className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-bold shadow-soft-sm flex items-center gap-2 transition-all min-h-[44px]"
              >
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                <span>Mulai Screening (Kuesioner)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}

            <button
              onClick={() => navigate('/app/counseling')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-semibold backdrop-blur-md transition-colors min-h-[44px]"
            >
              Lihat Konselor Kami
            </button>
          </div>
        </div>

        {/* Decorative circle background */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Unreviewed Completed Session Callout */}
      {completedUnreviewedSession && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">Sesi Konseling Anda Telah Selesai</h4>
              <p className="text-[11px] text-amber-800">
                Bagikan evaluasi dan umpan balik Anda untuk membantu kami menjaga kualitas pendampingan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackModalSession(completedUnreviewedSession)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-soft-xs whitespace-nowrap transition-colors self-end sm:self-center"
          >
            Beri Rating Sekarang
          </button>
        </div>
      )}

      {/* Method Change Suggestion Banner */}
      {activeCase?.suggested_method_status === 'PENDING' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-amber-950">
                Saran Perubahan Metode Konseling dari Konselor
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                Konselor menyarankan beralih ke metode{' '}
                <span className="font-black underline uppercase">
                  {activeCase.suggested_method === 'CHAT' ? 'Chat Konseling' : activeCase.suggested_method === 'ZOOM' ? 'Video Konseling (Zoom)' : 'Tatap Muka'}
                </span>
                .{activeCase.suggested_method_note && ` Catatan: "${activeCase.suggested_method_note}"`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleRespondMethodSuggestion('reject')}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-amber-800 font-bold text-xs hover:bg-amber-100 transition-colors"
            >
              Tetap Metode Awal
            </button>
            <button
              type="button"
              onClick={() => handleRespondMethodSuggestion('accept')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-soft-xs transition-colors"
            >
              Setujui Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Session Recommendation Banner */}
      {hasFollowUpRequired && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                Konselor Menyarankan Sesi Lanjutan
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Konselor merekomendasikan sesi tindak lanjut untuk memantau kemajuan Anda. Konselor dan topik sebelumnya sudah otomatis terpilih.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickBookFollowUp}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-soft-xs whitespace-nowrap transition-all flex items-center gap-1.5 self-end sm:self-center"
          >
            <span>Jadwalkan Sesi Berikutnya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Next Upcoming Counseling Session (if any) */}
      {upcomingSession && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Jadwal Konseling Terdekat</span>
            </h3>
            <Link to="/app/history" className="text-xs font-semibold text-emerald-700 hover:underline">
              Semua Jadwal
            </Link>
          </div>

          <AppointmentCard session={upcomingSession} isTutor={false} />
        </section>
      )}

      {/* 3.5 Action Plans / Lembar Tindak Lanjut (if any active case / tasks exist) */}
      {actionPlans.length > 0 && (
        <section className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
          <ActionPlanSection
            actionPlans={actionPlans}
            caseId={activeCase?.id}
            canAdd={Boolean(activeCase)}
            isTutor={false}
            onUpdated={fetchDashboardData}
          />
        </section>
      )}

      {/* 4. Active Case & Latest Screening Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Latest Screening Card */}
        <div className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-darktext">Screening Terakhir</h4>
              </div>
              {latestScreening && (
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  Tersimpan
                </span>
              )}
            </div>

            {latestScreening ? (
              <div className="space-y-2 text-xs mb-4">
                <p className="font-semibold text-darktext line-clamp-1">
                  {latestScreening.questionnaire?.title || 'Screening Kebutuhan BK'}
                </p>
                <p className="text-mutedtext">
                  Diserahkan pada{' '}
                  {new Date(latestScreening.submitted_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {/* Category preview pills */}
                {latestScreening.category_scores && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {latestScreening.category_scores.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-darktext font-medium"
                      >
                        {c.category}: <strong>{c.level}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-mutedtext leading-relaxed mb-4">
                Anda belum mengisi screening. Pengisian awal sangat dianjurkan sebelum berkonsultasi.
              </p>
            )}
          </div>

          <button
            onClick={() =>
              latestScreening
                ? navigate(`/app/screening/result/${latestScreening.id}`)
                : navigate('/app/screening')
            }
            className="w-full py-2.5 px-3 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold flex items-center justify-center gap-1 transition-colors min-h-[44px]"
          >
            <span>{latestScreening ? 'Lihat Hasil Screening' : 'Mulai Isi Sekarang'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Active Counseling Case Card */}
        <div className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FolderHeart className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-darktext">Kasus Konseling</h4>
              </div>
              {activeCase && <StatusBadge status={activeCase.status} />}
            </div>

            {activeCase ? (
              <div className="space-y-1.5 text-xs mb-4">
                <span className="text-[10px] font-mono text-mutedtext uppercase">
                  {activeCase.case_number}
                </span>
                <p className="font-bold text-darktext">Kategori: {activeCase.category}</p>
                <p className="text-mutedtext line-clamp-2 leading-relaxed">
                  {activeCase.initial_reason}
                </p>
              </div>
            ) : (
              <p className="text-xs text-mutedtext leading-relaxed mb-4">
                Belum ada kasus konseling aktif. Anda dapat mengajukan konsultasi kapan saja.
              </p>
            )}
          </div>

          <button
            onClick={() =>
              activeCase
                ? navigate(`/app/cases/${activeCase.id}`)
                : navigate('/app/counseling/new')
            }
            className="w-full py-2.5 px-3 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-semibold flex items-center justify-center gap-1 transition-colors min-h-[44px]"
          >
            <span>{activeCase ? 'Detail Kasus & Sesi' : 'Ajukan Kasus Konseling'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Feedback Modal */}
      {feedbackModalSession && (
        <SessionFeedbackModal
          isOpen={!!feedbackModalSession}
          onClose={() => setFeedbackModalSession(null)}
          session={feedbackModalSession}
          onSubmitted={fetchDashboardData}
        />
      )}
    </PageTransition>
  );
};

export default StudentDashboard;
