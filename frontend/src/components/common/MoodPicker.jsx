import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

const moods = [
  { value: 'VERY_GOOD', emoji: '😄', label: 'Sangat Baik', activeColor: 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30 shadow-sm', hoverColor: 'hover:bg-emerald-50 hover:border-emerald-300' },
  { value: 'GOOD', emoji: '🙂', label: 'Baik', activeColor: 'bg-teal-100 border-teal-500 text-teal-900 ring-2 ring-teal-400/30 shadow-sm', hoverColor: 'hover:bg-teal-50 hover:border-teal-300' },
  { value: 'NEUTRAL', emoji: '😐', label: 'Biasa Saja', activeColor: 'bg-sky-100 border-sky-500 text-sky-900 ring-2 ring-sky-400/30 shadow-sm', hoverColor: 'hover:bg-sky-50 hover:border-sky-300' },
  { value: 'NOT_GOOD', emoji: '😟', label: 'Kurang Baik', activeColor: 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-400/30 shadow-sm', hoverColor: 'hover:bg-amber-50 hover:border-amber-300' },
  { value: 'BAD', emoji: '😔', label: 'Sedih / Lelah', activeColor: 'bg-rose-100 border-rose-500 text-rose-900 ring-2 ring-rose-400/30 shadow-sm', hoverColor: 'hover:bg-rose-50 hover:border-rose-300' },
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
      <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white rounded-3xl p-5 border border-emerald-200/80 shadow-soft-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-2xl">
            {currentMoodObj?.emoji || '✨'}
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-800 tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Check-in Hari Ini Tercatat</span>
            </div>
            <div className="text-sm font-bold text-darktext mt-0.5">
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
    <div className="bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 rounded-3xl p-5 border border-emerald-100/90 shadow-soft-sm">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-darktext">Bagaimana kabarmu hari ini?</h3>
        </div>
        <span className="text-[11px] text-mutedtext">Pilih suasana hati untuk check-in harian</span>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {moods.map((m) => {
          const isSelected = selectedMood === m.value;
          return (
            <motion.button
              key={m.value}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -2 }}
              onClick={() => handleSelect(m.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all min-h-[70px] ${
                isSelected
                  ? m.activeColor
                  : `border-gray-200/70 bg-white shadow-soft-xs ${m.hoverColor}`
              }`}
            >
              <span className="text-2xl mb-1 filter drop-shadow-sm">{m.emoji}</span>
              <span className="text-[10px] font-bold text-darktext text-center line-clamp-1">
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
