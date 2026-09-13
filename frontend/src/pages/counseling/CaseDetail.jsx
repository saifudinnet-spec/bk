import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderHeart, Calendar, Clock, Video, FileText, ArrowLeft, ChevronRight, CheckCircle2, Star, Sparkles, MessageSquare, Plus } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import ActionPlanSection from '../../components/counseling/ActionPlanSection';
import SessionFeedbackModal from '../../components/counseling/SessionFeedbackModal';

export const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTutor, isAdmin, user } = useAuth();
  const [caseItem, setCaseItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('action_plans'); // 'action_plans' | 'sessions'
  const [feedbackSession, setFeedbackSession] = useState(null);

  const fetchCase = async () => {
    try {
      const res = await api.get(`/cases/${id}`);
      setCaseItem(res.data);
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  if (isLoading) {
    return <CardSkeleton height="h-64" />;
  }

  if (!caseItem) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-softborder">
        <p className="text-sm text-mutedtext">Kasus tidak ditemukan atau Anda tidak memiliki akses.</p>
      </div>
    );
  }

  const sessions = caseItem.sessions || [];
  const actionPlans = caseItem.action_plans || [];
  const isStudent = !isTutor && !isAdmin;

  const moodLabels = {
    MUCH_BETTER: '🌟 Jauh Lebih Tenang & Lega',
    BETTER: '😊 Cukup Terbantu & Jelas',
    NEUTRAL: '😐 Biasa Saja / Masih Meresapi',
    NEED_FOLLOWUP: '🤝 Masih Cemas & Butuh Sesi Lagi',
  };

  return (
    <PageTransition className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl border border-softborder bg-white flex items-center justify-center text-mutedtext hover:text-darktext shadow-soft-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono text-mutedtext tracking-wider uppercase">
            {caseItem.case_number}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-darktext truncate">
            Konseling: {caseItem.category}
          </h2>
        </div>
        <StatusBadge status={caseItem.status} />
      </div>

      {/* Case Overview Card */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
        <div>
          <span className="text-[11px] font-bold text-teal-700 tracking-wide uppercase">
            Latar Belakang Permasalahan
          </span>
          <p className="text-xs sm:text-sm text-darktext leading-relaxed mt-1.5 whitespace-pre-wrap">
            {caseItem.initial_reason}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-mutedtext block text-[10px]">Mahasiswa / Klien</span>
            <span className="font-bold text-darktext">{caseItem.user?.name}</span>
          </div>
          <div>
            <span className="text-mutedtext block text-[10px]">Konselor Pendamping</span>
            <span className="font-bold text-darktext">
              {caseItem.tutor?.name || 'Menunggu Penugasan'}
            </span>
          </div>
        </div>
      </div>

      {/* Asesmen Awal Details */}
      {caseItem.assessment_answers && Object.keys(caseItem.assessment_answers).length > 0 && (
        <div className="p-6 rounded-3xl bg-emerald-50/40 border border-emerald-150 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-darktext flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Asesmen Awal Kondisi Klien</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              Metode: {caseItem.method || 'ZOOM'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {caseItem.assessment_answers.main_issue && (
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs">
                <span className="text-[10px] font-bold text-mutedtext block mb-0.5">Kendala Utama:</span>
                <p className="font-semibold text-darktext">{caseItem.assessment_answers.main_issue}</p>
              </div>
            )}
            {caseItem.assessment_answers.duration && (
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs">
                <span className="text-[10px] font-bold text-mutedtext block mb-0.5">Durasi Dirasakan:</span>
                <p className="font-semibold text-darktext">{caseItem.assessment_answers.duration}</p>
              </div>
            )}
            {caseItem.assessment_answers.impact_level && (
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs sm:col-span-2">
                <span className="text-[10px] font-bold text-mutedtext block mb-0.5">Tingkat Gangguan Aktivitas:</span>
                <p className="font-bold text-emerald-900">{caseItem.assessment_answers.impact_level} / 5</p>
              </div>
            )}
            {caseItem.assessment_answers.previous_efforts && (
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs sm:col-span-2">
                <span className="text-[10px] font-bold text-mutedtext block mb-0.5">Upaya yang Sudah Dilakukan:</span>
                <p className="text-darktext">{caseItem.assessment_answers.previous_efforts}</p>
              </div>
            )}
            {caseItem.assessment_answers.story && (
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs sm:col-span-2">
                <span className="text-[10px] font-bold text-mutedtext block mb-0.5">Pesan / Cerita Utama:</span>
                <p className="text-darktext italic">"{caseItem.assessment_answers.story}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex p-1.5 rounded-2xl bg-gray-100/90 border border-gray-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('action_plans')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'action_plans'
              ? 'bg-white text-emerald-900 shadow-soft-xs border border-emerald-150'
              : 'text-mutedtext hover:text-darktext'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'action_plans' ? 'text-emerald-700' : 'text-mutedtext'}`} />
          <span>Lembar Tindak Lanjut ({actionPlans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'bg-white text-emerald-900 shadow-soft-xs border border-emerald-150'
              : 'text-mutedtext hover:text-darktext'
          }`}
        >
          <Video className={`w-3.5 h-3.5 ${activeTab === 'sessions' ? 'text-emerald-700' : 'text-mutedtext'}`} />
          <span>Sesi Konseling ({sessions.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Action Plan */}
      {activeTab === 'action_plans' && (
        <ActionPlanSection
          actionPlans={actionPlans}
          caseId={caseItem.id}
          canAdd={true}
          isTutor={isTutor}
          onUpdated={fetchCase}
        />
      )}

      {/* Tab Content 2: Sessions Timeline & Feedback */}
      {activeTab === 'sessions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600" />
              <span>Riwayat & Jadwal Pertemuan ({sessions.length})</span>
            </h3>

            <button
              onClick={() => navigate(`/app/counseling/book/${caseItem.id}`)}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Sesi Baru</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="p-6 bg-white rounded-3xl border border-softborder text-center">
              <p className="text-xs text-mutedtext">Belum ada sesi video konseling untuk kasus ini.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const startDate = new Date(s.start_at);
              const isPast = new Date() > new Date(s.end_at) || s.status === 'COMPLETED';

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-darktext">
                        {startDate.toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-mutedtext">
                        pukul {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {/* Recommendation from note if completed */}
                  {s.note?.student_recommendation && (
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs">
                      <span className="font-bold text-teal-900 block mb-1">
                        Catatan Rekomendasi Konselor:
                      </span>
                      <p className="text-teal-950 leading-relaxed">
                        {s.note.student_recommendation}
                      </p>
                    </div>
                  )}

                  {/* Rating & Feedback Section */}
                  {s.feedback ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  s.feedback.rating >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-amber-950 text-[11px]">
                            {s.feedback.rating}.0 / 5.0
                          </span>
                        </div>
                        {s.feedback.mood_after && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-slate-700 border border-amber-200">
                            {moodLabels[s.feedback.mood_after] || s.feedback.mood_after}
                          </span>
                        )}
                      </div>

                      {s.feedback.comment && (
                        <p className="text-[11px] text-amber-900 italic leading-relaxed">
                          "{s.feedback.comment}"
                        </p>
                      )}
                    </div>
                  ) : isPast && isStudent ? (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-amber-950">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="font-semibold text-[11px]">Bagaimana sesi konseling Anda?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedbackSession(s)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-soft-xs transition-colors"
                      >
                        Beri Rating Sesi
                      </button>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/counseling/session/${s.id}`)}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 min-h-[36px]"
                    >
                      <span>Masuk / Detail Sesi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackSession && (
        <SessionFeedbackModal
          isOpen={!!feedbackSession}
          onClose={() => setFeedbackSession(null)}
          session={feedbackSession}
          onSubmitted={fetchCase}
        />
      )}
    </PageTransition>
  );
};

export default CaseDetail;
