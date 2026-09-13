import React from 'react';

export const StatCard = ({ icon: Icon, label, value, subtext, color = 'emerald' }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };

  const style = colorMap[color] || colorMap.emerald;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${style}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-mutedtext font-medium truncate">{label}</p>
        <h3 className="text-xl sm:text-2xl font-black text-darktext mt-0.5">{value}</h3>
        {subtext && <p className="text-[10px] text-mutedtext mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
};

export default StatCard;
