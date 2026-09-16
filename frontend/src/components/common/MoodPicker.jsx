import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

const moods = [
  {
    value: 'VERY_GOOD',
    emoji: '😄',
    label: 'Sangat Baik',
    defaultClasses:
      'bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-teal-50 border-emerald-200/90 border-b-[3.5px] border-b-emerald-300 text-emerald-950 shadow-[0_4px_12px_rgba(16,185,129,0.14)] hover:border-emerald-300 hover:shadow-[0_8px_18px_rgba(16,185,129,0.24)]',
    activeClasses:
      'bg-gradient-to-b from-emerald-500 to-teal-600 border-emerald-600 border-b-[3.5px] border-b-emerald-800 text-white shadow-[0_8px_20px_rgba(16,185,129,0.38)] ring-2 ring-emerald-400/40',
  },
  {
    value: 'GOOD',
    emoji: '🙂',
    label: 'Baik',
    defaultClasses:
      'bg-gradient-to-b from-sky-50 via-cyan-100/40 to-teal-50 border-cyan-200/90 border-b-[3.5px] border-b-cyan-300 text-cyan-950 shadow-[0_4px_12px_rgba(6,182,212,0.14)] hover:border-cyan-300 hover:shadow-[0_8px_18px_rgba(6,182,212,0.24)]',
    activeClasses:
      'bg-gradient-to-b from-teal-500 to-cyan-600 border-teal-600 border-b-[3.5px] border-b-teal-800 text-white shadow-[0_8px_20px_rgba(20,184,166,0.38)] ring-2 ring-teal-400/40',
  },
  {
    value: 'NEUTRAL',
    emoji: '😐',
    label: 'Biasa Saja',
    defaultClasses:
      'bg-gradient-to-b from-amber-50 via-amber-100/40 to-yellow-50 border-amber-200/90 border-b-[3.5px] border-b-amber-300 text-amber-950 shadow-[0_4px_12px_rgba(245,158,11,0.14)] hover:border-amber-300 hover:shadow-[0_8px_18px_rgba(245,158,11,0.24)]',
    activeClasses:
      'bg-gradient-to-b from-amber-500 to-yellow-600 border-amber-600 border-b-[3.5px] border-b-amber-800 text-white shadow-[0_8px_20px_rgba(245,158,11,0.38)] ring-2 ring-amber-400/40',
  },
  {
    value: 'NOT_GOOD',
    emoji: '😟',
    label: 'Kurang Baik',
    defaultClasses:
      'bg-gradient-to-b from-orange-50 via-orange-100/40 to-amber-50 border-orange-200/90 border-b-[3.5px] border-b-orange-300 text-orange-950 shadow-[0_4px_12px_rgba(249,115,22,0.14)] hover:border-orange-300 hover:shadow-[0_8px_18px_rgba(249,115,22,0.24)]',
    activeClasses:
      'bg-gradient-to-b from-orange-500 to-rose-600 border-orange-600 border-b-[3.5px] border-b-orange-800 text-white shadow-[0_8px_20px_rgba(249,115,22,0.38)] ring-2 ring-orange-400/40',
  },
  {
    value: 'BAD',
    emoji: '😔',
    label: 'Sedih / Lelah',
    defaultClasses:
      'bg-gradient-to-b from-rose-50 via-rose-100/40 to-pink-50 border-rose-200/90 border-b-[3.5px] border-b-rose-300 text-rose-950 shadow-[0_4px_12px_rgba(244,63,94,0.14)] hover:border-rose-300 hover:shadow-[0_8px_18px_rgba(244,63,94,0.24)]',
    activeClasses:
      'bg-gradient-to-b from-rose-500 to-pink-600 border-rose-600 border-b-[3.5px] border-b-rose-800 text-white shadow-[0_8px_20px_rgba(244,63,94,0.38)] ring-2 ring-rose-400/40',
  },
];

export const MoodPicker = ({ initialMood = null, onSaved = () => {} }) => {
  const [selectedMood, setSelectedMood] = useState(initialMood?.mood || null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavedToday, setIsSavedToday] = useState(Boolean(initialMood));
  const { showSuccess, showError } = useToast();

  const handleSelect = async (moodValue) => {
    setSelectedMood(moodValue);
    setShowNoteInput(true);
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/mood/checkin', {
        mood: selectedMood,
        note: note.trim() || null,
      });
      setIsSavedToday(true);
      showSuccess('Catatan suasana hati hari ini tersimpan.');
      if (onSaved) onSaved(response.data);
    } catch (err) {
      showError(err.message || 'Gagal menyimpan check-in suasana hati.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSavedToday) {
    const currentMoodObj = moods.find((m) => m.value === selectedMood);
    return (
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white rounded-3xl p-5 border border-emerald-200/80 shadow-soft-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md border-b-[3px] border-emerald-200 flex items-center justify-center text-2xl drop-shadow-sm">
            {currentMoodObj?.emoji || '✨'}
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
              Check-in Hari Ini Tercatat
            </div>
            <div className="text-sm font-black text-darktext mt-0.5">
              Kabar Anda: <strong className="text-emerald-900">{currentMoodObj?.label || 'Tercatat'}</strong>
            </div>
          </div>
        </div>
        <div className="flex items-center text-xs text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm font-semibold gap-1.5">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Tersimpan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 border border-slate-200/80 shadow-soft-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
        <h3 className="text-sm sm:text-base font-black text-darktext tracking-tight">
          Bagaimana kabarmu hari ini?
        </h3>
        <span className="text-[11px] text-mutedtext font-medium">Pilih suasana hati untuk check-in harian</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {moods.map((m) => {
          const isSelected = selectedMood === m.value;
          return (
            <motion.button
              key={m.value}
              whileTap={{ scale: 0.96, y: 1 }}
              whileHover={{ y: -3, scale: 1.02 }}
              onClick={() => handleSelect(m.value)}
              className={`relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none min-h-[82px] ${
                isSelected ? m.activeClasses : m.defaultClasses
              }`}
            >
              <span className="text-2xl sm:text-3xl mb-1.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover:scale-110">
                {m.emoji}
              </span>
              <span className="text-[11px] font-black tracking-tight text-center line-clamp-1">
                {m.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {showNoteInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <input
            type="text"
            placeholder="Ada cerita singkat hari ini? (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-softborder bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-darktext"
          />

          <div className="flex justify-end mt-2.5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-soft-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[38px]"
            >
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kabar Hari Ini'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MoodPicker;
