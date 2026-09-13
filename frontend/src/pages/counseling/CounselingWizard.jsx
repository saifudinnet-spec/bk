import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Building2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  MapPin,
  Loader2,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';
import VirtualGuide from '../../components/guidance/VirtualGuide';
import GuidedAssessment from '../../components/counseling/GuidedAssessment';

const steps = [
  { id: 1, title: 'Asesmen Awal', short: 'Asesmen' },
  { id: 2, title: 'Pilih Metode', short: 'Metode' },
  { id: 3, title: 'Pilih Jadwal', short: 'Jadwal' },
  { id: 4, title: 'Konfirmasi', short: 'Konfirmasi' },
];

export const CounselingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const {
    selectedTopic,
    selectedCounselor,
    customTopic,
    selectedMethod,
    selectedSlot,
    setSelectedMethod,
    setSelectedSlot,
    resetFlow,
  } = useCounselingFlow();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State for Asesmen Awal (collected via GuidedAssessment)
  const [assessmentData, setAssessmentData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ruangbk_guided_assessment_draft_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          topic: parsed.topic || '',
          main_issue: parsed.mainIssue === 'Lainnya' ? parsed.customMainIssue : parsed.mainIssue,
          duration: parsed.duration || '1–4 minggu',
          impact_level: parsed.impactLevel || 3,
          previous_efforts: parsed.previousEfforts || '-',
          story: parsed.story || '',
        };
      }
    } catch (e) {
      console.warn('Failed to parse assessment draft:', e);
    }
    return null;
  });

  const [mainIssue, setMainIssue] = useState('');
  const [customMainIssue, setCustomMainIssue] = useState('');
  const [duration, setDuration] = useState('1–4 minggu');
  const [impactLevel, setImpactLevel] = useState(3);
  const [previousEfforts, setPreviousEfforts] = useState('');
  const [story, setStory] = useState('');

  // Schedule Slots State
  const [groupedSlots, setGroupedSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Guard: If topic or counselor is missing, redirect user to landing or topics page
  useEffect(() => {
    if (!selectedTopic || !selectedCounselor) {
      navigate('/konselor');
    }
  }, [selectedTopic, selectedCounselor, navigate]);

  const activeTopicTitle = selectedTopic?.title || customTopic || 'Bimbingan Umum';

  // Fetch slots whenever method or counselor changes
  useEffect(() => {
    if (!selectedCounselor?.id) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const res = await api.get(`/tutors/${selectedCounselor.id}/slots?method=${selectedMethod}`);
        const grouped = res.grouped_by_date || {};
        setGroupedSlots(grouped);

        const dates = Object.keys(grouped);
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        } else {
          setSelectedDate('');
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedCounselor?.id, selectedMethod]);

  // Guided Assessment Completion Handler
  const handleGuidedAssessmentComplete = (payload) => {
    setAssessmentData(payload);
    setMainIssue(payload.main_issue);
    setDuration(payload.duration);
    setImpactLevel(payload.impact_level);
    setPreviousEfforts(payload.previous_efforts);
    setStory(payload.story);
    setCurrentStep(2);
  };

  const handleNextFromMethod = () => {
    if (!selectedMethod) {
      showError('Silakan pilih salah satu metode konseling.');
      return;
    }
    setCurrentStep(3);
  };

  const handleNextFromSchedule = () => {
    if (!selectedSlot) {
      showError('Silakan pilih jam konseling yang tersedia.');
      return;
    }
    setCurrentStep(4);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalPayload = assessmentData || {
        topic: activeTopicTitle,
        main_issue: mainIssue === 'Lainnya' ? customMainIssue.trim() : mainIssue,
        duration: duration,
        impact_level: impactLevel,
        previous_efforts: previousEfforts.trim() || '-',
        story: story.trim(),
      };

      const response = await api.post('/cases', {
        topic_id: selectedTopic?.id || null,
        custom_topic: customTopic || null,
        category: activeTopicTitle,
        method: selectedMethod,
        tutor_id: selectedCounselor.id,
        availability_id: selectedSlot ? selectedSlot.id : null,
        assessment_answers: finalPayload,
        initial_reason: finalPayload.story || story.trim(),
      });

      // Clear draft storage
      try {
        sessionStorage.removeItem('ruangbk_guided_assessment_draft_v1');
      } catch (e) {}

      // Set booking success data to display confirmation screen
      setBookingSuccessData({
        case: response.case || response.data || null,
        counselor: selectedCounselor,
        topic: activeTopicTitle,
        method: selectedMethod,
        slot: selectedSlot,
        date: selectedSlot?.date,
        time: `${selectedSlot?.start_time?.substring(0, 5)} – ${selectedSlot?.end_time?.substring(0, 5)} WIB`,
      });

      showSuccess('Pengajuan konseling berhasil dikirim! Menunggu konfirmasi konselor.');
    } catch (err) {
      showError(err.message || 'Gagal mengirimkan pengajuan konseling.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedTopic || !selectedCounselor) {
    return null;
  }

  const availableDates = Object.keys(groupedSlots);
  const slotsForActiveDate = selectedDate ? groupedSlots[selectedDate] || [] : [];

  const formatSlotDateBadge = (dateStr) => {
    if (!dateStr) return { dayName: '', dayDate: '', fullDate: '' };
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return {
          dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          dayDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          fullDate: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        };
      }
    } catch (e) {
      // fallback
    }
    return { dayName: '', dayDate: dateStr, fullDate: dateStr };
  };

  // BOOKING SUCCESS CONFIRMATION SCREEN (Section 18 of prompt)
  if (bookingSuccessData) {
    return (
      <PageTransition className="max-w-2xl mx-auto py-6 space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-soft-sm text-center space-y-6">
          {/* Nara avatar with greeting */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <VirtualGuide mode="avatar" expression="positive" size="lg" />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Nara • Pemandu Ruang BK</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Jadwal Anda sudah dibuat!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Konselor akan memeriksa pengajuan Anda. Notifikasi konfirmasi akan kami kirimkan ke dashboard Anda.
              </p>
            </div>
          </div>

          {/* Ticket / Booking Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Konselor</span>
                <span className="text-sm font-black text-slate-900">{bookingSuccessData.counselor.name}</span>
                <span className="text-xs text-emerald-800 font-semibold block">{bookingSuccessData.counselor.specialization}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Topik</span>
                <span className="text-xs font-bold text-slate-900">{bookingSuccessData.topic}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-semibold">Metode Konseling</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {bookingSuccessData.method === 'CHAT' && 'Chat Konseling'}
                  {bookingSuccessData.method === 'ZOOM' && 'Video Konseling (Zoom)'}
                  {bookingSuccessData.method === 'OFFLINE' && 'Tatap Muka Langsung'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-semibold">Jadwal Sesi</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {bookingSuccessData.date} • {bookingSuccessData.time}
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Status Sesi:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Menunggu Konfirmasi Konselor
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetFlow();
              navigate('/app');
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-bold text-xs sm:text-sm shadow-soft-sm flex items-center justify-center gap-2 mx-auto transition-transform hover:scale-[1.01]"
          >
            <span>Buka Dashboard Mahasiswa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-2.5 sm:space-y-3 pb-1 sm:pb-2">
      {/* Compact Unified Wizard Top Bar */}
      <div className="bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep((s) => s - 1);
              } else {
                navigate(-1);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2 min-w-0 px-1 text-center truncate">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Pengajuan Konseling
            </h1>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 truncate hidden sm:inline">
              {activeTopicTitle} ({selectedCounselor.name.split(',')[0]})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Batalkan pengajuan konseling saat ini?')) {
                resetFlow();
                navigate('/app');
              }
            }}
            className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-colors shrink-0"
          >
            Batal
          </button>
        </div>

        {/* Compact Progress Stepper */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
          {steps.map((step, idx) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : step.id}
                  </div>
                  <span
                    className={`text-[11px] font-bold hidden sm:inline ${
                      isCurrent
                        ? 'text-emerald-950 font-black'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1.5 transition-colors ${
                      currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">

        {/* STEP 1: GUIDED CONVERSATIONAL SCREENING (NARA) */}
        {currentStep === 1 && (
          <GuidedAssessment
            selectedTopic={selectedTopic}
            selectedCounselor={selectedCounselor}
            customTopic={customTopic}
            onComplete={handleGuidedAssessmentComplete}
            onCancel={() => navigate('/konselor')}
          />
        )}

        {/* STEP 2: PILIH METODE KONSELING */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5"
          >
            {/* Main Section Header */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200/70">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Langkah 2: Pilih Metode</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Format Pertemuan Konseling
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Pilih metode pertemuan yang membuat Anda paling nyaman. Semua sesi dilakukan secara privat dan terjaga kerahasiaannya.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 text-xs font-bold shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Privat & Rahasia</span>
              </div>
            </div>

            {/* 3-Column Responsive Grid (Proportional 1 Screen View) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card A: CHAT */}
              <div
                onClick={() => setSelectedMethod('CHAT')}
                className={`relative p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMethod === 'CHAT'
                    ? 'bg-emerald-50/80 border-emerald-600 shadow-soft-sm ring-2 ring-emerald-600/20'
                    : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        selectedMethod === 'CHAT'
                          ? 'bg-emerald-600 text-white shadow-soft-xs'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                        selectedMethod === 'CHAT'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1">
                    Chat Konseling
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Konsultasi interaktif melalui ruang obrolan teks privat bersama konselor pada jadwal yang ditentukan.
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Paling Fleksibel & Santai</span>
                </div>
              </div>

              {/* Card B: VIDEO (ZOOM) */}
              <div
                onClick={() => setSelectedMethod('ZOOM')}
                className={`relative p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMethod === 'ZOOM'
                    ? 'bg-emerald-50/80 border-emerald-600 shadow-soft-sm ring-2 ring-emerald-600/20'
                    : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        selectedMethod === 'ZOOM'
                          ? 'bg-emerald-600 text-white shadow-soft-xs'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                        selectedMethod === 'ZOOM'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1">
                    Video Konseling (Zoom)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Konsultasi online tatap maya via Zoom yang terintegrasi langsung dari web bersama konselor.
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Tatap Maya Interaktif</span>
                </div>
              </div>

              {/* Card C: OFFLINE (TATAP MUKA) */}
              <div
                onClick={() => setSelectedMethod('OFFLINE')}
                className={`relative p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMethod === 'OFFLINE'
                    ? 'bg-emerald-50/80 border-emerald-600 shadow-soft-sm ring-2 ring-emerald-600/20'
                    : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        selectedMethod === 'OFFLINE'
                          ? 'bg-emerald-600 text-white shadow-soft-xs'
                          : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                        selectedMethod === 'OFFLINE'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1">
                    Tatap Muka Langsung
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Konsultasi fisik langsung bersama konselor di Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2 Kampus.
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Sesi Tatap Muka di Kampus</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Asesmen</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromMethod}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-soft-xs flex items-center justify-center gap-2 min-h-[42px] cursor-pointer transition-all hover:scale-102 active:scale-98"
              >
                <span>Lanjut: Pilih Jadwal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PILIH JADWAL */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 sm:space-y-3.5"
          >
            {/* Main Section Header */}
            <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200/70">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>Langkah 3: Pilih Jadwal</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Pilih Jadwal Konseling
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed truncate sm:whitespace-normal">
                  Pilih waktu temu bersama <span className="font-bold text-slate-800">{selectedCounselor.name}</span> sesuai ketersediaan slot.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700">
                  {selectedMethod === 'ZOOM' ? (
                    <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : selectedMethod === 'CHAT' ? (
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  )}
                  <span>
                    Metode:{' '}
                    <strong className="text-slate-900 uppercase">
                      {selectedMethod === 'ZOOM' ? 'Zoom Video' : selectedMethod === 'CHAT' ? 'Chat' : 'Tatap Muka'}
                    </strong>
                  </span>
                </div>
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Jadwal Real-Time</span>
                </div>
              </div>
            </div>

            {isLoadingSlots ? (
              <div className="p-8 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-soft-xs">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Memuat slot jadwal ketersediaan konselor...</p>
              </div>
            ) : availableDates.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-soft-xs space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Slot Belum Tersedia untuk Metode Ini</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Konselor belum membuka slot untuk metode {selectedMethod} pada pekan ini. Anda dapat mencoba metode lain seperti Zoom atau Chat.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Ganti Pilihan Metode
                </button>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-soft-xs space-y-3 sm:space-y-3.5">
                {/* Date Selector Row */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pilih Tanggal Sesi</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {availableDates.length} Tanggal Tersedia
                    </span>
                  </div>

                  {/* Horizontal Date Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                    {availableDates.map((dateStr) => {
                      const isSelected = selectedDate === dateStr;
                      const dateMeta = formatSlotDateBadge(dateStr);
                      const slotCount = groupedSlots[dateStr]?.length || 0;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setSelectedSlot(null);
                          }}
                          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold shrink-0 transition-all flex flex-col items-center min-w-[85px] sm:min-w-[95px] border cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-soft-xs ring-2 ring-emerald-600/20'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {dateMeta.dayName || 'TGL'}
                          </span>
                          <span className="text-xs sm:text-sm font-black my-0.5">
                            {dateMeta.dayDate || dateStr}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-emerald-800/90 text-emerald-100' : 'bg-slate-200/70 text-slate-600'
                          }`}>
                            {slotCount} Slot
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Time Slots Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        Jam Pertemuan Tersedia ({selectedDate ? formatSlotDateBadge(selectedDate).fullDate : ''})
                      </span>
                    </div>
                    {selectedSlot && (
                      <span className="hidden sm:inline-flex text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                        Dipilih: {selectedSlot.start_time?.substring(0, 5)} – {selectedSlot.end_time?.substring(0, 5)} WIB
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
                    {slotsForActiveDate.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      const isBooked = slot.status === 'BOOKED';
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-center transition-all cursor-pointer ${
                            isBooked
                              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-soft-xs ring-2 ring-emerald-600/30'
                              : 'bg-white border-slate-200/90 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-black tracking-tight">
                            {slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                          </div>
                          <div className={`text-[10px] mt-0.5 font-bold ${
                            isSelected ? 'text-emerald-100' : isBooked ? 'text-slate-400' : 'text-emerald-600'
                          }`}>
                            {isBooked ? 'Penuh' : isSelected ? '✓ Terpilih' : 'Tersedia'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Metode</span>
              </button>

              <div className="flex items-center gap-3">
                {selectedSlot && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-slate-400">Jadwal:</span>
                    <span className="font-bold text-slate-800">
                      {formatSlotDateBadge(selectedDate).dayDate}, {selectedSlot.start_time?.substring(0, 5)} – {selectedSlot.end_time?.substring(0, 5)} WIB
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={handleNextFromSchedule}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-soft-xs flex items-center gap-2 cursor-pointer transition-all hover:shadow-md"
                >
                  <span>Lanjut: Konfirmasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: KONFIRMASI */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 sm:space-y-3.5"
          >
            {/* Main Section Header */}
            <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200/70">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Langkah 4: Konfirmasi Akhir</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Konfirmasi Pengajuan Konseling
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Tinjau ringkasan konsultasi Anda bersama <span className="font-bold text-slate-800">{selectedCounselor.name}</span> sebelum dikirimkan.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 text-xs font-bold shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Privat & Terenkripsi</span>
              </div>
            </div>

            {/* Summary Details Card */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-soft-xs space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Konselor Pendamping
                  </span>
                  <p className="text-sm font-black text-slate-900">{selectedCounselor.name}</p>
                  <p className="text-xs text-emerald-800 font-semibold">{selectedCounselor.specialization}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Topik Konsultasi
                  </span>
                  <p className="text-sm font-black text-slate-900">{activeTopicTitle}</p>
                  <p className="text-xs text-slate-500 font-medium">Kategori: {selectedTopic?.tag || 'Spesifik'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Metode Konseling
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedMethod === 'CHAT' && <MessageSquare className="w-4 h-4 text-emerald-700" />}
                    {selectedMethod === 'ZOOM' && <Video className="w-4 h-4 text-blue-600" />}
                    {selectedMethod === 'OFFLINE' && <Building2 className="w-4 h-4 text-purple-600" />}
                    <span className="text-xs font-bold text-slate-800">
                      {selectedMethod === 'CHAT' && 'Chat Konseling'}
                      {selectedMethod === 'ZOOM' && 'Video Konseling (Zoom)'}
                      {selectedMethod === 'OFFLINE' && 'Tatap Muka Langsung'}
                    </span>
                  </div>
                  {selectedMethod === 'OFFLINE' && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gedung Pusat Mahasiswa Lt. 2, Ruang Layanan BK
                    </p>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jadwal Pertemuan
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {selectedSlot?.date ? formatSlotDateBadge(selectedSlot.date).fullDate : selectedSlot?.date} • {selectedSlot?.start_time?.substring(0, 5)} – {selectedSlot?.end_time?.substring(0, 5)} WIB
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                    Slot Terkonfirmasi
                  </span>
                </div>
              </div>

              {/* Assessment Summary */}
              <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Ringkasan Asesmen Awal Anda
                </h4>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <span className="font-semibold text-slate-700">Kendala Utama:</span>{' '}
                    {assessmentData?.main_issue || (mainIssue === 'Lainnya' ? customMainIssue : mainIssue)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Durasi:</span>{' '}
                    {assessmentData?.duration || duration} •{' '}
                    <span className="font-semibold text-slate-700">Tingkat Gangguan:</span>{' '}
                    <span className="font-bold text-slate-900">{assessmentData?.impact_level || impactLevel}/5</span>
                  </p>
                  <p className="line-clamp-2">
                    <span className="font-semibold text-slate-700">Pesan Awal:</span> "{assessmentData?.story || story}"
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Jadwal</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-soft-sm flex items-center gap-2 transition-all cursor-pointer hover:shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirimkan Pengajuan...</span>
                  </>
                ) : (
                  <>
                    <span>Ajukan Konseling Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default CounselingWizard;
