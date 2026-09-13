import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star, ShieldCheck, ChevronRight } from 'lucide-react';

export const TutorCard = ({ tutor, onSelect, isSelected = false }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`relative p-5 rounded-3xl border bg-white shadow-soft-sm transition-all text-left flex flex-col justify-between ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
          : 'border-softborder hover:border-emerald-300'
      }`}
    >
      <div>
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 text-white font-bold text-lg flex items-center justify-center shadow-soft-sm shrink-0 border border-emerald-100">
            {tutor.photo ? (
              <img
                src={tutor.photo}
                alt={tutor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span>{tutor.name?.charAt(0) || 'T'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-darktext truncate">{tutor.name}</h4>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <p className="text-xs text-teal-700 font-medium line-clamp-1 mt-0.5">
              {tutor.specialization || 'Konselor Bimbingan Konseling'}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Layanan Gratis Mahasiswa
            </span>
          </div>
        </div>

        <p className="text-xs text-mutedtext line-clamp-2 mb-4 leading-relaxed">
          {tutor.bio || 'Mendampingi mahasiswa dan masyarakat umum dalam proses konseling yang aman dan terpercaya.'}
        </p>

        {tutor.next_available_slot && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-800 text-[11px] mb-4">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">Jadwal terdekat: {tutor.next_available_slot.date} ({tutor.next_available_slot.start_time})</span>
          </div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(tutor)}
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] ${
          isSelected
            ? 'bg-emerald-700 text-white'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
        }`}
      >
        <span>{isSelected ? 'Tutor Terpilih' : 'Pilih Tutor Ini'}</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default TutorCard;
