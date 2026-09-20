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
  ShieldAlert,
  MessageSquare,
  Zap,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import StatCard from '../../components/cards/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import AppointmentCard from '../../components/cards/AppointmentCard';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import CaseReviewModal from '../../components/counseling/CaseReviewModal';

export const TutorDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    waiting_review: 0,
    today_sessions: 0,
    active_cases: 0,
    follow_up: 0,
  });
  const [counselorInfo, setCounselorInfo] = useState(null);
  const [waitingCases, setWaitingCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);
  const [isStartingInstant, setIsStartingInstant] = useState(false);
  const [instantMethodType, setInstantMethodType] = useState(null);
  const [activeTestSession, setActiveTestSession] = useState(null);
  const [isTestFeatureEnabled, setIsTestFeatureEnabled] = useState(true);

  const handleStartInstantSession = async (method, forceNew = false) => {
    setIsStartingInstant(true);
    setInstantMethodType(method);
    try {
      const res = await api.post('/sessions/instant', { method, force_new: forceNew });
      const sessionData = res.data?.data || res.data;
      showSuccess(res.message || `Sesi ${method === 'ZOOM' ? 'Zoom' : 'Chat'} instan berhasil disiapkan! Mengalihkan ke ruang konseling...`);
      navigate(`/counseling/session/${sessionData.id}`);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal memulai sesi instan.');
    } finally {
      setIsStartingInstant(false);
      setInstantMethodType(null);
    }
  };

  const fetchTutorData = async () => {
    try {
      const res = await api.get('/tutor/dashboard');
      if (res && res.metrics) {
        setMetrics(res.metrics);
        setWaitingCases(res.waiting_cases || []);
        setSessions(res.upcoming_sessions || []);
        setActiveTestSession(res.active_test_session || null);
        if (res.zoom_test_feature_enabled !== undefined) {
          setIsTestFeatureEnabled(Boolean(res.zoom_test_feature_enabled));
        }
        if (res.counselor) {
          setCounselorInfo(res.counselor);
        }
      }
    } catch (err) {
      // Silently fail — user will see empty state UI
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

  // Resolve counselor photo
  const counselorPhoto =
    counselorInfo?.avatar ||
    user?.avatar ||
    user?.profile?.photo ||
    (user?.name?.toLowerCase().includes('nurlina') || user?.name?.toLowerCase().includes('dian')
      ? '/images/counselor_dian.jpg'
      : user?.name?.toLowerCase().includes('bambang')
        ? '/images/counselor_bambang.jpg'
        : '/images/counselor_ahmad.jpg');

  return (
    <PageTransition className="space-y-6">
      {/* 1. Tutor Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-emerald-800 to-slate-950 text-white p-6 sm:p-7 shadow-soft-md border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl overflow-hidden ring-4 ring-emerald-400/30 border-2 border-white/30 shadow-xl shadow-emerald-950/50 shrink-0 bg-slate-900 relative">
              <img
                src={counselorPhoto}
                alt={user?.name || 'Konselor'}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/counselor_ahmad.jpg';
                }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md">
                  🧑‍🏫 Konselor
                </span>
                {counselorInfo?.specialization && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium border border-white/15 backdrop-blur-md truncate max-w-sm">
                    {counselorInfo.specialization}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                {user?.name || 'Konselor'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0">
            <Link
              to="/tutor/schedule"
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-md shadow-black/10 transition-all flex items-center justify-center gap-2 min-h-[42px]"
            >
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Atur Jadwal Konseling</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] text-emerald-200 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold">Siap Melayani Konseling</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow orbs */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 1.5 Quick Instant Testing Bar for Tutor (Hanya tampil jika diaktifkan admin) */}
      {isTestFeatureEnabled && (
        <section className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white shadow-soft-md border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-52 h-52 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Notifikasi Sesi Uji Coba yang Sedang Berjalan (Multi-Device Sync Banner) */}
          {activeTestSession && (
            <div className="relative z-10 mb-4 p-3.5 sm:p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs sm:text-sm font-black text-emerald-200 flex items-center gap-1.5 flex-wrap">
                    <span>🟢 Sesi Uji {activeTestSession.method === 'ZOOM' ? 'Zoom' : 'Chat'} Sedang Aktif</span>
                    <span className="font-mono text-[11px] bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-400/30 text-emerald-300">
                      ID #{activeTestSession.id}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-300 truncate">
                    {activeTestSession.user?.name ? `Mahasiswa: ${activeTestSession.user.name}.` : 'Ruang pengujian terbuka.'} Klik tombol untuk langsung terhubung ke ruang konseling yang sama dari laptop ini.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/counseling/session/${activeTestSession.id}`)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Masuk ke Sesi #{activeTestSession.id}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartInstantSession(activeTestSession.method || 'CHAT', true)}
                  className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl transition-all"
                  title="Tutup sesi lama dan mulai sesi simulasi baru"
                >
                  + Baru
                </button>
              </div>
            </div>
          )}

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Uji Coba Ruang Chat atau Video Zoom sebagai Konselor
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mulai sesi simulasi langsung tanpa menunggu jadwal temu mahasiswa. Anda dapat memeriksa fungsionalitas ruang interaktif secara langsung antar-laptop.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              {/* Tombol Chat Sekarang */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={isStartingInstant}
                onClick={() => handleStartInstantSession('CHAT')}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 min-h-[46px]"
              >
                {isStartingInstant && instantMethodType === 'CHAT' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyiapkan Chat...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-emerald-100" />
                    <span>💬 {activeTestSession?.method === 'CHAT' ? `Gabung Chat #${activeTestSession.id}` : 'Uji Chat Sekarang'}</span>
                  </>
                )}
              </motion.button>

              {/* Tombol Zoom Sekarang */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={isStartingInstant}
                onClick={() => handleStartInstantSession('ZOOM')}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 min-h-[46px]"
              >
                {isStartingInstant && instantMethodType === 'ZOOM' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyiapkan Zoom...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-teal-100" />
                    <span>📹 {activeTestSession?.method === 'ZOOM' ? `Gabung Zoom #${activeTestSession.id}` : 'Uji Zoom Sekarang'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Vibrant Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={AlertCircle}
          label="Perlu Review"
          value={metrics.waiting_review}
          subtext="Permohonan baru masuk"
          color="amber"
          badge={metrics.waiting_review > 0 ? 'Prioritas' : 'Nihil'}
        />
        <StatCard
          icon={Calendar}
          label="Konseling Hari Ini"
          value={metrics.today_sessions}
          subtext="Jadwal aktif terdaftar"
          color="emerald"
          badge="Jadwal"
        />
        <StatCard
          icon={FolderHeart}
          label="Kasus Aktif"
          value={metrics.active_cases}
          subtext="Dalam pendampingan"
          color="indigo"
          badge="Berjalan"
        />
        <StatCard
          icon={Clock}
          label="Follow Up"
          value={metrics.follow_up}
          subtext="Perlu evaluasi lanjutan"
          color="purple"
          badge="Evaluasi"
        />
      </div>

      {/* 3. Priority Review Queue */}
      {waitingCases.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-950">Permohonan Konseling Menunggu Review ({metrics.waiting_review})</span>
            </h3>
            <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Konfirmasi metode & jadwal
            </span>
          </div>

          <div className="space-y-3">
            {waitingCases.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-3xl bg-white border-l-4 border-l-amber-500 border border-amber-200/80 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 text-amber-800 font-black flex items-center justify-center text-base shrink-0 border border-amber-200 shadow-sm">
                    {c.user?.name?.charAt(0) || 'K'}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-darktext hover:text-emerald-800 transition-colors">
                        {c.user?.name}
                      </h4>
                      <span className="text-[10px] font-mono text-mutedtext bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                        {c.case_number}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        {c.category || 'Konseling'}
                      </span>
                    </div>

                    <p className="text-xs text-mutedtext">
                      Diajukan pada: <strong className="text-darktext">{new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </p>

                    {c.initial_reason && (
                      <p className="text-xs text-darktext/90 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 line-clamp-2">
                        "{c.initial_reason}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCaseForReview(c)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 min-h-[42px] transition-all hover:scale-[1.02]"
                  >
                    <span>Review & Konfirmasi Kasus</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Upcoming Sessions Schedule Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span>Jadwal Sesi Konseling Mendatang</span>
          </h3>
          <Link
            to="/tutor/schedule"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
          >
            <span>Kelola Slot Jadwal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-softborder space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-darktext">Tidak ada sesi konseling aktif terjadwal saat ini</p>
            <p className="text-[11px] text-mutedtext max-w-sm mx-auto">
              Pastikan slot waktu ketersediaan Anda sudah disetel agar konseli dapat memilih jadwal temu tatap muka atau video call Zoom.
            </p>
            <Link
              to="/tutor/schedule"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition-colors"
            >
              <span>Atur Waktu Konseling</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <AppointmentCard key={s.id} session={s} isTutor={true} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Quick Tools & Resources */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-2">
        <Link
          to="/tutor/schedule"
          className="p-5 rounded-3xl bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 border border-teal-100 hover:border-teal-300 shadow-soft-sm hover:shadow-soft-md transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext group-hover:text-teal-800 transition-colors">
            Kalender & Slot Konseling
          </h4>
          <p className="text-[11px] text-mutedtext mt-1">
            Atur jam kerja konseling online (Zoom) dan tatap muka offline di kampus.
          </p>
        </Link>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100 shadow-soft-sm">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3">
            <FolderHeart className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext">
            Catatan & Rencana Kasus
          </h4>
          <p className="text-[11px] text-mutedtext mt-1">
            Catat hasil observasi, diagnosa awal bimbingan, dan evaluasi berkala konseli.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border border-amber-100 shadow-soft-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-darktext">
            Protokol Darurat & Krisis
          </h4>
          <p className="text-[11px] text-mutedtext mt-1">
            Panduan rujukan darurat ke psikolog klinis / psikiater bila terdeteksi risiko tinggi.
          </p>
        </div>
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
