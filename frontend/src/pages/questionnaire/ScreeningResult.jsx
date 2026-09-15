import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquareHeart, ArrowRight, ShieldCheck, Sparkles, Home } from 'lucide-react';
import api from '../../services/api';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

export const ScreeningResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startWithScreening } = useCounselingFlow();
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/questionnaires/responses/${id}`);
        setResponse(res.data);
      } catch (e) {
        console.error('Failed to load result:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleContinueToCounseling = () => {
    if (response) {
      startWithScreening(response);
    }
    navigate('/konselor');
  };

  if (isLoading) {
    return <CardSkeleton height="h-64" />;
  }

  const categoryScores = response?.category_scores || [];

  const getLevelBadge = (level) => {
    if (level === 'Tinggi') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (level === 'Sedang') {
      return 'bg-teal-50 text-teal-800 border-teal-200';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  return (
    <PageTransition className="max-w-xl mx-auto space-y-6">
      {/* Calm Success Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-softborder shadow-soft-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm"
        >
          <CheckCircle2 className="w-8 h-8" />
        </motion.div>

        <h2 className="text-xl sm:text-2xl font-black text-darktext">
          Screening Berhasil Dikirim
        </h2>

        <p className="text-xs sm:text-sm text-mutedtext mt-2 leading-relaxed max-w-md mx-auto">
          Terima kasih telah meluangkan waktu. Jawaban Anda akan digunakan untuk membantu tutor dan konselor memahami kebutuhan bimbingan Anda secara lebih terarah.
        </p>
      </div>

      {/* Category Mapping (Non-stigmatizing level summary) */}
      <div className="bg-white rounded-3xl p-6 border border-softborder shadow-soft-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-darktext">Ringkasan Area Kebutuhan Bimbingan</h3>
          <p className="text-[11px] text-mutedtext mt-0.5">
            Tingkat kebutuhan dukungan berdasarkan evaluasi mandiri Anda
          </p>
        </div>

        <div className="space-y-3">
          {categoryScores.map((cat, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-darktext">{cat.category}</h4>
                <p className="text-[10px] text-mutedtext mt-0.5">Fokus pemetaan dukungan</p>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getLevelBadge(
                  cat.level
                )}`}
              >
                Kebutuhan: {cat.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center gap-3 text-xs text-teal-900">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
        <p className="leading-relaxed text-[11px]">
          Hasil ini bukan merupakan diagnosis medis. Ini adalah instrumen pendukung konseling untuk memudahkan perencanaan sesi bimbingan Anda.
        </p>
      </div>

      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleContinueToCounseling}
          className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 min-h-[48px] transition-all"
        >
          <MessageSquareHeart className="w-4 h-4" />
          <span>Lanjut Pilih Konselor</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        <button
          onClick={() => navigate('/app')}
          className="py-3.5 px-6 rounded-2xl border border-softborder text-xs sm:text-sm font-semibold text-darktext hover:bg-gray-50 flex items-center justify-center gap-2 min-h-[48px] transition-colors"
        >
          <Home className="w-4 h-4 text-mutedtext" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>
    </PageTransition>
  );
};

export default ScreeningResult;
