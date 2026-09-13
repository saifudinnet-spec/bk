import React from 'react';

export const StatCard = ({ icon: Icon, label, value, subtext, color = 'emerald', badge, onClick }) => {
  const themeMap = {
    emerald: {
      border: 'border-emerald-200/70 hover:border-emerald-300',
      bgGlow: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      orb: 'bg-emerald-400/15',
    },
    teal: {
      border: 'border-teal-200/70 hover:border-teal-300',
      bgGlow: 'from-teal-500/10 via-cyan-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-teal-500/25',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
      orb: 'bg-teal-400/15',
    },
    blue: {
      border: 'border-sky-200/70 hover:border-sky-300',
      bgGlow: 'from-sky-500/10 via-blue-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/25',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      orb: 'bg-sky-400/15',
    },
    indigo: {
      border: 'border-indigo-200/70 hover:border-indigo-300',
      bgGlow: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/25',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      orb: 'bg-indigo-400/15',
    },
    purple: {
      border: 'border-purple-200/70 hover:border-purple-300',
      bgGlow: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-purple-500/25',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      orb: 'bg-purple-400/15',
    },
    rose: {
      border: 'border-rose-200/70 hover:border-rose-300',
      bgGlow: 'from-rose-500/10 via-pink-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      orb: 'bg-rose-400/15',
    },
    amber: {
      border: 'border-amber-200/70 hover:border-amber-300',
      bgGlow: 'from-amber-500/10 via-orange-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      orb: 'bg-amber-400/15',
    },
  };

  const theme = themeMap[color] || themeMap.emerald;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-white bg-gradient-to-br ${theme.bgGlow} border ${theme.border} shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${theme.iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-mutedtext font-semibold truncate">{label}</p>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-darktext mt-0.5 tracking-tight">{value}</h3>
        {subtext && <p className="text-[11px] text-mutedtext mt-0.5 truncate font-medium">{subtext}</p>}
      </div>

      {/* Decorative colored glow orb */}
      <div className={`absolute -right-5 -bottom-5 w-20 h-20 rounded-full blur-xl pointer-events-none ${theme.orb}`} />
    </div>
  );
};

export default StatCard;
