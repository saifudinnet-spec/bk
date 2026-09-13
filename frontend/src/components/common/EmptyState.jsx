import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, ChevronRight } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Belum Ada Data',
  description = 'Data Anda akan tampil di sini secara terstruktur dan aman.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-softborder shadow-soft-sm ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3.5">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-darktext mb-1">{title}</h4>
      <p className="text-xs text-mutedtext max-w-xs leading-relaxed mb-4">{description}</p>

      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-soft-sm flex items-center gap-1.5 transition-colors min-h-[44px]"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};

export default EmptyState;
