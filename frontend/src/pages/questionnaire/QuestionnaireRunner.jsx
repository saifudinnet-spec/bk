import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

const DRAFT_KEY_PREFIX = 'bk_screening_draft_';

export const QuestionnaireRunner = () => {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const hasRestoredDraftRef = React.useRef(false);

  // Load questionnaire & restore draft
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await api.get('/questionnaires/active');
        if (response.data) {
          setQuestionnaire(response.data);

          // Restore draft if present
          const draftStr = localStorage.getItem(`${DRAFT_KEY_PREFIX}${response.data.id}`);
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
        showError(err.message || 'Gagal memuat kuesioner screening.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestionnaire();
  }, [showError, showInfo]);

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
  }, [currentQuestion, currentIndex, isCurrentAnswered, isLastQuestion, handleNext, handlePrev]);

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
      navigate(`/app/screening/result/${response.response_id}`);
    } catch (err) {
      showError(err.message || 'Gagal mengirimkan jawaban screening.');
    } finally {
      setIsSubmitting(false);
    }
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!questionnaire || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-softborder">
        <p className="text-sm text-mutedtext">Saat ini belum ada kuesioner screening yang aktif.</p>
      </div>
    );
  }

  return (
    <PageTransition className="max-w-5xl w-full mx-auto py-2">
      {/* Proportionate Executive Card (Zero-Scroll & Balanced Height) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-md overflow-hidden flex flex-col min-h-[460px] sm:min-h-[500px] justify-between">
        
        {/* 1. Header & Stepper Bar */}
        <div className="px-5 sm:px-8 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-black text-emerald-950 bg-emerald-100/90 px-3.5 py-1 rounded-2xl border border-emerald-200/90 tracking-tight shadow-2xs">
              Soal {currentIndex + 1} / {questions.length}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-2xl border ${getCategoryBadgeClass(currentQuestion.category)}`}>
              {currentQuestion.category}
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
              {currentQuestion.question_text}
            </h2>
            {currentQuestion.is_required && !currentAnswer?.option_id && (
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                Pilihlah salah satu opsi respon di bawah ini
              </span>
            )}
          </div>

          {/* Options: Likert (5 Generous Column Tiles) vs Textarea vs General Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full"
            >
              {currentQuestion.question_type === 'textarea' ? (
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
              ) : isLikertGroup(currentQuestion.options) ? (
                /* Responsive Rating Tiles: Vertical stack on mobile, 5 columns on desktop */
                <div className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-3.5">
                  {currentQuestion.options?.map((opt, idx) => {
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
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                /* Responsive 2-Column Options Grid for custom questions */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.option_id === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, opt.score)}
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[56px] ${
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
