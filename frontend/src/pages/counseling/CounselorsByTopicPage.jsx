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
  ExternalLink
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

  const { isAuthenticated } = useAuth();
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
    <PageTransition className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Navbar Minimal */}
      <header className="bg-white border-b border-emerald-100/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
              Pilihan Konselor
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Banner Topic Selected */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#024a35] via-[#047857] to-teal-700 text-white p-6 sm:p-8 shadow-soft-md">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-[11px] font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Jalur Bimbingan Tematik</span>
              {activeTopic?.tag && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="text-amber-300">{activeTopic.tag}</span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
              Konselor untuk {activeTopic?.title || 'Topik Pilihan'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              Pilih konselor yang sesuai untuk mendampingi Anda. Konselor di bawah ini memiliki kompetensi dan fokus pendampingan teruji pada topik ini.
            </p>
          </div>

          {/* Decorative Glow */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Topic Switcher Pills (Horizontal Scroll) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              Ganti Topik Konsultasi:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {topics.map((tp) => {
              const isSelected = tp.id === selectedTopicId;
              return (
                <button
                  key={tp.id}
                  onClick={() => handleTopicChange(tp.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-soft-xs ring-2 ring-emerald-600/30'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
                  }`}
                >
                  <span>{tp.title}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counselors Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Daftar Konselor Tersedia ({counselors.length})
            </h2>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              100% Layanan Resmi Kampus Bebas Biaya
            </span>
          </div>

          {isLoading ? (
            <ListSkeleton count={3} />
          ) : counselors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Belum Ada Konselor untuk Topik Ini</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Silakan pilih topik bimbingan lainnya atau kembali ke beranda untuk melihat seluruh jadwal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {counselors.map((counselor, idx) => (
                <motion.div
                  key={counselor.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/60 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Header Photo & Availability */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={counselor.avatar || (idx === 0 ? '/images/counselor_ahmad.jpg' : '/images/counselor_dian.jpg')}
                        alt={counselor.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-200 text-[10px] font-bold text-emerald-900 shadow-2xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Berlisensi Resmi</span>
                      </div>

                      {counselor.is_available && (
                        <div className="absolute bottom-3 left-3 bg-emerald-900/90 text-emerald-100 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Tersedia Pekan Ini</span>
                        </div>
                      )}
                    </div>

                    {/* Counselor Info Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1 group-hover:text-emerald-900 transition-colors">
                          {counselor.name}
                        </h3>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 line-clamp-1">
                          {counselor.specialization}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {counselor.bio}
                      </p>

                      {/* Expertise Badges for this Topic */}
                      {counselor.expertise_tags && counselor.expertise_tags.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Keahlian Terkait:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {counselor.expertise_tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Slot Preview */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-700" />
                            Jadwal Terdekat
                          </span>
                          <span className="text-emerald-800">
                            {counselor.total_available_slots} Slot
                          </span>
                        </div>
                        {counselor.next_available_slot ? (
                          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>
                              {counselor.next_available_slot.date} • {counselor.next_available_slot.start_time} WIB
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 uppercase">
                              {counselor.next_available_slot.method}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Jadwal baru segera dibuka</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/konselor/${counselor.id}?topic_id=${selectedTopicId}`)}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[42px]"
                    >
                      <span>Lihat Profil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCounselor(counselor)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold shadow-soft-xs transition-all flex items-center justify-center gap-1 min-h-[42px]"
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
    </PageTransition>
  );
};

export default CounselorsByTopicPage;
