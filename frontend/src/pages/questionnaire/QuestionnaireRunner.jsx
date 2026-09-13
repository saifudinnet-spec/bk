import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, Save, AlertCircle } from 'lucide-react';
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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      saveDraft(answers, currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      saveDraft(answers, currentIndex - 1);
    }
  };

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

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <PageTransition className="max-w-2xl mx-auto space-y-5">
      {/* Top Header & Progress */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-softborder shadow-soft-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Pertanyaan {currentIndex + 1} dari {questions.length}
            </span>
            <span className="text-xs font-semibold text-mutedtext">
              ({currentQuestion.category})
            </span>
          </div>
          <span className="text-xs font-bold text-darktext">{progressPercent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
          />
        </div>
      </div>

      {/* Question Card with Horizontal Slide */}
      <div className="relative overflow-hidden min-h-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-softborder shadow-soft-md space-y-6"
          >
            <div>
              <span className="text-[11px] font-bold text-teal-700 tracking-wide uppercase block mb-1">
                Kategori: {currentQuestion.category}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-darktext leading-relaxed">
                {currentQuestion.question_text}
              </h3>
            </div>

            {/* Answer Input: Likert / Single Choice / Textarea */}
            {currentQuestion.question_type === 'textarea' ? (
              <div>
                <textarea
                  rows={4}
                  value={currentAnswer?.text_answer || ''}
                  onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                  placeholder="Tuliskan jawaban atau cerita Anda secara bebas di sini..."
                  className="w-full p-4 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed"
                />
                <p className="text-[11px] text-mutedtext mt-1.5">
                  Jawaban terbuka ini membantu konselor memahami konteks diri Anda secara lebih utuh.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentQuestion.options?.map((opt) => {
                  const isSelected = currentAnswer?.option_id === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id, opt.score)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all min-h-[52px] ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-softborder bg-white hover:bg-gray-50 text-darktext font-medium'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{opt.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-5 h-12 rounded-2xl border border-softborder bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-darktext flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        {isLastQuestion ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial px-8 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[48px]"
          >
            <span>{isSubmitting ? 'Mengirimkan...' : 'Kirimkan Screening'}</span>
            <Check className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="flex-1 sm:flex-initial px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          >
            <span>Berikutnya</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </PageTransition>
  );
};

export default QuestionnaireRunner;
