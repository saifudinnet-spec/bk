import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Clock,
  FolderHeart,
  Users,
  Video,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import StatCard from '../../components/cards/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import AppointmentCard from '../../components/cards/AppointmentCard';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import CaseReviewModal from '../../components/counseling/CaseReviewModal';

export const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);

  const fetchTutorData = async () => {
    try {
      const [casesRes, sessRes] = await Promise.all([
        api.get('/cases'),
        api.get('/sessions?scope=upcoming'),
      ]);
      const rawCases = casesRes.data?.data || casesRes.data || [];
      const rawSessions = sessRes.data?.data || sessRes.data || [];
      setCases(Array.isArray(rawCases) ? rawCases : []);
      setSessions(Array.isArray(rawSessions) ? rawSessions : []);
    } catch (err) {
      console.error('Failed to load tutor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Filter metrics
  const waitingReview = cases.filter((c) => c.status === 'NEW' || c.status === 'WAITING_REVIEW');
  const activeCases = cases.filter((c) => c.status !== 'CLOSED');
  const followUpCases = cases.filter((c) => c.status === 'FOLLOW_UP');

  return (
    <PageTransition className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={AlertCircle}
          label="Perlu Review"
          value={waitingReview.length}
          subtext="Permohonan baru"
          color="amber"
        />
        <StatCard
          icon={Calendar}
          label="Konseling Hari Ini"
          value={sessions.length}
          subtext="Jadwal aktif"
          color="emerald"
        />
        <StatCard
          icon={FolderHeart}
          label="Kasus Aktif"
          value={activeCases.length}
          subtext="Dalam pendampingan"
          color="teal"
        />
        <StatCard
          icon={Clock}
          label="Follow Up"
          value={followUpCases.length}
          subtext="Perlu evaluasi lanjutan"
          color="purple"
        />
      </div>

      {/* Priority Review Queue */}
      {waitingReview.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-darktext flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Daftar Permohonan Menunggu Review ({waitingReview.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {waitingReview.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-amber-200/80 shadow-soft-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
                    {c.user?.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-darktext">{c.user?.name}</h4>
                      <span className="text-[10px] font-mono text-mutedtext bg-gray-100 px-2 py-0.5 rounded-md">
                        {c.case_number}
                      </span>
                    </div>
                    <p className="text-xs text-mutedtext mt-0.5">
                      Kategori: <strong className="text-darktext">{c.category}</strong> •{' '}
                      {new Date(c.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-xs text-darktext line-clamp-1 mt-1">{c.initial_reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedCaseForReview(c)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft-sm flex items-center justify-center gap-1 min-h-[40px] transition-colors"
                  >
                    <span>Review Permohonan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Sessions Today */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-darktext flex items-center gap-1.5">
            <Video className="w-4 h-4 text-emerald-600" />
            <span>Jadwal Hari Ini & Sesi Mendatang</span>
          </h3>
          <Link to="/tutor/schedule" className="text-xs font-semibold text-emerald-700 hover:underline">
            Atur Jadwal
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-softborder">
            <p className="text-xs text-mutedtext">Tidak ada sesi konseling terjadwal hari ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <AppointmentCard key={s.id} session={s} isTutor={true} />
            ))}
          </div>
        )}
      </section>

      {/* Review Modal */}
      {selectedCaseForReview && (
        <CaseReviewModal
          isOpen={!!selectedCaseForReview}
          caseItem={selectedCaseForReview}
          onClose={() => setSelectedCaseForReview(null)}
          onUpdated={fetchTutorData}
        />
      )}
    </PageTransition>
  );
};

export default TutorDashboard;
