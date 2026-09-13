import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';

/**
 * GuideBubble
 * Conversational speech bubble for Nara's guidance prompts.
 */
export const GuideBubble = ({
  message,
  subtext,
  author = 'Nara',
  role = 'Pemandu Ruang BK',
  className = '',
  align = 'left', // 'left' | 'top'
}) => {
  const paragraphs = Array.isArray(message) ? message : [message];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-sm border border-emerald-100 shadow-soft-xs text-slate-800 space-y-2.5 ${className}`}
    >
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-[10px]">
            N
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 block leading-tight">{author}</span>
            <span className="text-[10px] font-semibold text-emerald-700 block leading-tight">{role}</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
          Panduan
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-1.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium">
        {paragraphs.map((para, idx) => (
          <p key={idx} className="last:mb-0">
            {para}
          </p>
        ))}
      </div>

      {/* Optional Subtext */}
      {subtext && (
        <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span>{subtext}</span>
        </div>
      )}
    </motion.div>
  );
};

export default GuideBubble;
