import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Video,
  MessageSquare,
  Building2,
  Filter,
  User,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Lock,
  Phone,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';

export const CounselorsByTopicPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTopicId = searchParams.get('topic_id');

  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId ? parseInt(initialTopicId) : null);
  const [topicInfo, setTopicInfo] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated, user } = useAuth();
  const { startWithTopic, setSelectedCounselor } = useCounselingFlow();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  // 1. Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/topics');
        const list = res.data || [];
        setTopics(list);

        if (!selectedTopicId && list.length > 0) {
          setSelectedTopicId(list[0].id);
          setSearchParams({ topic_id: list[0].id });
        }
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    fetchTopics();
  }, []);

  // 2. Fetch counselors when selectedTopicId changes
  useEffect(() => {
    if (!selectedTopicId) return;

    const fetchCounselors = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/topics/${selectedTopicId}/counselors`);
        setTopicInfo(res.topic);
        setCounselors(res.counselors || []);

        if (res.topic) {
          startWithTopic(res.topic);
        }
      } catch (err) {
        console.error('Failed to load counselors for topic:', err);
        showError('Gagal memuat daftar konselor untuk topik ini.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounselors();
  }, [selectedTopicId, startWithTopic, showError]);

  const handleTopicChange = (id) => {
    setSelectedTopicId(id);
    setSearchParams({ topic_id: id });
  };

  const handleSelectCounselor = (counselor) => {
    setSelectedCounselor(counselor);
    showSuccess(`Konselor ${counselor.name} dipilih.`);

    if (isAuthenticated) {
      // Direct seamlessly to counseling wizard (Step: Asesmen Awal)
      navigate('/app/counseling/wizard');
    } else {
      // Direct to login with redirect flag
      navigate('/login?redirect=/app/counseling/wizard');
    }
  };

  const activeTopic = topicInfo || topics.find((t) => t.id === selectedTopicId);

  return (
    <PageTransition className="min-h-screen bg-[#F6F8FA] flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      {/* 1. Institutional Top Bar */}
      <div className="bg-gradient-to-r from-[#013b29] via-[#046c4e] to-[#013b29] text-white py-2 px-4 sm:px-8 border-b border-emerald-500/30 text-[11px] font-medium z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm" />
            <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
              UINSSC CYBER CAMPUS
            </span>
            <span className="hidden sm:inline text-emerald-200/70">•</span>
            <span className="hidden sm:inline text-emerald-100">
              Layanan Bimbingan & Konseling Terpadu
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-200 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-300" />
              100% Rahasia & Aman
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sticky Header Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Back Button & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Beranda</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 p-0.5 flex items-center justify-center">
                <img src="/logobk.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-black text-[#164C53] tracking-wide uppercase hidden md:inline">
                RUANG BK
              </span>
            </div>
          </div>

          {/* Center: Breadcrumbs */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
            <Link to="/" className="hover:text-emerald-700 font-medium transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-medium text-slate-600">Pilih Konselor</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-bold text-emerald-800 truncate max-w-[220px]">
              {activeTopic?.title || 'Topik Masalah'}
            </span>
          </div>

          {/* Right: Auth Action */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : (user?.role === 'TUTOR' ? '/tutor/dashboard' : '/app/dashboard'))}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-soft-xs flex items-center gap-1.5"
              >
                <span>Dashboard Saya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl border border-emerald-600/30 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all"
              >
                Masuk Akun
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Main Body Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Banner Topic Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#024a35] via-[#047857] to-[#0f766e] text-white p-6 sm:p-8 md:p-10 shadow-soft-md border border-emerald-600/30">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-[11px] font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Jalur Pendampingan Topik Kasus</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Konselor untuk {activeTopic?.title || 'Topik Pilihan'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-2xl">
              Pilih konselor yang sesuai untuk mendampingi Anda. Setiap konselor di bawah ini memiliki kompetensi teruji, berlisensi, dan fokus pendampingan aktif pada topik ini.
            </p>

            {/* Quick Trust Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-emerald-100 font-semibold">
              <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                100% Layanan Resmi Kampus Bebas Biaya
              </span>
              <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10">
                <Lock className="w-3.5 h-3.5 text-teal-300" />
                Kerahasiaan Data Terjamin
              </span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Topic Switcher Pills (Horizontal Scroll) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilih Topik Konsultasi:</span>
            </span>
            <span className="text-[11px] text-mutedtext font-medium hidden sm:inline">
              Klik topik untuk memfilter konselor yang relevan
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {topics.map((tp) => {
              const isSelected = tp.id === selectedTopicId;
              return (
                <button
                  key={tp.id}
                  onClick={() => handleTopicChange(tp.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-soft-xs ring-2 ring-emerald-600/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80'
                  }`}
                >
                  <span>{tp.title}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counselors Grid Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>Daftar Konselor Tersedia ({counselors.length})</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {activeTopic?.title || 'Topik Pilihan'}
            </span>
          </div>

          {isLoading ? (
            <ListSkeleton count={3} />
          ) : counselors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-soft-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Konselor untuk Topik Ini</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Silakan pilih topik bimbingan lainnya di atas atau kembali ke beranda untuk melihat jadwal lengkap konselor kampus.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-soft-xs"
              >
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {counselors.map((counselor, idx) => (
                <motion.div
                  key={counselor.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/60 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Header Photo & Badges */}
                    <div className="relative h-56 sm:h-60 bg-slate-100 overflow-hidden">
                      <img
                        src={
                          counselor.photo ||
                          counselor.avatar ||
                          ((counselor.name?.toLowerCase().includes('nurlina') || counselor.name?.toLowerCase().includes('dian'))
                            ? '/images/counselor_dian.jpg'
                            : (counselor.name?.toLowerCase().includes('bambang')
                              ? '/images/counselor_bambang.jpg'
                              : '/images/counselor_ahmad.jpg'))
                        }
                        alt={counselor.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {/* Top Right: License Badge */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-200 text-[10px] font-bold text-emerald-900 shadow-2xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Berlisensi Resmi</span>
                      </div>

                      {/* Bottom Left: Availability Badge */}
                      {counselor.is_available && (
                        <div className="absolute bottom-3 left-3 bg-emerald-900/90 text-emerald-100 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-emerald-500/30 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Tersedia Pekan Ini</span>
                        </div>
                      )}
                    </div>

                    {/* Counselor Info Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 line-clamp-1 group-hover:text-emerald-900 transition-colors">
                          {counselor.name}
                        </h3>
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5 line-clamp-1">
                          {counselor.specialization}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {counselor.bio || 'Konselor berpengalaman dalam pendampingan kesehatan mental dan akademik mahasiswa.'}
                      </p>

                      {/* Expertise Badges for this Topic */}
                      {counselor.expertise_tags && counselor.expertise_tags.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Keahlian Terkait:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {counselor.expertise_tags.slice(0, 3).map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                              >
                                {tag}
                              </span>
                            ))}
                            {counselor.expertise_tags.length > 3 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                +{counselor.expertise_tags.length - 3} lainnya
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Next Slot Preview */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-700" />
                            <span>Jadwal Terdekat</span>
                          </span>
                          <span className="text-emerald-800 font-bold">
                            {counselor.total_available_slots || 0} Slot
                          </span>
                        </div>
                        {counselor.next_available_slot ? (
                          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>
                              {counselor.next_available_slot.date} • {counselor.next_available_slot.start_time} WIB
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 uppercase font-semibold">
                              {counselor.next_available_slot.method}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic block">Jadwal baru segera dibuka</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/konselor/${counselor.id}?topic_id=${selectedTopicId}`)}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[42px] cursor-pointer"
                    >
                      <span>Lihat Profil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCounselor(counselor)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-soft-xs transition-all flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer"
                    >
                      <span>Pilih Konselor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-mutedtext">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-darktext">Ruang BK Kampus</span>
            <span>•</span>
            <span>Pusat Layanan Bimbingan & Konseling Terpadu</span>
          </div>
          <p>© {new Date().getFullYear()} Universitas Islam Negeri Siber Syekh Nurjati Cirebon</p>
        </div>
      </footer>
    </PageTransition>
  );
};

export default CounselorsByTopicPage;
