import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquareHeart, ShieldCheck, Check, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import TutorCard from '../../components/cards/TutorCard';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

const categories = [
  'Akademik',
  'Pribadi',
  'Sosial',
  'Keluarga',
  'Ekonomi',
  'Karier',
  'Adaptasi',
  'Lainnya',
];

export const CounselingRequest = () => {
  const [category, setCategory] = useState('Akademik');
  const [initialReason, setInitialReason] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await api.get('/tutors');
        setTutors(response.data || []);
      } catch (err) {
        console.error('Failed to load tutors:', err);
      } finally {
        setIsLoadingTutors(false);
      }
    };
    fetchTutors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!initialReason.trim() || initialReason.trim().length < 15) {
      showError('Ceritakan secara singkat alasan atau kendala Anda (minimal 15 karakter).');
      return;
    }
    if (!agreement) {
      showError('Harap centang persetujuan informasi konseling.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/cases', {
        category,
        initial_reason: initialReason.trim(),
        agreement: true,
        tutor_id: selectedTutor ? selectedTutor.id : null,
      });

      showSuccess('Pengajuan konseling berhasil dikirimkan.');
      const caseData = response.data;

      // Navigate to booking schedule for this case
      navigate(`/app/counseling/book/${caseData.id}${selectedTutor ? `?tutor_id=${selectedTutor.id}` : ''}`);
    } catch (err) {
      showError(err.message || 'Gagal mengajukan konseling.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div>
          <h2 className="text-xl font-bold text-darktext">Ajukan Bimbingan Konseling</h2>
          <p className="text-xs text-mutedtext">Ruang privat untuk menceritakan permasalahan dan harapan Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Picker */}
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
          <label className="block text-xs font-bold text-darktext">
            Pilih Bidang Permasalahan / Kategori:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all min-h-[44px] ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-softborder bg-white text-mutedtext hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason Textarea */}
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-2">
          <label className="block text-xs font-bold text-darktext">
            Ceritakan secara singkat apa yang ingin Anda diskusikan:
          </label>
          <textarea
            required
            rows={4}
            value={initialReason}
            onChange={(e) => setInitialReason(e.target.value)}
            placeholder="Tuliskan kendala yang sedang Anda hadapi, hal yang membebani pikiran, atau harapan dari sesi konseling ini..."
            className="w-full p-4 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed"
          />
          <span className="text-[11px] text-mutedtext block">
            Minimal 15 karakter. Informasi ini terjaga kerahasiaannya.
          </span>
        </div>

        {/* Optional Tutor Selection */}
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-darktext flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Pilih Konselor / Tutor Pendamping:</span>
              </h3>
              <p className="text-[11px] text-mutedtext">Pilih konselor yang sesuai atau biarkan sistem mencocokkan.</p>
            </div>
            {selectedTutor && (
              <button
                type="button"
                onClick={() => setSelectedTutor(null)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Atur Otomatis
              </button>
            )}
          </div>

          {isLoadingTutors ? (
            <ListSkeleton count={2} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  isSelected={selectedTutor?.id === tutor.id}
                  onSelect={(t) => setSelectedTutor(t)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
          <input
            type="checkbox"
            id="agreement"
            checked={agreement}
            onChange={(e) => setAgreement(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <label htmlFor="agreement" className="text-xs text-darktext leading-relaxed cursor-pointer select-none">
            <strong>Saya memahami</strong> bahwa informasi ini digunakan secara profesional untuk membantu proses bimbingan konseling dan dilindungi oleh standar kerahasiaan.
          </label>
        </div>

        {/* Submit CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || !agreement}
          type="submit"
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[50px]"
        >
          <span>{isSubmitting ? 'Memproses Pengajuan...' : 'Lanjut ke Pemilihan Jadwal'}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </form>
    </PageTransition>
  );
};

export default CounselingRequest;
