import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderHeart, Calendar, ChevronRight, User } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export const CaseCard = ({ caseItem, basePath = '/app/cases' }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`${basePath}/${caseItem.id}`)}
      className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 border-b-[4px] border-b-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(147,51,234,0.14)] hover:border-purple-300 hover:border-b-purple-500 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <FolderHeart className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-mono text-mutedtext tracking-wider uppercase">
                {caseItem.case_number}
              </span>
              <h4 className="text-sm font-bold text-darktext line-clamp-1">
                Kategori: {caseItem.category}
              </h4>
            </div>
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        <p className="text-xs text-mutedtext line-clamp-2 leading-relaxed mb-4">
          {caseItem.initial_reason}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-mutedtext">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {new Date(caseItem.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
          <span>Detail Kasus</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
};

export default CaseCard;
