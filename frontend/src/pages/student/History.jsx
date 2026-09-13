import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, FolderHeart, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import AppointmentCard from '../../components/cards/AppointmentCard';
import CaseCard from '../../components/cards/CaseCard';
import EmptyState from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

export const History = () => {
  const [activeTab, setActiveTab] = useState('sessions'); // sessions | screenings | cases
  const [sessions, setSessions] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [sessRes, screenRes, caseRes] = await Promise.all([
          api.get('/sessions').catch(() => ({ data: [] })),
          api.get('/questionnaires/history').catch(() => ({ data: [] })),
          api.get('/cases').catch(() => ({ data: [] })),
        ]);
        setSessions(sessRes.data || []);
        setScreenings(screenRes.data || []);
        setCases(caseRes.data || []);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-darktext">Riwayat Layanan</h2>
        <p className="text-xs text-mutedtext mt-0.5">Dokumentasi sesi konseling, kasus, dan hasil screening Anda</p>
      </div>

      {/* Segmented Tab Control */}
      <div className="flex p-1 bg-gray-100 rounded-2xl">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'sessions'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-mutedtext hover:text-darktext'
          }`}
        >
          Sesi Konseling ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('screenings')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'screenings'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-mutedtext hover:text-darktext'
          }`}
        >
          Screening ({screenings.length})
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'cases'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-mutedtext hover:text-darktext'
          }`}
        >
          Kasus BK ({cases.length})
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : activeTab === 'sessions' ? (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <EmptyState
              title="Belum Ada Sesi Konseling"
              description="Jadwal sesi video bimbingan konseling Anda akan tertera di sini."
              actionLabel="Ajukan Konseling Sekarang"
              onAction={() => navigate('/app/counseling/new')}
            />
          ) : (
            sessions.map((session) => (
              <AppointmentCard key={session.id} session={session} isTutor={false} />
            ))
          )}
        </div>
      ) : activeTab === 'screenings' ? (
        <div className="space-y-3">
          {screenings.length === 0 ? (
            <EmptyState
              title="Belum Ada Hasil Screening"
              description="Isi kuesioner screening mandiri untuk memetakan kebutuhan Anda."
              actionLabel="Isi Screening Sekarang"
              onAction={() => navigate('/app/screening')}
            />
          ) : (
            screenings.map((sc) => (
              <div
                key={sc.id}
                onClick={() => navigate(`/app/screening/result/${sc.id}`)}
                className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-darktext line-clamp-1">
                      {sc.questionnaire?.title || 'Screening Kebutuhan BK'}
                    </h4>
                    <p className="text-[11px] text-mutedtext mt-0.5">
                      Diserahkan:{' '}
                      {new Date(sc.submitted_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-teal-700 hidden sm:inline">
                    Lihat Hasil
                  </span>
                  <ChevronRight className="w-4 h-4 text-mutedtext" />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {cases.length === 0 ? (
            <EmptyState
              title="Belum Ada Kasus Konseling"
              description="Pengajuan masalah bimbingan konseling Anda akan tercatat dalam nomor kasus di sini."
              actionLabel="Ajukan Kasus Baru"
              onAction={() => navigate('/app/counseling/new')}
            />
          ) : (
            cases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} basePath="/app/cases" />
            ))
          )}
        </div>
      )}
    </PageTransition>
  );
};

export default History;
