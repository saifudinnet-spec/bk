import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

const moods = [
  {
    value: 'VERY_GOOD',
    emoji: '😄',
    label: 'Sangat Baik',
    defaultClasses:
      'bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-teal-50 border-emerald-200/90 border-b-[3px] border-b-emerald-300 text-emerald-950 shadow-[0_3px_10px_rgba(16,185,129,0.12)] hover:border-emerald-300 hover:shadow-[0_6px_16px_rgba(16,185,129,0.2)]',
    activeClasses:
      'bg-gradient-to-b from-emerald-500 to-teal-600 border-emerald-600 border-b-[3px] border-b-emerald-800 text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/50 scale-[1.02]',
  },
  {
    value: 'GOOD',
    emoji: '🙂',
    label: 'Baik',
    defaultClasses:
      'bg-gradient-to-b from-sky-50 via-cyan-100/40 to-teal-50 border-cyan-200/90 border-b-[3px] border-b-cyan-300 text-cyan-950 shadow-[0_3px_10px_rgba(6,182,212,0.12)] hover:border-cyan-300 hover:shadow-[0_6px_16px_rgba(6,182,212,0.2)]',
    activeClasses:
      'bg-gradient-to-b from-teal-500 to-cyan-600 border-teal-600 border-b-[3px] border-b-teal-800 text-white shadow-[0_6px_18px_rgba(20,184,166,0.35)] ring-2 ring-teal-400/50 scale-[1.02]',
  },
  {
    value: 'NEUTRAL',
    emoji: '😐',
    label: 'Biasa Saja',
    defaultClasses:
      'bg-gradient-to-b from-amber-50 via-amber-100/40 to-yellow-50 border-amber-200/90 border-b-[3px] border-b-amber-300 text-amber-950 shadow-[0_3px_10px_rgba(245,158,11,0.12)] hover:border-amber-300 hover:shadow-[0_6px_16px_rgba(245,158,11,0.2)]',
    activeClasses:
      'bg-gradient-to-b from-amber-500 to-yellow-600 border-amber-600 border-b-[3px] border-b-amber-800 text-white shadow-[0_6px_18px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/50 scale-[1.02]',
  },
  {
    value: 'NOT_GOOD',
    emoji: '😟',
    label: 'Kurang Baik',
    defaultClasses:
      'bg-gradient-to-b from-orange-50 via-orange-100/40 to-amber-50 border-orange-200/90 border-b-[3px] border-b-orange-300 text-orange-950 shadow-[0_3px_10px_rgba(249,115,22,0.12)] hover:border-orange-300 hover:shadow-[0_6px_16px_rgba(249,115,22,0.2)]',
    activeClasses:
      'bg-gradient-to-b from-orange-500 to-rose-600 border-orange-600 border-b-[3px] border-b-orange-800 text-white shadow-[0_6px_18px_rgba(249,115,22,0.35)] ring-2 ring-orange-400/50 scale-[1.02]',
  },
  {
    value: 'BAD',
    emoji: '😔',
    label: 'Sedih / Lelah',
    defaultClasses:
      'bg-gradient-to-b from-rose-50 via-rose-100/40 to-pink-50 border-rose-200/90 border-b-[3px] border-b-rose-300 text-rose-950 shadow-[0_3px_10px_rgba(244,63,94,0.12)] hover:border-rose-300 hover:shadow-[0_6px_16px_rgba(244,63,94,0.2)]',
    activeClasses:
      'bg-gradient-to-b from-rose-500 to-pink-600 border-rose-600 border-b-[3px] border-b-rose-800 text-white shadow-[0_6px_18px_rgba(244,63,94,0.35)] ring-2 ring-rose-400/50 scale-[1.02]',
  },
];

export const MoodPicker = ({ initialMood = null, onSaved = () => {} }) => {
  const [selectedMood, setSelectedMood] = useState(
    typeof initialMood === 'string' ? initialMood : initialMood?.mood || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (initialMood) {
      const val = typeof initialMood === 'string' ? initialMood : initialMood?.mood;
      if (val) setSelectedMood(val);
    }
  }, [initialMood]);

  const handleSelect = async (moodValue) => {
    setSelectedMood(moodValue);
    const selectedObj = moods.find((m) => m.value === moodValue);
    // Optimistically notify parent immediately so top-right banner updates with zero delay
    if (onSaved) onSaved({ mood: moodValue });

    setIsSubmitting(true);
    try {
      const response = await api.post('/mood/checkin', {
        mood: moodValue,
      });
      showSuccess(`Kabar Anda tercatat: ${selectedObj?.label || 'Tersimpan'}`);
      const savedData = response.data || response;
      if (onSaved) onSaved(savedData);
    } catch (err) {
      showError(err.message || 'Gagal menyimpan check-in suasana hati.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMoodObj = moods.find((m) => m.value === selectedMood);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl py-3 px-4 sm:py-3.5 sm:px-5 border border-slate-200/80 shadow-soft-xs">
      {/* Header with Title */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-darktext tracking-tight">
            Bagaimana kabarmu hari ini?
          </h3>
          <p className="text-[10px] sm:text-[11px] text-mutedtext font-medium">
            Pilih suasana hati untuk check-in harian
          </p>
        </div>
      </div>

      {/* 5 Emoticon Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
        {moods.map((m) => {
          const isSelected = selectedMood === m.value;
          return (
            <motion.button
              key={m.value}
              type="button"
              disabled={isSubmitting}
              whileTap={{ scale: 0.95, y: 1 }}
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => handleSelect(m.value)}
              className={`relative flex flex-col items-center justify-center py-2 px-2 sm:py-2.5 sm:px-2.5 rounded-2xl border transition-all cursor-pointer select-none min-h-[58px] sm:min-h-[64px] ${
                isSelected ? m.activeClasses : m.defaultClasses
              }`}
            >
              <span className="text-xl sm:text-2xl mb-1 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform group-hover:scale-110">
                {m.emoji}
              </span>
              <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-center line-clamp-1">
                {m.label}
              </span>

              {/* Selected subtle check badge on button */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MoodPicker;
