import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  ShieldCheck,
  RotateCcw,
  Edit3,
  HelpCircle,
  AlertCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import VirtualGuide from '../guidance/VirtualGuide';

const STORAGE_KEY = 'ruangbk_guided_assessment_draft_v1';

// Preset issues per topic
const topicQuestionMap = {
  'Akademik & Skripsi': [
    'Prokrastinasi / sering menunda mengerjakan tugas perkuliahan',
    'Kebuntuan menyusun skripsi atau tugas akhir',
    'Motivasi belajar menurun drastis dan merasa hampa',
    'Kesulitan memahami materi perkuliahan yang kompleks',
    'Kecemasan berlebih terhadap nilai, IPK, atau kelulusan',
    'Kendala komunikasi dengan dosen pembimbing',
  ],
  'Kecemasan & Overthinking': [
    'Pikiran berputar terus-menerus (overthinking) tanpa henti',
    'Kecemasan berlebihan akan masa depan yang belum terjadi',
    'Gejala panik / jantung berdebar saat berada dalam situasi tertekan',
    'Sulit tidur (insomnia) karena beban pikiran yang menumpuk',
    'Rasa takut gagal memenuhi ekspektasi orang lain atau diri sendiri',
    'Kecemasan saat presentasi atau berbicara di depan umum',
  ],
  'Stres Perkuliahan & Burnout': [
    'Kelelahan fisik dan emosional berkepanjangan (burnout)',
    'Kehilangan minat terhadap perkuliahan atau hobi yang biasa disukai',
    'Beban tugas kuliah & kepengurusan organisasi terasa menumpuk',
    'Sulit berkonsentrasi dan mudah lupa saat kuliah atau ujian',
    'Merasa tidak berdaya menghadapi rutinitas kampus yang monoton',
  ],
  'Relasi Pertemanan & Sosial': [
    'Konflik atau ketidakcocokan dengan teman satu angkatan / satu kos',
    'Rasa kesepian mendalam di lingkungan perantauan',
    'Kesulitan beradaptasi atau memulai pertemanan baru di kampus',
    'Merasa terisolasi atau diasingkan dari kelompok sosial',
    'Kecemasan saat harus berinteraksi dalam kelompok besar',
  ],
  'Keluarga & Ekonomi': [
    'Dilema ekspektasi tinggi atau tekanan dari orang tua',
    'Konflik komunikasi atau suasana tidak harmonis di keluarga',
    'Kecemasan terkait biaya kuliah atau beban finansial keluarga',
    'Kurangnya dukungan emosional dari lingkungan rumah',
  ],
  'Arah Karier & Masa Depan': [
    'Bingung menentukan peminatan studi atau konsentrasi jurusan',
    'Kekhawatiran besar mengenai prospek kerja setelah lulus sarjana',
    'Kurang percaya diri menghadapi magang, portofolio, atau wawancara',
    'Krisis quarter-life & kebimbangan mengenai tujuan hidup masa depan',
  ],
};

const defaultIssues = [
  'Kesulitan mengelola stres & regulasi emosi',
  'Kendala dalam rutinitas perkuliahan atau tugas akhir',
  'Masalah relasi, pertemanan, atau komunikasi pribadi',
  'Kecemasan akan masa depan atau kesiapan karier',
  'Perasaan jenuh, lelah, dan kehilangan motivasi',
];

const durationOptions = [
  'Kurang dari 1 minggu',
  '1–4 minggu',
  '1–3 bulan',
  'Lebih dari 3 bulan',
];

const impactLevels = [
  { val: 1, label: 'Sangat Ringan', desc: 'Aktivitas belajar & harian berjalan normal' },
  { val: 2, label: 'Ringan', desc: 'Sedikit mengganggu, namun masih dapat diatasi mandiri' },
  { val: 3, label: 'Sedang', desc: 'Mulai memengaruhi fokus, motivasi, atau tidur' },
  { val: 4, label: 'Cukup Berat', desc: 'Banyak tugas & rutinitas harian terhambat' },
  { val: 5, label: 'Sangat Mengganggu', desc: 'Sangat sulit berfungsi dalam aktivitas harian' },
];

const suggestionChips = [
  'Bercerita ke teman / keluarga terdekat',
  'Mencoba istirahat sejenak dari aktivitas kampus',
  'Mengatur ulang jadwal & skala prioritas',
  'Mencari tips & informasi mandiri di internet',
  'Belum mencoba cara apa pun',
];

export const GuidedAssessment = ({
  selectedTopic,
  selectedCounselor,
  customTopic = '',
  onComplete,
  onCancel,
}) => {
  const activeTopicTitle = selectedTopic?.title || customTopic || 'Bimbingan Umum';
  const counselorShortName = selectedCounselor?.name?.split(',')[0] || 'Konselor';

  // Load draft from storage if available
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.topicId === selectedTopic?.id && parsed.counselorId === selectedCounselor?.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load assessment draft:', e);
    }
    return {
      step: 0, // 0: Intro, 1-5: Questions, 6: Summary
      mainIssue: '',
      customMainIssue: '',
      duration: '1–4 minggu',
      impactLevel: 3,
      previousEfforts: '',
      story: '',
    };
  });

  const [step, setStep] = useState(draft.step);
  const [mainIssue, setMainIssue] = useState(draft.mainIssue);
  const [customMainIssue, setCustomMainIssue] = useState(draft.customMainIssue);
  const [duration, setDuration] = useState(draft.duration);
  const [impactLevel, setImpactLevel] = useState(draft.impactLevel);
  const [previousEfforts, setPreviousEfforts] = useState(draft.previousEfforts);
  const [story, setStory] = useState(draft.story);
  const [errorMsg, setErrorMsg] = useState('');

  // Persist draft to sessionStorage on state change
  useEffect(() => {
    try {
      const payload = {
        topicId: selectedTopic?.id,
        counselorId: selectedCounselor?.id,
        step,
        mainIssue,
        customMainIssue,
        duration,
        impactLevel,
        previousEfforts,
        story,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save assessment draft:', e);
    }
  }, [selectedTopic, selectedCounselor, step, mainIssue, customMainIssue, duration, impactLevel, previousEfforts, story]);

  const issueOptions = useMemo(() => {
    return topicQuestionMap[activeTopicTitle] || defaultIssues;
  }, [activeTopicTitle]);

  // Expression state for 3D Nara based on step
  const naraExpression = useMemo(() => {
    if (step === 0) return 'neutral';
    if (step <= 3) return 'listening';
    if (step <= 5) return 'encouraging';
    return 'positive'; // Summary (step 6)
  }, [step]);

  // Dynamic explanation for active step (Friendly, concise assistant dialogue)
  const stepExplanation = useMemo(() => {
    switch (step) {
      case 0:
        return `Halo! Saya Nara, asisten virtual Anda. Yuk luangkan 2-3 menit menjawab 5 pertanyaan santai ini agar ${counselorShortName} mengenal situasimu dengan baik.`;
      case 1:
        return `Pilih satu kendala yang paling menyita energimu saat ini terkait topik ${activeTopicTitle}. Jika belum ada di daftar, kamu bisa pilih opsi 'Lainnya'.`;
      case 2:
        return `Kira-kira sudah berapa lama kamu merasakan kondisi ini? Informasi durasi penting agar konselor memahami perjalanan kondisimu.`;
      case 3:
        return `Seberapa besar kondisi ini memengaruhi fokus kuliah atau kegiatan harianmu? Pilih skala 1 (Sangat Ringan) sampai 5 (Sangat Mengganggu) ya.`;
      case 4:
        return `Apakah ada cara atau upaya mandiri yang pernah kamu coba sebelumnya? Ceritakan apa saja, konselor siap mendengarkan tanpa menghakimi.`;
      case 5:
        return `Tuliskan hal utama atau harapan yang paling ingin kamu sampaikan langsung ke ${counselorShortName}. Ceritamu aman dan dijamin kerahasiaannya.`;
      case 6:
        return `Semua jawabanmu sudah lengkap! Periksa kembali rangkuman di samping. Jika sudah sesuai, kita lanjut ke pemilihan jadwal konseling ya.`;
      default:
        return `Saya Nara, asisten virtual Anda di Ruang BK.`;
    }
  }, [step, activeTopicTitle, counselorShortName]);

  // Handle navigation
  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      const finalIssue = mainIssue === 'Lainnya' ? customMainIssue.trim() : mainIssue;
      if (!finalIssue) {
        setErrorMsg('Silakan pilih salah satu opsi kendala atau tuliskan kendala Anda.');
        return;
      }
    }
    if (step === 5) {
      if (!story.trim() || story.trim().length < 10) {
        setErrorMsg('Mohon tuliskan sedikit cerita atau harapan Anda (minimal 10 karakter).');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (step > 0) {
      setStep((s) => s - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleConfirmSummary = () => {
    const finalIssue = mainIssue === 'Lainnya' ? customMainIssue.trim() : mainIssue;
    const finalPayload = {
      topic: activeTopicTitle,
      main_issue: finalIssue,
      duration: duration,
      impact_level: impactLevel,
      previous_efforts: previousEfforts.trim() || '-',
      story: story.trim(),
    };
    if (onComplete) {
      onComplete(finalPayload);
    }
  };

  const [activeGuideDetail, setActiveGuideDetail] = useState(null); // 'tip' | 'why' | null
  const [isNaraMinimized, setIsNaraMinimized] = useState(false);

  const stepTips = {
    0: 'Pengisian hanya butuh 2-3 menit. Kamu bisa mengubah jawaban kapan saja sebelum mengirim.',
    1: 'Fokus pada satu kendala paling mendesak minggu ini. Permasalahan lain bisa dibahas saat sesi konseling.',
    2: 'Pilih perkiraan rentang waktu terdekat. Jika masalah hilang-timbul, hitung dari pertama kali terasa mengganggu.',
    3: 'Skala 1-2 berarti masih bisa diatasi mandiri, skala 3-4 mulai menghambat tugas, dan skala 5 sangat mengganggu.',
    4: 'Upaya apa pun berharga untuk diceritakan—seperti istirahat sejenak, curhat ke sahabat, atau belum mencoba apa pun.',
    5: 'Tuliskan unek-unekmu secara bebas tanpa khawatir dinilai. Konselor kampus adalah pendengar yang aman dan suportif.',
    6: 'Cek tiap poin jawaban. Jika ada yang kurang pas, cukup klik tombol "Perbaiki Jawaban" di bawah.',
  };

  const stepWhy = {
    1: 'Membantu konselor mempersiapkan sudut pandang dan materi bimbingan yang tepat sejak menit awal.',
    2: 'Membantu membedakan apakah kendala bersifat sementara (akut) atau sudah menumpuk lama (kronis).',
    3: 'Menentukan tingkat urgensi agar kampus dapat memprioritaskan penanganan yang paling sesuai.',
    4: 'Mencegah konselor memberikan saran yang sudah pernah kamu coba dan terbukti kurang efektif.',
    5: 'Memastikan suara, harapan, dan kebutuhan personalmu didengar secara utuh oleh konselor.',
  };

  const currentImpactObj = impactLevels.find((i) => i.val === impactLevel) || impactLevels[2];

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row items-start gap-3 lg:gap-4.5 w-full">
        {/* Main Interactive Form Card (Left / Center) */}
        <div className="flex-1 min-w-0 w-full space-y-2">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm p-4 sm:p-5 space-y-3 relative overflow-hidden w-full">
            {/* Top Step & Progress Bar (Visible in Questions step 1-5) */}
            {step >= 1 && step <= 5 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">Pertanyaan {step} dari 5</span>
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {step === 1 && 'Kendala Utama'}
                      {step === 2 && 'Durasi'}
                      {step === 3 && 'Tingkat Gangguan'}
                      {step === 4 && 'Upaya'}
                      {step === 5 && 'Cerita Bebas'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{step * 20}% Selesai</span>
                </div>

                {/* Modern Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    initial={{ width: `${(step - 1) * 20}%` }}
                    animate={{ width: `${step * 20}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Error notification */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* STEP 0: INTRODUCTION SCREEN */}
              {step === 0 && (
                <motion.div
                  key="step-0"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Asesmen Awal Konseling</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Ceritakan Kondisi Anda Secara Singkat
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Jawaban Anda akan langsung diteruskan kepada konselor agar sesi konseling dapat disiapkan dengan tepat.
                    </p>
                  </div>

                  {/* Context Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Topik Bimbingan</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block truncate">{activeTopicTitle}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Konselor Pendamping</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block truncate">{selectedCounselor?.name}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-600 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <p className="leading-snug">
                      Informasi ini bersifat <strong>rahasia</strong> dan hanya digunakan untuk kepentingan bimbingan konseling profesional.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    {onCancel && (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                      >
                        Nanti Saja
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-black shadow-soft-xs flex items-center justify-center gap-2 transition-all ml-auto hover:scale-[1.01]"
                    >
                      <span>Mulai Asesmen</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: KENDALA UTAMA */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug tracking-tight">
                      Apa kendala utama yang sedang Anda alami saat ini?
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Pilihlah salah satu poin yang paling mewakili situasi Anda terkait topik <strong>{activeTopicTitle}</strong>:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 items-stretch">
                    {issueOptions.map((opt, idx) => {
                      const isSelected = mainIssue === opt;
                      return (
                        <div
                          key={idx}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setMainIssue(opt);
                            setErrorMsg('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setMainIssue(opt);
                              setErrorMsg('');
                            }
                          }}
                          className={`p-2.5 sm:p-3 rounded-2xl border text-xs sm:text-[13px] cursor-pointer transition-all flex items-center justify-between gap-2.5 min-h-[46px] sm:min-h-[48px] ${
                            isSelected
                              ? 'bg-emerald-50/95 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-soft-2xs'
                              : 'bg-white border-slate-200/90 hover:border-emerald-200 hover:bg-slate-50/80 text-slate-700 font-medium hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="leading-snug text-left flex-1">{opt}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Option Lainnya */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setMainIssue('Lainnya');
                        setErrorMsg('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setMainIssue('Lainnya');
                          setErrorMsg('');
                        }
                      }}
                      className={`p-2.5 sm:p-3 rounded-2xl border text-xs sm:text-[13px] cursor-pointer transition-all sm:col-span-2 min-h-[46px] sm:min-h-[48px] ${
                        mainIssue === 'Lainnya'
                          ? 'bg-emerald-50/95 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-soft-2xs'
                          : 'bg-white border-slate-200/90 hover:border-emerald-200 hover:bg-slate-50/80 text-slate-700 font-medium hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            mainIssue === 'Lainnya'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {mainIssue === 'Lainnya' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="font-medium">Lainnya (Tuliskan kendala spesifik)</span>
                      </div>

                      {mainIssue === 'Lainnya' && (
                        <div className="mt-2 pl-6.5">
                          <input
                            type="text"
                            value={customMainIssue}
                            onChange={(e) => setCustomMainIssue(e.target.value)}
                            placeholder="Tuliskan kendala spesifik Anda..."
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-normal shadow-2xs"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs hover:scale-[1.01] min-h-[38px]"
                    >
                      <span>Lanjut</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DURASI KONDISI */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug tracking-tight">
                      Sudah berapa lama kondisi ini mulai Anda rasakan?
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Perkiraan durasi membantu konselor memahami perjalanan kondisi keluhan ini:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 items-stretch">
                    {durationOptions.map((dur) => {
                      const isSelected = duration === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setDuration(dur)}
                          className={`p-3 sm:p-3.5 rounded-2xl border text-xs sm:text-[13px] font-bold text-left transition-all flex items-center justify-between gap-2.5 min-h-[46px] sm:min-h-[48px] ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-soft-xs scale-[1.01]'
                              : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-emerald-200'
                          }`}
                        >
                          <span>{dur}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white text-emerald-800 border-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs hover:scale-[1.01] min-h-[38px]"
                    >
                      <span>Lanjut</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: SKALA TINGKAT GANGGUAN (1-5) */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                      Seberapa besar kondisi ini mengganggu aktivitas Anda?
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Pilih skala 1 (Sangat Ringan) hingga 5 (Sangat Mengganggu):
                    </p>
                  </div>

                  {/* Rating Numbers Segmented Bar */}
                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {impactLevels.map((lvl) => {
                      const isSelected = impactLevel === lvl.val;
                      return (
                        <button
                          key={lvl.val}
                          type="button"
                          onClick={() => setImpactLevel(lvl.val)}
                          className={`py-1 px-1 sm:py-1.5 sm:px-2 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-soft-xs ring-2 ring-emerald-600/30'
                              : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm sm:text-base font-black block leading-tight">{lvl.val}</span>
                          <span className="text-[9px] block leading-tight mt-0.5 opacity-90 hidden sm:block">
                            {lvl.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Highlight Selected Level Meaning */}
                  <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {impactLevel}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{currentImpactObj.label}</span>
                      <span className="text-[10.5px] text-slate-600 block leading-tight">{currentImpactObj.desc}</span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs"
                    >
                      <span>Lanjut</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: UPAYA YANG SUDAH DILAKUKAN */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                      Apa yang sudah Anda lakukan selama ini untuk mengatasinya?
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Upaya mandiri atau bantuan yang sudah dicoba (opsional):
                    </p>
                  </div>

                  {/* Quick Suggestion Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Pilih ide cepat:</span>
                    <div className="flex flex-wrap gap-1">
                      {suggestionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!previousEfforts) {
                              setPreviousEfforts(chip);
                            } else if (!previousEfforts.includes(chip)) {
                              setPreviousEfforts((prev) => `${prev}, ${chip}`);
                            }
                          }}
                          className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 text-[10px] sm:text-[11px] font-medium transition-all"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      rows={2}
                      value={previousEfforts}
                      onChange={(e) => setPreviousEfforts(e.target.value)}
                      placeholder="Tuliskan upaya atau hal yang pernah Anda lakukan..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs"
                    >
                      <span>Lanjut</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: CERITA BEBAS / HARAPAN UNTUK KONSELOR */}
              {step === 5 && (
                <motion.div
                  key="step-5"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                      Ceritakan hal yang paling ingin Anda sampaikan kepada konselor:
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Bisa berupa latar keluhan, kekhawatiran, atau harapan dari sesi konseling ini.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      required
                      value={story}
                      onChange={(e) => {
                        setStory(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Tuliskan hal yang ingin Anda ceritakan... (minimal 10 karakter)"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                      <span>Minimal 10 karakter</span>
                      <span className={story.length >= 10 ? 'text-emerald-700 font-bold' : ''}>
                        {story.length} karakter
                      </span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs"
                    >
                      <span>Lihat Ringkasan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: SUMMARY SCREEN (RINGKASAN ASESMEN) */}
              {step === 6 && (
                <motion.div
                  key="step-6"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-2.5"
                >
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Ringkasan Asesmen Selesai</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Periksa Ringkasan Jawaban Anda
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      Pastikan informasi sudah sesuai sebelum memilih metode & jadwal konseling.
                    </p>
                  </div>

                  {/* Structured Summary Card */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Topik</span>
                        <span className="text-xs font-bold text-slate-900 block truncate">{activeTopicTitle}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Konselor</span>
                        <span className="text-xs font-bold text-slate-900 block truncate">{selectedCounselor?.name}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Kendala Utama</span>
                        <p className="font-semibold text-slate-900 text-xs mt-0.5">
                          {mainIssue === 'Lainnya' ? customMainIssue : mainIssue}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Durasi</span>
                          <span className="font-semibold text-slate-900 text-xs block">{duration}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tingkat Gangguan</span>
                          <div className="inline-flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Skala {impactLevel}/5
                            </span>
                            <span className="text-slate-600 text-[10px]">({currentImpactObj.label})</span>
                          </div>
                        </div>
                      </div>

                      {previousEfforts && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Upaya Sebelumnya</span>
                          <p className="text-slate-700 text-[11px] leading-snug">{previousEfforts}</p>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cerita / Harapan</span>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 mt-0.5 text-slate-700 text-[11px] leading-snug italic line-clamp-2">
                          "{story}"
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Perbaiki</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmSummary}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-black shadow-soft-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>Sudah Sesuai (Pilih Metode)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3D ASSISTANT VIRTUAL (CLIPPY STYLE): NARA DISAMPING (Desktop) / DI ATAS (Mobile) */}
        <aside className="w-full lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-16 space-y-2 order-first lg:order-last">
          <VirtualGuide
            mode="sidebar"
            expression={naraExpression}
            speechText={stepExplanation}
            dialogueKey={`counseling_step_${step}`}
            stepTitle={step === 0 ? 'Pengantar' : step === 6 ? 'Rangkuman' : `Pertanyaan ${step} dari 5`}
            tipsAvailable={Boolean(stepTips[step])}
            whyAvailable={Boolean(stepWhy[step])}
            onTipClick={() => setActiveGuideDetail(activeGuideDetail === 'tip' ? null : 'tip')}
            onWhyClick={() => setActiveGuideDetail(activeGuideDetail === 'why' ? null : 'why')}
            isMinimized={isNaraMinimized}
            onToggleMinimize={() => setIsNaraMinimized(!isNaraMinimized)}
            size="md"
          />

          {/* Expandable Tip / Why Card */}
          <AnimatePresence>
            {activeGuideDetail && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border text-[11px] leading-snug flex items-start gap-2 shadow-2xs ${
                    activeGuideDetail === 'tip'
                      ? 'bg-amber-50/95 border-amber-200/90 text-amber-950'
                      : 'bg-emerald-50/95 border-emerald-200/90 text-emerald-950'
                  }`}
                >
                  <div className="p-1 rounded-xl bg-white shadow-2xs shrink-0">
                    {activeGuideDetail === 'tip' ? (
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                    ) : (
                      <HelpCircle className="w-3 h-3 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-slate-900">
                      {activeGuideDetail === 'tip' ? '💡 Tips Pengisian' : '❓ Kenapa Ditanyakan?'}
                    </div>
                    <p className="font-medium text-slate-700">{activeGuideDetail === 'tip' ? stepTips[step] : stepWhy[step]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveGuideDetail(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 px-1 py-0.2 rounded hover:bg-white/80 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
};

export default GuidedAssessment;
