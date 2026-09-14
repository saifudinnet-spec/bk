import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Stethoscope, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import CounseleeDiagnosticCard from './CounseleeDiagnosticCard';

export const CounseleeDiagnosticModal = ({
  isOpen,
  onClose,
  studentId = null,
  counseleeUser = null,
  caseItem = null,
  assessmentAnswers = null,
  onCopyDiagnosticNote = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadedStudent, setLoadedStudent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    if (studentId) {
      setLoading(true);
      setError(null);
      api
        .get(`/tutor/students/${studentId}/diagnostics`)
        .then((res) => {
          setLoadedStudent(res.data?.data || res.data);
        })
        .catch((err) => {
          console.error('Failed to load student diagnostics:', err);
          setError('Gagal memuat rekam data konseli.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoadedStudent(null);
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const targetUser = loadedStudent || counseleeUser;
  const targetCases = loadedStudent?.student_cases || loadedStudent?.studentCases || [];
  const activeCase = caseItem || (targetCases.length > 0 ? targetCases[0] : null);
  const finalAnswers = assessmentAnswers || activeCase?.assessment_answers || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
              <Stethoscope className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Rekam Medis & Diagnosa Konseli</span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Akses Konselor BK
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Biodata lengkap, jawaban asesmen awal, dan instrumen screening psikologis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Memuat rekam data konseli...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs">
              {error}
            </div>
          ) : targetUser ? (
            <CounseleeDiagnosticCard
              counseleeUser={targetUser}
              assessmentAnswers={finalAnswers}
              caseItem={activeCase}
              allCases={targetCases}
              onCopyDiagnosticNote={onCopyDiagnosticNote}
              initialExpanded={true}
              defaultTab="assessment"
            />
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              Data konseli tidak ditemukan.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kerahasiaan data dilindungi standar etika konseling</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CounseleeDiagnosticModal;
