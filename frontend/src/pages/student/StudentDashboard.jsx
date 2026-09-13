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
  AlertCircle,
  BookOpen,
  HeartHandshake,
  ShieldCheck
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi 🌅';
    if (hour >= 11 && hour < 15) return 'Selamat Siang ☀️';
    if (hour >= 15 && hour < 18) return 'Selamat Sore 🌤️';
    return 'Selamat Malam 🌙';
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasScreening = Boolean(latestScreening);

  return (
    <PageTransition className="space-y-6">
      {/* 0. Student Dynamic Personalized Welcome Header */}
      <section className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-indigo-50/70 border border-emerald-100 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 border-2 border-white">
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {getGreeting()}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {user?.role === 'STUDENT' ? '🎓 Konseli Mahasiswa' : '🌐 Klien Umum'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-darktext tracking-tight">
              Hai, {user?.name || 'Mahasiswa'}!
            </h2>
            <p className="text-xs text-mutedtext">
              "Setiap langkah kecil yang kamu ambil hari ini adalah kemajuan berharga untuk kesehatan mentalmu."
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/app/counseling/wizard"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 min-h-[42px]"
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Ajukan Konseling Baru</span>
          </Link>
        </div>
      </section>

      {/* 1. Daily Mood Check-in */}
      <section>
        <MoodPicker initialMood={todayMood} onSaved={(m) => setTodayMood(m)} />
      </section>

      {/* 2. Primary Action Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-700 via-teal-700 to-indigo-900 text-white p-6 sm:p-7 shadow-soft-md border border-emerald-700/40">
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Pendampingan Terstruktur & Terpercaya</span>
          </span>

          <h2 className="text-xl sm:text-2xl font-black leading-snug">
            {hasScreening
              ? 'Siap Melanjutkan Sesi Bimbingan Konseling?'
              : 'Mulai dengan Screening Kebutuhan Mandiri'}
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
            {hasScreening
              ? 'Ajukan sesi konseling tatap muka atau video call Zoom dengan konselor terpercaya dan jadwalkan pertemuan Anda.'
              : 'Kuesioner asesmen mandiri membantu memetakan kebutuhan emosi, akademik, dan karir Anda secara aman & rahasia.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {hasScreening ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/app/counseling/wizard')}
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
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2.5 Quick Exploration & Feature Hub (4 Colorful Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Konseling 1-on-1 */}
        <Link
          to="/app/counseling/wizard"
          className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-200/70 hover:border-emerald-300 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext group-hover:text-emerald-800 transition-colors flex items-center justify-between">
            <span>Konseling 1-on-1</span>
            <ChevronRight className="w-3.5 h-3.5 text-mutedtext group-hover:text-emerald-700 transition-colors" />
          </h4>
          <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
            Sesi privat tatap muka di kampus atau video call Zoom terintegrasi.
          </p>
        </Link>

        {/* Screening Emosi & Kebutuhan */}
        <Link
          to="/app/screening"
          className="p-5 rounded-3xl bg-gradient-to-br from-sky-50/80 via-white to-blue-50/50 border border-sky-200/70 hover:border-sky-300 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext group-hover:text-sky-800 transition-colors flex items-center justify-between">
            <span>Screening Mandiri</span>
            <ChevronRight className="w-3.5 h-3.5 text-mutedtext group-hover:text-sky-700 transition-colors" />
          </h4>
          <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
            Kuesioner 20 instrumen untuk memetakan beban emosi & akademik.
          </p>
        </Link>

        {/* Action Plan & Jurnal */}
        <Link
          to="/app/history"
          className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-200/70 hover:border-indigo-300 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext group-hover:text-indigo-800 transition-colors flex items-center justify-between">
            <span>Rencana Tindak Lanjut</span>
            <ChevronRight className="w-3.5 h-3.5 text-mutedtext group-hover:text-indigo-700 transition-colors" />
          </h4>
          <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
            Target kebiasaan positif dan langkah solusi yang disepakati konselor.
          </p>
        </Link>

        {/* Edukasi Psikologi */}
        <Link
          to="/articles"
          className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border border-amber-200/70 hover:border-amber-300 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext group-hover:text-amber-800 transition-colors flex items-center justify-between">
            <span>Artikel Edukasi Mental</span>
            <ChevronRight className="w-3.5 h-3.5 text-mutedtext group-hover:text-amber-700 transition-colors" />
          </h4>
          <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
            Tips praktis redakan overthinking, burnout, dan stres perkuliahan.
          </p>
        </Link>
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
        <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-teal-50/60 via-white to-sky-50/40 border border-teal-200/80 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-darktext">Screening Mandiri</h4>
                  <span className="text-[11px] text-mutedtext">Pemetaan Kebutuhan & Emosi</span>
                </div>
              </div>
              {latestScreening && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-xs">
                  🟢 Tersimpan
                </span>
              )}
            </div>

            {latestScreening ? (
              <div className="space-y-2 text-xs mb-4">
                <p className="font-bold text-darktext text-sm line-clamp-1">
                  {latestScreening.questionnaire?.title || 'Screening Kebutuhan BK'}
                </p>
                <p className="text-mutedtext text-[11px]">
                  Diserahkan pada{' '}
                  <strong className="text-darktext">
                    {new Date(latestScreening.submitted_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </p>

                {/* Category preview pills */}
                {latestScreening.category_scores && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {latestScreening.category_scores.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-xl bg-white border border-teal-100 text-darktext font-semibold shadow-xs"
                      >
                        {c.category}: <strong className="text-teal-700">{c.level}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/80 border border-teal-100 text-xs text-mutedtext leading-relaxed mb-4">
                Anda belum mengisi instrumen screening. Pengisian awal sangat dianjurkan untuk memberikan gambaran komprehensif kepada konselor.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              latestScreening
                ? navigate(`/app/screening/result/${latestScreening.id}`)
                : navigate('/app/screening')
            }
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <span>{latestScreening ? 'Lihat Rekomendasi Screening' : 'Mulai Pengisian Kuesioner'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Counseling Case Card */}
        <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border border-indigo-200/80 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center">
                  <FolderHeart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-darktext">Kasus Konseling Aktif</h4>
                  <span className="text-[11px] text-mutedtext">Pendampingan & Sesi Temu</span>
                </div>
              </div>
              {activeCase && <StatusBadge status={activeCase.status} />}
            </div>

            {activeCase ? (
              <div className="space-y-1.5 text-xs mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {activeCase.case_number}
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {activeCase.category}
                  </span>
                </div>
                <p className="text-mutedtext line-clamp-2 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-indigo-100 italic">
                  "{activeCase.initial_reason}"
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/80 border border-indigo-100 text-xs text-mutedtext leading-relaxed mb-4">
                Belum ada kasus konseling aktif. Ceritakan keresahan atau kendala perkuliahanmu bersama konselor terpercaya.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              activeCase
                ? navigate(`/app/cases/${activeCase.id}`)
                : navigate('/app/counseling/wizard')
            }
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <span>{activeCase ? 'Detail Kasus & Riwayat Sesi' : 'Daftar Konseling Sekarang'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
