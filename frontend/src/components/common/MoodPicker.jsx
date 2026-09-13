import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

const moods = [
  { value: 'VERY_GOOD', emoji: '😄', label: 'Sangat Baik', color: 'hover:bg-emerald-50 hover:border-emerald-300' },
  { value: 'GOOD', emoji: '🙂', label: 'Baik', color: 'hover:bg-teal-50 hover:border-teal-300' },
  { value: 'NEUTRAL', emoji: '😐', label: 'Biasa Saja', color: 'hover:bg-sky-50 hover:border-sky-300' },
  { value: 'NOT_GOOD', emoji: '😟', label: 'Kurang Baik', color: 'hover:bg-amber-50 hover:border-amber-300' },
  { value: 'BAD', emoji: '😔', label: 'Sedih / Lelah', color: 'hover:bg-rose-50 hover:border-rose-300' },
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
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-soft-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">
            {currentMoodObj?.emoji || '✨'}
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
              Check-in Hari Ini
            </div>
            <div className="text-sm font-bold text-darktext mt-0.5">
              Kabar Anda: {currentMoodObj?.label || 'Tercatat'}
            </div>
          </div>
        </div>
        <div className="flex items-center text-xs text-mutedtext gap-1">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Tersimpan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-softborder shadow-soft-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-mutedtext">Bagaimana kabarmu hari ini?</h3>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {moods.map((m) => {
          const isSelected = selectedMood === m.value;
          return (
            <motion.button
              key={m.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(m.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all min-h-[64px] ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-inner-light ring-2 ring-emerald-400/20'
                  : `border-gray-100 bg-gray-50/70 ${m.color}`
              }`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-[10px] font-medium text-darktext text-center line-clamp-1">
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
