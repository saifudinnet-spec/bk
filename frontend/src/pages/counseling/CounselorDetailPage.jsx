import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Video,
  MessageSquare,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  HeartHandshake,
  MapPin,
  Check,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export const CounselorDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedTopicId = searchParams.get('topic_id');

  const [counselor, setCounselor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [selectedTopic, setLocalSelectedTopic] = useState(null);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customTopicText, setCustomTopicText] = useState('');

  const topicPickerRef = useRef(null);
  const { isAuthenticated, user } = useAuth();
  const { startWithCounselor, setSelectedTopic } = useCounselingFlow();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const res = await api.get(`/tutors/public/${id}`);
        const data = res.data;
        setCounselor(data);
        startWithCounselor(data);

        // Pre-select topic if passed via query param
        if (preselectedTopicId && data?.topics) {
          const match = data.topics.find((t) => t.id === parseInt(preselectedTopicId));
          if (match) {
            setLocalSelectedTopic(match);
          }
        }
      } catch (err) {
        console.error('Failed to load counselor:', err);
        showError('Gagal memuat detail profil konselor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounselor();
  }, [id, preselectedTopicId, startWithCounselor, showError]);

  const handleOpenTopicPicker = () => {
    setShowTopicPicker(true);
    setTimeout(() => {
      topicPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const handleProceedWithTopic = () => {
    if (isOtherSelected) {
      if (!customTopicText.trim()) {
        showError('Silakan tuliskan topik yang ingin Anda konsultasikan.');
        return;
      }
      setSelectedTopic({ id: null, title: customTopicText.trim(), tag: 'Lainnya' }, customTopicText.trim());
    } else {
      if (!selectedTopic) {
        showError('Silakan pilih salah satu topik bimbingan konseling.');
        return;
      }
      setSelectedTopic(selectedTopic);
    }

    showSuccess('Topik dan Konselor berhasil dipilih.');

    if (isAuthenticated) {
      navigate('/app/counseling/wizard');
    } else {
      navigate('/login?redirect=/app/counseling/wizard');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <CardSkeleton height="h-96" />
      </div>
    );
  }

  if (!counselor) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto my-12">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Konselor Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1">Profil konselor yang Anda cari mungkin sedang tidak aktif.</p>
        <Link
          to="/"
          className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-soft-xs"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kembali</span>
          </button>

          {/* Breadcrumb / Page Title */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Link to="/" className="hover:text-emerald-700 font-medium transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link to="/konselor" className="hover:text-emerald-700 font-medium transition-colors">
              Daftar Konselor
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-bold text-slate-800 truncate max-w-[200px]">
              {counselor.name}
            </span>
          </div>

          <div className="sm:hidden text-xs font-bold text-slate-800 truncate max-w-[180px]">
            Profil Konselor
          </div>

          {/* Auth Action */}
          <div>
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
              >
                Masuk Akun
              </Link>
            ) : (
              <Link
                to="/app"
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Counselor Hero Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm overflow-hidden">
          {/* Gradient Banner */}
          <div className="bg-gradient-to-r from-[#024a35] via-[#047857] to-teal-700 h-36 sm:h-44 relative px-6 py-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">
                Layanan Bimbingan Konseling Aktif
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Psikolog / Konselor Resmi UINSSC</span>
            </div>
          </div>

          {/* Profile Header Content (Cleanly below banner, no overlapping text bugs!) */}
          <div className="px-6 sm:px-8 pb-8 pt-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              {/* Left: Avatar + Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                {/* Avatar with negative margin applied strictly to avatar only */}
                <div className="-mt-16 sm:-mt-20 shrink-0 relative z-10">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white p-2 shadow-xl ring-4 ring-white border border-slate-200/90 overflow-hidden">
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
                      className="w-full h-full object-cover object-top rounded-2xl"
                    />
                  </div>
                </div>

                {/* Information: Sits cleanly on the white background */}
                <div className="pt-2 sm:pt-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Layanan 100% Bebas Biaya</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Konselor Terverifikasi
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {counselor.name}
                  </h1>

                  <p className="text-sm sm:text-base font-semibold text-emerald-800">
                    {counselor.specialization}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-slate-500 pt-1">
                    {counselor.nip && (
                      <span className="font-mono bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] font-medium text-slate-700">
                        NIP / NIDN: {counselor.nip}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{counselor.service_days || 'Senin – Jumat (08:30 – 16:00 WIB)'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Prominent & Clean CTA Button */}
              <div className="shrink-0 flex flex-col sm:items-end w-full lg:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenTopicPicker}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 flex items-center justify-center gap-2.5 transition-all min-h-[48px]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Mulai Konseling Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <p className="text-[11px] text-slate-500 mt-2 text-center sm:text-right flex items-center justify-center sm:justify-end gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pilih topik & jadwalkan sesi privat</span>
                </p>
              </div>
            </div>

            {/* Counselor Detailed Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                <div className="space-y-2 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tentang Konselor</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {counselor.bio}
                  </p>
                </div>

                {/* Topics Handled by this Counselor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Topik & Bidang Keahlian ({counselor.topics?.length || 0})</span>
                    </h2>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Dapat dipilih untuk konseling
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {counselor.topics?.map((tp) => (
                      <div
                        key={tp.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-soft-xs hover:border-emerald-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">{tp.title}</span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {tp.tag}
                          </span>
                        </div>
                        {tp.expertise_tags && tp.expertise_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {tp.expertise_tags.map((ext, extIdx) => (
                              <span
                                key={extIdx}
                                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                              >
                                {ext}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info: Methods & Service Days */}
              <div className="space-y-4">
                {/* Methods Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200/90 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pilihan Metode Konseling</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-emerald-100 shadow-soft-xs">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Chat Konseling</p>
                        <p className="text-[10px] text-slate-500">Percakapan teks privat</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-emerald-100 shadow-soft-xs">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Video Konseling (Zoom)</p>
                        <p className="text-[10px] text-slate-500">Sesi tatap maya interaktif</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-emerald-100 shadow-soft-xs">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Tatap Muka Langsung</p>
                        <p className="text-[10px] text-slate-500">Ruang Konseling Kampus</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Schedule */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft-xs space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Jadwal Pelayanan</span>
                  </h3>
                  <p className="text-xs text-slate-700 font-semibold">
                    {counselor.service_days || 'Senin – Jumat (08:30 – 16:00 WIB)'}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{counselor.location_info || 'Ruang Konseling Gedung Pusat Mahasiswa Lt. 2'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: "Apa yang ingin Anda konsultasikan?" (Jalur B Topic Selection) */}
        <div ref={topicPickerRef}>
          <AnimatePresence>
            {showTopicPicker && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-emerald-500/60 shadow-xl space-y-6 ring-4 ring-emerald-500/10"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Langkah 1: Tentukan Topik Pembahasan</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Apa yang ingin Anda konsultasikan bersama {counselor.name.split(',')[0]}?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Pilih topik yang sesuai dengan keahlian konselor ini, atau pilih "Topik Lainnya" jika ada permasalahan spesifik yang ingin Anda sampaikan.
                  </p>
                </div>

                {/* Topics Grid Filtered for this Counselor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {counselor.topics?.map((tp) => {
                    const isSelected = !isOtherSelected && selectedTopic?.id === tp.id;
                    return (
                      <div
                        key={tp.id}
                        onClick={() => {
                          setLocalSelectedTopic(tp);
                          setIsOtherSelected(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-soft-xs'
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="space-y-1 pr-3">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                            {tp.title}
                          </span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">
                            Kategori: {tp.tag}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-slate-300 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Option "Lainnya" */}
                  <div
                    onClick={() => {
                      setIsOtherSelected(true);
                      setLocalSelectedTopic(null);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isOtherSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-soft-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="space-y-0.5 pr-3">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                        + Topik Lainnya
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Tuliskan permasalahan spesifik di luar kategori di atas
                      </span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                        isOtherSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Custom Topic Input if "Lainnya" is selected */}
                {isOtherSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <label className="block text-xs font-bold text-slate-700">
                      Tuliskan topik yang ingin Anda konsultasikan:
                    </label>
                    <input
                      type="text"
                      value={customTopicText}
                      onChange={(e) => setCustomTopicText(e.target.value)}
                      placeholder="Contoh: Kesulitan adaptasi pergaulan dan rasa cemas di asrama kampus..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </motion.div>
                )}

                {/* Submit Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500 text-center sm:text-left">
                    {!isAuthenticated ? (
                      <span>Anda akan diarahkan ke login/register dengan pilihan topik yang tetap tersimpan.</span>
                    ) : (
                      <span>Langkah selanjutnya: Mengisi formulir Asesmen Awal kondisi Anda.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedWithTopic}
                    className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-soft-xs flex items-center justify-center gap-2 transition-all min-h-[46px]"
                  >
                    <span>Lanjutkan Konseling</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </PageTransition>
  );
};

export default CounselorDetailPage;
