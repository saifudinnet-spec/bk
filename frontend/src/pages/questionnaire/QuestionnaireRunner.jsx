import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, AlertCircle } from 'lucide-react';
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

  // Load questionnaire & restore draft
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await api.get('/questionnaires/active');
        if (response.data) {
          setQuestionnaire(response.data);

          // Restore draft if present
          const draftStr = localStorage.getItem(`${DRAFT_KEY_PREFIX}${response.data.id}`);
          if (draftStr) {
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
    <PageTransition className="max-w-3xl mx-auto py-1">
      {/* Unified Compact Screening Card (Zero-Scroll Architecture) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm overflow-hidden flex flex-col">
        {/* 1. Header & Stepper Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200/80 tracking-tight">
              Soal {currentIndex + 1} / {questions.length}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full border ${getCategoryBadgeClass(currentQuestion.category)}`}>
              {currentQuestion.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              Shortcut: 1–5 di keyboard
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 sm:w-28 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                />
              </div>
              <span className="text-xs font-black text-slate-700 min-w-[32px] text-right">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* 2. Main Question & Options Content Area */}
        <div className="p-4 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4">
          {/* Question Text */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQuestion.question_text}
            </h2>
            {currentQuestion.is_required && !currentAnswer?.option_id && (
              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 inline" />
                Pilihlah salah satu opsi di bawah ini
              </span>
            )}
          </div>

          {/* Options: Likert (5 Columns Horizontal) vs Textarea vs General Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {currentQuestion.question_type === 'textarea' ? (
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    value={currentAnswer?.text_answer || ''}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                    placeholder="Tuliskan jawaban atau cerita Anda secara bebas di sini..."
                    className="w-full p-3 sm:p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Jawaban terbuka ini membantu konselor memahami konteks diri Anda secara lebih utuh.
                  </p>
                </div>
              ) : isLikertGroup(currentQuestion.options) ? (
                /* 5-Column Compact Rating Group */
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                  {currentQuestion.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.option_id === opt.id;
                    const isLastOfFive = idx === 4;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, opt.score)}
                        className={`group relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none min-h-[56px] sm:min-h-[70px] ${
                          isLastOfFive ? 'col-span-2 sm:col-span-1' : ''
                        } ${
                          isSelected
                            ? 'border-emerald-500 bg-gradient-to-b from-emerald-50 to-teal-50/70 text-emerald-950 font-bold shadow-soft-sm ring-2 ring-emerald-500/30'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50/90 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {/* Number & Check Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors mb-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                        </div>

                        <span className="text-[11px] sm:text-xs font-semibold leading-tight">
                          {opt.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                /* Responsive 2-Column Options Grid for longer options */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.options?.map((opt, idx) => {
                    const isSelected = currentAnswer?.option_id === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, opt.score)}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[46px] ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium">{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
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
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none min-h-[40px] shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          {/* Question Dots Tracker (Desktop) */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-xs px-2 py-1">
            {questions.map((q, i) => {
              const isAnswered = Boolean(answers[q.id]?.option_id || answers[q.id]?.text_answer);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(i);
                    saveDraft(answers, i);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 ring-2 ring-emerald-400/50 scale-125'
                      : isAnswered
                      ? 'bg-emerald-400'
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Ke soal ${i + 1}`}
                />
              );
            })}
          </div>

          {isLastQuestion ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting || !isCurrentAnswered}
              onClick={handleSubmit}
              className="px-6 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-soft-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[40px]"
            >
              <span>{isSubmitting ? 'Mengirim...' : 'Kirimkan Screening'}</span>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!isCurrentAnswered}
              onClick={handleNext}
              className="px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-soft-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 min-h-[40px]"
            >
              <span>Berikutnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default QuestionnaireRunner;
