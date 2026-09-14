import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Video,
  Building2,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  FileText,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Phone
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import StatusBadge from '../common/StatusBadge';

export const CaseReviewModal = ({ isOpen, onClose, caseItem, onUpdated }) => {
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState('view'); // 'view' | 'suggest_method' | 'reject'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [suggestedMethod, setSuggestedMethod] = useState('ZOOM');
  const [suggestNote, setSuggestNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !caseItem) return null;

  const currentMethod = (caseItem.method || 'ZOOM').toUpperCase();
  const assessment = caseItem.assessment_answers || {};
  const user = caseItem.user || {};
  const studentProfile = user.studentProfile || {};

  // Method meta
  const methodMeta = {
    CHAT: { icon: MessageSquare, label: 'Chat Konseling', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    ZOOM: { icon: Video, label: 'Video Konseling (Zoom)', color: 'text-teal-700 bg-teal-50 border-teal-200' },
    OFFLINE: { icon: Building2, label: 'Tatap Muka Langsung', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  };

  const currentMethodMeta = methodMeta[currentMethod] || methodMeta.ZOOM;
  const CurrentMethodIcon = currentMethodMeta.icon;

  // First session date if booked
  const firstSession = caseItem.sessions && caseItem.sessions.length > 0 ? caseItem.sessions[0] : null;
  const sessionDate = firstSession ? new Date(firstSession.start_at) : null;
  const sessionEndDate = firstSession ? new Date(firstSession.end_at) : null;

  // Handle Approve
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/cases/${caseItem.id}/approve`);
      showSuccess('Pengajuan konseling berhasil disetujui.');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyetujui pengajuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Suggest Method
  const handleSuggestMethodSubmit = async (e) => {
    e.preventDefault();
    if (!suggestNote.trim()) {
      showError('Harap isi alasan / catatan saran perubahan metode.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/cases/${caseItem.id}/suggest-method`, {
        suggested_method: suggestedMethod,
        note: suggestNote.trim(),
      });
      showSuccess('Saran metode konseling berhasil dikirimkan ke mahasiswa.');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal mengirim saran metode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showError('Harap tuliskan alasan penolakan.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/cases/${caseItem.id}/reject`, {
        reason: rejectReason.trim(),
      });
      showSuccess('Pengajuan konseling telah ditolak.');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal memproses penolakan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scaleLabels = {
    1: '1/5 — Sangat ringan',
    2: '2/5 — Ringan',
    3: '3/5 — Sedang',
    4: '4/5 — Cukup berat',
    5: '5/5 — Sangat mengganggu',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Review Permohonan Konseling</h3>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {caseItem.case_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Evaluasi kondisi awal klien sebelum sesi dimulai</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={caseItem.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* User Info & Case Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student/User Data */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Data Klien</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {user.role === 'STUDENT' ? 'Mahasiswa' : 'Umum'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                  {user.name?.charAt(0) || 'M'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  {studentProfile.program_study && (
                    <p className="text-[11px] text-slate-700 font-medium mt-1 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{studentProfile.program_study}</span>
                    </p>
                  )}
                  {studentProfile.nim && (
                    <p className="text-[10px] font-mono text-slate-500">NIM: {studentProfile.nim}</p>
                  )}
                  {user.phone && (
                    <p className="text-[10px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                      <span>{user.phone}</span>
                    </p>
                  )}
                  {(studentProfile.gender || studentProfile.birth_date) && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {studentProfile.gender === 'L' ? 'Laki-laki' : studentProfile.gender === 'P' ? 'Perempuan' : ''}
                      {studentProfile.birth_date ? ` • Lahir: ${new Date(studentProfile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Counseling Request Meta */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Detail Sesi</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentMethodMeta.color} flex items-center gap-1`}>
                  <CurrentMethodIcon className="w-3 h-3" />
                  <span>{currentMethodMeta.label}</span>
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Topik Konsultasi:</p>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  {caseItem.topic?.title || caseItem.category || 'Akademik & Skripsi'}
                </h4>
              </div>

              {sessionDate && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{sessionDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-teal-700" />
                    <span>
                      {sessionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {sessionEndDate ? sessionEndDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''} WIB
                    </span>
                  </div>
                </div>
              )}

              {currentMethod === 'OFFLINE' && (
                <p className="text-[10px] text-blue-900 bg-blue-50/80 p-2 rounded-xl border border-blue-100">
                  {caseItem.location || 'Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2'}
                </p>
              )}
            </div>
          </div>

          {/* Assessment Answers Section */}
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/40 border border-emerald-150 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Ringkasan Asesmen Awal Klien
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Kendala Utama:</span>
                <p className="font-semibold text-slate-800">
                  {assessment.main_issue || caseItem.category || 'Belum diisi'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Durasi Dirasakan:</span>
                <p className="font-semibold text-slate-800">
                  {assessment.duration || 'Tidak disebutkan'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Tingkat Gangguan Aktivitas:</span>
                <p className="font-bold text-emerald-900">
                  {scaleLabels[assessment.impact_level] || (assessment.impact_level ? `${assessment.impact_level} / 5` : 'Skala 3 / 5')}
                </p>
              </div>

              {assessment.previous_efforts && (
                <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Upaya yang Sudah Dilakukan:</span>
                  <p className="text-slate-800 leading-relaxed">
                    {assessment.previous_efforts}
                  </p>
                </div>
              )}

              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-soft-xs sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Cerita / Keluhan Utama yang Ingin Disampaikan:</span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap italic">
                  "{assessment.story || caseItem.initial_reason || 'Tidak ada catatan tambahan.'}"
                </p>
              </div>
            </div>
          </div>

          {/* If Suggest Method was already sent */}
          {caseItem.suggested_method && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold block">Status Saran Metode Sebelumnya:</span>
              <p>
                Disarankan: <strong>{caseItem.suggested_method}</strong> ({caseItem.suggested_method_status || 'MENUNGGU RESPONS KLIEN'})
              </p>
              {caseItem.suggested_method_note && (
                <p className="text-[11px] italic">"{caseItem.suggested_method_note}"</p>
              )}
            </div>
          )}

          {/* Mode Sub-forms */}
          {mode === 'suggest_method' && (
            <motion.form
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSuggestMethodSubmit}
              className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>Sarankan Metode Konseling Lain</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Metode yang Disarankan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['CHAT', 'ZOOM', 'OFFLINE']
                    .filter((m) => m !== currentMethod)
                    .map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSuggestedMethod(m)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          suggestedMethod === m
                            ? 'bg-teal-700 text-white border-teal-700 shadow-soft-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m === 'CHAT' ? 'Chat' : m === 'ZOOM' ? 'Zoom Video' : 'Tatap Muka'}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan / Catatan untuk Klien:
                </label>
                <textarea
                  rows={2}
                  required
                  value={suggestNote}
                  onChange={(e) => setSuggestNote(e.target.value)}
                  placeholder="Contoh: Permasalahan ini akan lebih efektif dan mendalam jika dibahas melalui sesi video konseling."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:text-slate-800"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-soft-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Saran ke Klien'}
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'reject' && (
            <motion.form
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleRejectSubmit}
              className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tolak Permohonan Konseling</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan Penolakan:
                </label>
                <textarea
                  rows={2}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas dan santun..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:text-slate-800"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-soft-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Footer Actions */}
        {mode === 'view' && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {(caseItem.status === 'WAITING_REVIEW' || caseItem.status === 'NEW') && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('reject')}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('suggest_method');
                      setSuggestedMethod(currentMethod === 'CHAT' ? 'ZOOM' : 'CHAT');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold transition-colors"
                  >
                    Sarankan Metode Lain
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs font-bold transition-colors"
              >
                Tutup
              </button>

              {(caseItem.status === 'WAITING_REVIEW' || caseItem.status === 'NEW') && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyetujui...' : 'Setujui Permohonan'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CaseReviewModal;
