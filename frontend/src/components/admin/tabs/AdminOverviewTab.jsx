import React from 'react';
import {
  Users,
  Video,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Globe,
  FolderHeart,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import StatCard from '../../cards/StatCard';

export const AdminOverviewTab = ({
  data,
  settings,
  setActiveTab,
  setUserRoleFilter,
  setCounseleeSubFilter
}) => {
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Admin Control Center Hero Banner */}
      <div className="relative overflow-hidden p-6 md:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white shadow-soft-md border border-emerald-900/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Dashboard Ruang BK
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pantau metrik kasus konseling mahasiswa, kelola akun pengguna & konselor, integrasi Zoom Meeting, dan kepatuhan audit sistem secara terpusat.
            </p>
          </div>

          {/* Quick Navigation Shortcuts */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('users');
                if (setUserRoleFilter) setUserRoleFilter('ALL');
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-between gap-3 min-w-[170px]"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Kelola Pengguna</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('zoom_settings')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-between gap-3 min-w-[170px]"
            >
              <span className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-sky-400" />
                <span>Zoom Meeting</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${settings?.zoom_is_configured ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
                {settings?.zoom_is_configured ? 'Siap' : 'Setup'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('articles')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-between gap-3 min-w-[170px]"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span>Artikel Edukasi</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Glowing background orbs */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Colored Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={GraduationCap}
          label="Konseli Mahasiswa"
          value={stats.total_students || 0}
          subtext="Akun kampus terverifikasi"
          color="emerald"
          badge="Kampus"
          onClick={() => {
            setActiveTab('users');
            if (setUserRoleFilter) setUserRoleFilter('COUNSELEE');
            if (setCounseleeSubFilter) setCounseleeSubFilter('STUDENT');
          }}
        />
        <StatCard
          icon={Globe}
          label="Klien Masyarakat"
          value={stats.total_general || 0}
          subtext="Terdaftar NIK resmi"
          color="purple"
          badge="Umum"
          onClick={() => {
            setActiveTab('users');
            if (setUserRoleFilter) setUserRoleFilter('COUNSELEE');
            if (setCounseleeSubFilter) setCounseleeSubFilter('GENERAL');
          }}
        />
        <StatCard
          icon={FolderHeart}
          label="Kasus Konseling Aktif"
          value={stats.active_cases || 0}
          subtext="Sedang dalam pendampingan"
          color="indigo"
          badge="Berjalan"
        />
        <StatCard
          icon={ShieldAlert}
          label="Deteksi Krisis"
          value={stats.crisis_flag_count || 0}
          subtext="Prioritas penanganan konselor"
          color="rose"
          badge={stats.crisis_flag_count > 0 ? 'Perhatian' : 'Aman'}
          onClick={() => setActiveTab('crisis_settings')}
        />
      </div>

      {/* Recent Audit Logs Snapshot */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Aktivitas Sistem Terkini (Audit)
          </h3>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Lihat Seluruh Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {data?.recent_logs?.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-50 border border-gray-100 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="font-bold text-darktext capitalize px-2 py-0.5 rounded-lg bg-white border border-gray-200">
                  {log.action}
                </span>
                <span className="text-mutedtext">oleh <strong className="text-darktext">{log.user?.name || 'Sistem'}</strong></span>
              </div>
              <span className="text-[10px] text-mutedtext font-mono bg-white px-2 py-0.5 rounded-md border border-gray-100">
                {new Date(log.created_at).toLocaleTimeString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
