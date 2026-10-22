import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  FolderHeart
} from 'lucide-react';
import api from '../../services/api';
import ActionPlanSection from '../../components/counseling/ActionPlanSection';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';

export const ActionPlansPage = () => {
  const [actionPlans, setActionPlans] = useState([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, in_progress: 0, pending: 0 });
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchActionPlans = async () => {
    try {
      const [plansRes, casesRes] = await Promise.all([
        api.get('/action-plans').catch(() => ({ data: { data: [], summary: {} } })),
        api.get('/cases').catch(() => ({ data: [] })),
      ]);

      const plansData = Array.isArray(plansRes.data)
        ? plansRes.data
        : (plansRes.data?.data || (Array.isArray(plansRes) ? plansRes : []));

      const summaryData = plansRes.summary || plansRes.data?.summary || {
        total: plansData.length,
        completed: plansData.filter((i) => i.status === 'COMPLETED').length,
        in_progress: plansData.filter((i) => i.status === 'IN_PROGRESS').length,
        pending: plansData.filter((i) => i.status === 'PENDING').length,
      };

      // Filter out test simulation cases (starting with TEST-)
      const allCases = casesRes.data || [];
      const realCases = allCases.filter((c) => !c.case_number?.startsWith('TEST-'));

      setActionPlans(plansData);
      setSummary(summaryData);
      setCases(realCases.length > 0 ? realCases : allCases);
    } catch (err) {
      console.error('Failed to load action plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlans();
  }, []);

  const latestRealCase = cases.find((c) => !c.case_number?.startsWith('TEST-')) || cases[0] || null;

  return (
    <PageTransition className="w-full max-w-7xl mx-auto space-y-5 py-1">
      {/* 1. Header Banner */}
      <section className="py-4 px-5 sm:py-5 sm:px-6 rounded-3xl bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-white border border-indigo-200/80 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 border-2 border-white">
            <FileCheck2 className="w-6 h-6" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-indigo-800 bg-indigo-100/90 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Dokumentasi Mandiri
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
                Action Plan & Solusi
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Rencana Tindak Lanjut Konseling
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-1">
              Target kebiasaan positif, latihan mandiri, dan komitmen perubahan yang disepakati bersama konselor.
            </p>
          </div>
        </div>

        {/* Quick link to real case if available */}
        {latestRealCase && !latestRealCase.case_number?.startsWith('TEST-') && (
          <div className="shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => navigate(`/app/cases/${latestRealCase.id}`)}
              className="px-4 py-2 rounded-xl bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-800 text-xs font-bold shadow-soft-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FolderHeart className="w-3.5 h-3.5 text-indigo-600" />
              <span>Detail Kasus #{latestRealCase.case_number}</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. Stat Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-soft-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Target</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{summary.total || 0}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            📋
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-soft-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Telah Selesai</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{summary.completed || 0}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-teal-200/90 shadow-soft-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Berjalan</p>
            <p className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5">{summary.in_progress || 0}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-soft-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Menunggu</p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">{summary.pending || 0}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 3. Main Action Plan Section Content */}
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : actionPlans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-soft-xs">
          <EmptyState
            title="Belum Ada Rencana Tindak Lanjut"
            description="Rencana tindak lanjut (Action Plan) dan lembar tugas mandiri akan dirumuskan bersama konselor pada akhir sesi konseling Anda untuk memantau kemajuan harian."
            actionLabel="Jadwalkan Konseling Sekarang"
            onAction={() => navigate('/app/counseling/wizard')}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-soft-sm space-y-4">
          <ActionPlanSection
            actionPlans={actionPlans}
            caseId={latestRealCase?.id}
            canAdd={Boolean(latestRealCase)}
            isTutor={false}
            onUpdated={fetchActionPlans}
          />
        </div>
      )}
    </PageTransition>
  );
};

export default ActionPlansPage;
