import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, CheckCircle2, ShieldCheck, Send, Sparkles, MessageSquare } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

const MOOD_OPTIONS = [
  { value: 'MUCH_BETTER', label: 'Jauh Lebih Tenang & Lega', emoji: '🌟', desc: 'Beban emosi berkurang banyak' },
  { value: 'BETTER', label: 'Cukup Terbantu & Lebih Jelas', emoji: '😊', desc: 'Mendapat sudut pandang baru' },
  { value: 'NEUTRAL', label: 'Biasa Saja / Masih Meresapi', emoji: '😐', desc: 'Perlu waktu mencerna hasil sesi' },
  { value: 'NEED_FOLLOWUP', label: 'Masih Cemas & Butuh Sesi Lagi', emoji: '🤝', desc: 'Perlu penanganan lanjutan' },
];

export const SessionFeedbackModal = ({ isOpen, onClose, session, onSubmitted }) => {
  const { showSuccess, showError } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [moodAfter, setMoodAfter] = useState('BETTER');
  const [empathyScore, setEmpathyScore] = useState(5);
  const [clarityScore, setClarityScore] = useState(5);
  const [comfortScore, setComfortScore] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      showError('Harap berikan rating bintang untuk sesi ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/sessions/${session.id}/feedback`, {
        rating,
        mood_after: moodAfter,
        aspects: {
          empathy: empathyScore,
          clarity: clarityScore,
          comfort: comfortScore,
        },
        comment: comment.trim() || null,
        is_anonymous: isAnonymous,
      });

      showSuccess(res.message || 'Terima kasih atas umpan balik Anda!');
      if (onSubmitted) onSubmitted(res.data);
      onClose();
    } catch (err) {
      showError(err.message || 'Gagal mengirim ulasan sesi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const starLabels = ['', 'Sangat Kurang', 'Kurang Membantu', 'Cukup', 'Bagus & Bermanfaat', 'Luar Biasa / Sangat Terbantu'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evaluasi & Ulasan Pasca-Konseling" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Intro */}
        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] sm:text-xs">
            Suara Anda sangat berharga untuk memastikan konselor kami memberikan pendampingan yang aman, empatik, dan berkualitas tinggi.
          </p>
        </div>

        {/* 1. Main Star Rating */}
        <div className="text-center space-y-1.5 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100">
          <label className="block text-xs font-bold text-darktext">
            Bagaimana penilaian Anda terhadap keseluruhan sesi ini?
          </label>
          <div className="flex items-center justify-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-xs font-bold text-emerald-800 min-h-[1.1rem]">
            {starLabels[hoverRating || rating]}
          </p>
        </div>

        {/* 2. Mood After Session */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-darktext">
            Bagaimana perasaan Anda sekarang dibanding sebelum sesi konseling?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMoodAfter(m.value)}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  moodAfter === m.value
                    ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-soft-xs ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-slate-700'
                }`}
              >
                <span className="text-xl shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{m.label}</p>
                  <p className="text-[10px] text-mutedtext line-clamp-1">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Detailed Aspect Ratings */}
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 space-y-2.5">
          <span className="text-xs font-bold text-darktext block">
            Penilaian Aspek Konseling (1 - 5):
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 text-xs">Empati & Penerimaan Konselor:</span>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEmpathyScore(num)}
                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      empathyScore >= num ? 'bg-emerald-700 text-white shadow-xs' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 text-xs">Kejelasan Solusi & Arahan:</span>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setClarityScore(num)}
                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      clarityScore >= num ? 'bg-emerald-700 text-white shadow-xs' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 text-xs">Kenyamanan & Keamanan Ruang:</span>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setComfortScore(num)}
                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      comfortScore >= num ? 'bg-emerald-700 text-white shadow-xs' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Message / Testimonial */}
        <div>
          <label className="block text-xs font-bold text-darktext mb-1">
            Pesan, Kesan, atau Saran untuk Konselor (Opsional)
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tuliskan apresiasi, masukan, atau apa yang paling membantu bagi Anda dalam sesi ini..."
            className="w-full p-2.5 sm:p-3 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* 5. Anonymous Toggle */}
        <label className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
          />
          <div className="flex-1">
            <span className="font-bold text-darktext block">Kirim ulasan secara anonim</span>
            <span className="text-[10px] text-mutedtext">Nama dan identitas Anda akan disamarkan pada tampilan konselor</span>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        </label>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-mutedtext hover:text-darktext hover:bg-gray-50 text-xs font-semibold cursor-pointer transition-colors"
          >
            Nanti Saja
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-soft-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Menyimpan Ulasan...' : 'Kirim Penilaian'}</span>
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionFeedbackModal;
