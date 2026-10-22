import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  MessageSquareHeart,
  ShieldCheck,
  Calendar,
  HeartHandshake,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

const DRAFT_KEY_PREFIX = 'bk_screening_draft_';

export const QuestionnaireRunner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const { startWithScreening } = useCounselingFlow();

  // Screen / Data states
  const [isLoading, setIsLoading] = useState(true);
  const [latestResponse, setLatestResponse] = useState(null);
  const [fullResponseDetail, setFullResponseDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Runner states
  const [isRetaking, setIsRetaking] = useState(searchParams.get('retake') === 'true');
  const [questionnaire, setQuestionnaire] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRestoredDraftRef = React.useRef(false);

  // Sync state if URL search param changes
  useEffect(() => {
    if (searchParams.get('retake') === 'true') {
      setIsRetaking(true);
    }
  }, [searchParams]);

  // Initial Data Fetching: Check for existing screening history & active questionnaire
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch user screening history
        const historyRes = await api.get('/questionnaires/history');
        const historyList = historyRes.data?.data || historyRes.data || [];
        
        let existingLatest = null;
        if (Array.isArray(historyList) && historyList.length > 0) {
          existingLatest = historyList[0];
          setLatestResponse(existingLatest);

          // Fetch full detail in background to get questions & answers if available
          api.get(`/questionnaires/responses/${existingLatest.id}`)
            .then((res) => {
              const detail = res.data?.data || res.data;
              setFullResponseDetail(detail);
            })
            .catch(() => {});
        }

        // If user already has screening and did not explicitly request ?retake=true, show summary
        const forceRetake = searchParams.get('retake') === 'true';
        if (existingLatest && !forceRetake) {
          setIsRetaking(false);
        } else {
          setIsRetaking(true);
        }

        // 2. Fetch active questionnaire for runner
        const activeRes = await api.get('/questionnaires/active');
        const activeData = activeRes.data?.data || activeRes.data;
        if (activeData) {
          setQuestionnaire(activeData);

          // Restore draft if present
          const draftStr = localStorage.getItem(`${DRAFT_KEY_PREFIX}${activeData.id}`);
          if (draftStr && !hasRestoredDraftRef.current) {
            hasRestoredDraftRef.current = true;
            try {
              const parsed = JSON.parse(draftStr);
              setAnswers(parsed.answers || {});
              if (parsed.lastIndex !== undefined) {
                setCurrentIndex(parsed.lastIndex);
              }
              showInfo('Draft jawaban tersimpan Anda telah dipulihkan.');
            } catch {}
          }
        }
      } catch (err) {
        showError(err.message || 'Gagal memuat data screening kebutuhan.');
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [searchParams, showError, showInfo]);

  // Autosave draft to localStorage
  const saveDraft = useCallback((currentAnswers, index) => {
    if (questionnaire?.id) {
      localStorage.setItem(
        `${DRAFT_KEY_PREFIX}${questionnaire.id}`,
        JSON.stringify({ answers: currentAnswers, lastIndex: index, updatedAt: Date.now() })
      );
    }
  }, [questionnaire]);

  const handleSelectOption = (questionId, optionId, score) => {
    const updated = {
      ...answers,
      [questionId]: {
        question_id: questionId,
        option_id: optionId,
        score,
        text_answer: null,
      },
    };
    setAnswers(updated);
    saveDraft(updated, currentIndex);
  };

  const handleTextChange = (questionId, text) => {
    const updated = {
      ...answers,
      [questionId]: {
        question_id: questionId,
        option_id: null,
        score: null,
        text_answer: text,
      },
    };
    setAnswers(updated);
    saveDraft(updated, currentIndex);
  };

  const questions = questionnaire?.questions || [];
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isCurrentAnswered = currentQuestion?.is_required
    ? Boolean(currentAnswer?.option_id || (currentQuestion.question_type === 'textarea' && currentAnswer?.text_answer?.trim()))
    : true;

  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1;

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      saveDraft(answers, currentIndex + 1);
    }
  }, [currentIndex, questions.length, answers, saveDraft]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      saveDraft(answers, currentIndex - 1);
    }
  }, [currentIndex, answers, saveDraft]);

  // Keyboard navigation support: Numbers 1-5 for options, ArrowLeft / ArrowRight / Enter for navigation
  useEffect(() => {
    if (!isRetaking) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
      }

      if (currentQuestion?.options && currentQuestion.question_type !== 'textarea') {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentQuestion.options.length) {
          const targetOpt = currentQuestion.options[num - 1];
          if (targetOpt) {
            handleSelectOption(currentQuestion.id, targetOpt.id, targetOpt.score);
          }
        }
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isCurrentAnswered && !isLastQuestion) {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRetaking, currentQuestion, currentIndex, isCurrentAnswered, isLastQuestion, handleNext, handlePrev]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = Object.values(answers);
      const response = await api.post(`/questionnaires/${questionnaire.id}/submit`, {
        answers: payload,
      });

      // Clear draft
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${questionnaire.id}`);

      // Gentle celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#059669', '#0d9488', '#10b981'],
        });
      } catch {}

      showSuccess('Screening berhasil diserahkan.');

      // Refresh latest response data and switch to summary view
      const detailRes = await api.get(`/questionnaires/responses/${response.response_id}`);
      const newDetail = detailRes.data?.data || detailRes.data;
      setLatestResponse(newDetail);
      setFullResponseDetail(newDetail);
      setIsRetaking(false);
      setSearchParams({});
    } catch (err) {
      showError(err.message || 'Gagal mengirimkan jawaban screening.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRetake = () => {
    setIsRetaking(true);
    setSearchParams({ retake: 'true' });
    setCurrentIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelRetake = () => {
    setIsRetaking(false);
    setSearchParams({});
  };

  const handleContinueToCounseling = () => {
    const targetData = fullResponseDetail || latestResponse;
    if (targetData) {
      startWithScreening(targetData);
    }
    navigate('/konselor');
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Akademik':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Emosi / Stres':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Relasi Sosial':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Keluarga dan Ekonomi':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Karier dan Masa Depan':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-teal-50 text-teal-800 border-teal-200';
    }
  };

  const isLikertGroup = (options) => {
    if (!options || options.length === 0) return false;
    return options.length <= 5 && options.every((opt) => opt.label && opt.label.length <= 20);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return (
        new Date(dateStr).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    } catch {
      return dateStr;
    }
  };

  const getLevelConfig = (level) => {
    if (level === 'Tinggi') {
      return {
        badge: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        bar: 'bg-gradient-to-r from-rose-500 to-amber-500',
        label: 'Prioritas Pendampingan',
        description: 'Terdapat kendala signifikan yang sangat dianjurkan untuk dikonsultasikan bersama konselor.',
      };
    }
    if (level === 'Sedang') {
      return {
        badge: 'bg-teal-50 text-teal-800 border-teal-200',
        dot: 'bg-teal-500',
        bar: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        label: 'Perlu Perhatian',
        description: 'Terdapat tantangan yang dapat diantisipasi lebih awal dengan berdiskusi terarah.',
      };
    }
    return {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      label: 'Kondisi Stabil / Baik',
      description: 'Kondisi Anda berada dalam batas adaptif yang prima. Pertahankan kebiasaan positif ini.',
    };
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // =========================================================================
  // VIEW A: RANGKUMAN SCREENING (Jika user sudah pernah menyelesaikan screening)
  // =========================================================================
  if (!isRetaking && latestResponse) {
    const summaryData = fullResponseDetail || latestResponse;
    const categoryScores = summaryData.category_scores || [];
    return (
      <PageTransition className="w-full max-w-7xl mx-auto space-y-4 py-1">
        {/* 1. Header Card Hasil Screening (Kompak & Full Kesamping) */}
        <section className="py-3 px-4 sm:py-3.5 sm:px-6 rounded-3xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border border-emerald-200/90 shadow-soft-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 border-2 border-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                Rangkuman Screening Kebutuhan Anda
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="truncate max-w-md">Kuesioner: <strong className="text-slate-800">{(summaryData.questionnaire?.title || 'Screening Kebutuhan Mahasiswa').replace(/\s*\(Komprehensif\)/gi, '')}</strong></span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 text-slate-500 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(summaryData.submitted_at)}
                </span>
              </p>
            </div>
          </div>

          {/* Tombol Perbarui Screening */}
          <div className="relative z-10 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleStartRetake}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-soft-2xs transition-all flex items-center gap-2 group cursor-pointer"
              title="Isi ulang kuesioner jika kondisi atau situasi semester ini telah berubah"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
              <span>Perbarui / Isi Ulang</span>
            </button>
          </div>
        </section>

        {/* 2. Grid Kartu Rincian Kategori */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Pemetaan Kebutuhan per Kategori</span>
            </h3>
            <span className="text-xs text-slate-500">
              {categoryScores.length} Kategori Terpetakan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categoryScores.map((cat, idx) => {
              const config = getLevelConfig(cat.level);
              const percentage = cat.percentage !== undefined ? cat.percentage : Math.min(100, Math.round(((cat.score || 0) / (cat.max_score || 20)) * 100));

              return (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft-2xs hover:shadow-soft-sm transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        {cat.category}
                      </h4>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                        Kebutuhan: {cat.level}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {config.description}
                    </p>
                  </div>

                  {/* Progress Bar Score */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Indikator Beban</span>
                      <span className="font-bold text-slate-700">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(8, percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Catatan Privasi & Etika */}
        <section className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/70 flex items-start gap-3 text-teal-950 text-xs">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-teal-900 leading-relaxed">
            <strong>Kerahasiaan Terjamin:</strong> Hasil screening mandiri ini bukan merupakan diagnosis medis formal, melainkan instrumen asesmen awal bimbingan konseling untuk membantu konselor memahami konteks diri Anda secara aman, rahasia, dan profesional.
          </p>
        </section>
      </PageTransition>
    );
  }

  // =========================================================================
  // VIEW B: QUESTIONNAIRE RUNNER (Untuk pengisian baru atau mode retake)
  // =========================================================================
  if (!questionnaire || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-softborder">
        <p className="text-sm text-mutedtext">Saat ini belum ada kuesioner screening yang aktif.</p>
      </div>
    );
  }

  return (
    <PageTransition className="max-w-5xl w-full mx-auto py-2 space-y-4">
      {/* Banner Kembali jika sedang dalam mode retake padahal sudah punya hasil lama */}
      {latestResponse && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-soft-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Anda sedang dalam mode <strong>pengisian ulang screening</strong>. Data lama Anda tetap tersimpan hingga kuesioner baru ini dikirimkan.
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancelRetake}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-xl font-bold text-xs hover:bg-amber-100 transition-colors self-end sm:self-center shrink-0 cursor-pointer"
          >
            ← Kembali ke Rangkuman Tersimpan
          </button>
        </div>
      )}

      {/* Proportionate Executive Card (Zero-Scroll & Balanced Height) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-md overflow-hidden flex flex-col min-h-[460px] sm:min-h-[500px] justify-between">
        
        {/* 1. Header & Stepper Bar */}
        <div className="px-5 sm:px-8 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-black text-emerald-950 bg-emerald-100/90 px-3.5 py-1 rounded-2xl border border-emerald-200/90 tracking-tight shadow-2xs">
              Soal {currentIndex + 1} / {questions.length}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-2xl border ${getCategoryBadgeClass(currentQuestion?.category)}`}>
              {currentQuestion?.category}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs text-slate-400 font-medium">
              Pintasan keyboard: <span className="font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">1</span>–<span className="font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">5</span>
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-24 sm:w-44 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-800 min-w-[36px] text-right">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* 2. Main Question & Options Content Area */}
        <div className="px-5 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-center space-y-6">
          {/* Question Text */}
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
              {currentQuestion?.question_text}
            </h2>
            {currentQuestion?.is_required && !currentAnswer?.option_id && (
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                Pilihlah salah satu opsi respon di bawah ini
              </span>
            )}
          </div>

          {/* Options: Likert (5 Generous Column Tiles) vs Textarea vs General Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full"
            >
              {currentQuestion?.question_type === 'textarea' ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={currentAnswer?.text_answer || ''}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                    placeholder="Tuliskan jawaban atau cerita Anda secara bebas di sini..."
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm sm:text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed shadow-inner"
                  />
                  <p className="text-xs text-slate-500">
                    Jawaban terbuka ini membantu konselor memahami konteks diri Anda secara lebih mendalam dan personal.
                  </p>
                </div>
              ) : isLikertGroup(currentQuestion?.options) ? (
                /* Responsive Rating Tiles: Vertical stack on mobile, 5 columns on desktop */
                <div className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-3.5">
                  {currentQuestion?.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.option_id === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, opt.score)}
                        className={`group relative p-3 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-row sm:flex-col items-center sm:justify-center justify-between text-left sm:text-center transition-all cursor-pointer select-none min-h-[52px] sm:min-h-[125px] ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/90 sm:bg-gradient-to-b sm:from-emerald-50/90 sm:via-teal-50/60 sm:to-emerald-50/30 text-emerald-950 font-bold shadow-soft-xs sm:shadow-soft-md ring-2 ring-emerald-500/30'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50/90 text-slate-700 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:block">
                          {/* Number & Check Badge */}
                          <div
                            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center transition-colors sm:mb-2.5 shadow-2xs shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-soft-sm'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800'
                            }`}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : idx + 1}
                          </div>

                          <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight">
                            {opt.label}
                          </span>
                        </div>

                        {/* Mobile Radio/Check Pill */}
                        <div className="sm:hidden flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                /* Responsive 2-Column Options Grid for custom questions */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion?.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.option_id === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, opt.score)}
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[56px] cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-soft-xs'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-6 h-6 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. Bottom Navigation Footer */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-3.5 sm:px-6 h-10 sm:h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-2xs shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Clean Numerical Context */}
          <div className="text-xs sm:text-sm font-semibold text-slate-500 text-center">
            <span className="hidden sm:inline">Pertanyaan </span>
            <span className="font-extrabold text-slate-900">{currentIndex + 1}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="font-extrabold text-slate-900">{questions.length}</span>
          </div>

          {isLastQuestion ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting || !isCurrentAnswered}
              onClick={handleSubmit}
              className="px-4 sm:px-8 h-10 sm:h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-soft-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <span>{isSubmitting ? 'Mengirim...' : 'Kirimkan'}</span>
              <span className="hidden sm:inline"> Screening</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!isCurrentAnswered}
              onClick={handleNext}
              className="px-4 sm:px-8 h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-soft-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all disabled:opacity-40 shrink-0 cursor-pointer"
            >
              <span>Berikutnya</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

      </div>
    </PageTransition>
  );
};

export default QuestionnaireRunner;
