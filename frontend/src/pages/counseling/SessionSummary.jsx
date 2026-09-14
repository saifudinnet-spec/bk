import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Lock, Sparkles, Check, ArrowRight, ArrowLeft, ShieldAlert, Star, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';
import ActionPlanSection from '../../components/counseling/ActionPlanSection';
import CounseleeDiagnosticCard from '../../components/counseling/CounseleeDiagnosticCard';

export const SessionSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTutor, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [studentRecommendation, setStudentRecommendation] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [actionPlans, setActionPlans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSessionAndNote = async () => {
      try {
        const [sessRes, noteRes] = await Promise.all([
          api.get(`/sessions/${id}`),
          api.get(`/sessions/${id}/notes`).catch(() => ({ data: null })),
        ]);

        const sessionObj = sessRes.data?.data || sessRes.data;
        setSession(sessionObj);
        if (sessionObj?.counseling_case_id) {
          const apRes = await api.get(`/action-plans?case_id=${sessionObj.counseling_case_id}`).catch(() => ({ data: [] }));
          setActionPlans(apRes.data?.data || apRes.data || []);
        }

        const noteData = noteRes.data?.data !== undefined ? noteRes.data.data : noteRes.data;
        if (noteData) {
          setSummary(noteData.summary || '');
          setPrivateNote(noteData.private_note || '');
          setStudentRecommendation(noteData.student_recommendation || '');
          setFollowUpRequired(noteData.follow_up_required || false);
          if (noteData.next_follow_up_at) {
            setNextFollowUpAt(noteData.next_follow_up_at.substring(0, 16));
          }
        }
      } catch (err) {
        showError('Gagal memuat catatan sesi.');
      }
    };
    fetchSessionAndNote();
  }, [id, showError]);

  const handleCopyDiagnosticNote = (text) => {
    if (privateNote.trim()) {
      setPrivateNote((prev) => prev + '\n\n' + text);
    } else {
      setPrivateNote(text);
    }
    showSuccess('Rincian data konseli & asesmen berhasil disisipkan ke formulir diagnosa!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim() || !studentRecommendation.trim()) {
      showError('Harap lengkapi ringkasan sesi dan rekomendasi mahasiswa.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/sessions/${id}/notes`, {
        summary: summary.trim(),
        private_note: privateNote.trim() || null,
        student_recommendation: studentRecommendation.trim(),
        follow_up_required: followUpRequired,
        next_follow_up_at: followUpRequired && nextFollowUpAt ? nextFollowUpAt : null,
      });

      showSuccess('Catatan konseling dan rekomendasi mahasiswa berhasil disimpan.');
      navigate('/tutor/dashboard');
    } catch (err) {
      showError(err.message || 'Gagal menyimpan catatan sesi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tutor/dashboard')}
          className="w-10 h-10 rounded-2xl border border-softborder bg-white flex items-center justify-center text-mutedtext hover:text-darktext shadow-soft-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-darktext">Catatan Pasca Konseling & Diagnosa</h2>
          <p className="text-xs text-mutedtext">
            Dokumentasi hasil konseling, diagnosa observasi klinis, dan rekomendasi tindak lanjut bagi konseli
          </p>
        </div>
      </div>

      {/* Lembar Diagnosa & Asesmen Konseli */}
      {session && session.user && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-darktext flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>Lembar Data Konseli & Jawaban Asesmen (Referensi Diagnosa)</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Acuan Diagnosa & Rencana Aksi
            </span>
          </div>

          <CounseleeDiagnosticCard
            counseleeUser={session.user}
            assessmentAnswers={session.counseling_case?.assessment_answers}
            caseItem={session.counseling_case}
            onCopyDiagnosticNote={handleCopyDiagnosticNote}
            initialExpanded={true}
            defaultTab="assessment"
          />
        </div>
      )}

      {/* Student Feedback (if provided) */}
      {session?.feedback && (
        <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs shadow-soft-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      session.feedback.rating >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-amber-950">
                Ulasan & Rating Klien: {session.feedback.rating}.0 / 5.0
              </span>
            </div>
            {session.feedback.mood_after && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-slate-700 border border-amber-200">
                Suasana Hati Klien: {session.feedback.mood_after}
              </span>
            )}
          </div>
          {session.feedback.comment && (
            <p className="text-[11px] text-amber-900 italic">
              "{session.feedback.comment}"
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Session Summary */}
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-2">
          <label className="block text-xs font-bold text-darktext">
            Ringkasan Sesi Konseling (Umum)
          </label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Jelaskan secara ringkas poin-poin utama yang didiskusikan dalam sesi ini..."
            className="w-full p-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* 2. Private Notes (Strictly Tutor Only) */}
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-darktext flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Catatan Privat Konselor (Sangat Rahasia)</span>
            </label>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
              Hanya Anda yang Dapat Membaca
            </span>
          </div>
          <textarea
            rows={3}
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            placeholder="Catatan psikologis atau observasi internal tutor yang TIDAK AKAN DITAMPILKAN kepada mahasiswa maupun admin umum..."
            className="w-full p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/20 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
          />
        </div>

        {/* 3. Student Recommendation (Visible to student) */}
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-2">
          <label className="block text-xs font-bold text-darktext flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Rekomendasi & Rencana Aksi untuk Mahasiswa</span>
          </label>
          <textarea
            required
            rows={4}
            value={studentRecommendation}
            onChange={(e) => setStudentRecommendation(e.target.value)}
            placeholder="Tuliskan saran konstruktif, latihan mandiri, atau langkah praktis yang dapat dilakukan mahasiswa..."
            className="w-full p-3.5 rounded-2xl border border-teal-200/80 bg-teal-50/20 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 leading-relaxed"
          />
          <span className="text-[11px] text-mutedtext block">
            Bagian ini akan dapat dibaca langsung oleh mahasiswa di dashboard dan riwayat sesi mereka.
          </span>
        </div>

        {/* 4. Follow-up Check */}
        <div className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-darktext">Memerlukan Sesi Tindak Lanjut (Follow-up)?</h4>
              <p className="text-[11px] text-mutedtext">Tandai jika mahasiswa membutuhkan sesi lanjutan.</p>
            </div>
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
            />
          </div>

          {followUpRequired && (
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs font-bold text-darktext mb-1.5">
                Estimasi Waktu Sesi Berikutnya:
              </label>
              <input
                type="datetime-local"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}
        </div>

        {/* 5. Lembar Tindak Lanjut & Action Plan */}
        {session?.counseling_case_id && (
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
            <ActionPlanSection
              actionPlans={actionPlans}
              caseId={session.counseling_case_id}
              sessionId={session.id}
              canAdd={true}
              isTutor={true}
            />
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          type="submit"
          className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-md flex items-center justify-center gap-2 transition-all min-h-[48px]"
        >
          <span>{isSubmitting ? 'Menyimpan Catatan...' : 'Simpan Catatan & Selesaikan Sesi'}</span>
          <Check className="w-4 h-4" />
        </motion.button>
      </form>
    </PageTransition>
  );
};

export default SessionSummary;
