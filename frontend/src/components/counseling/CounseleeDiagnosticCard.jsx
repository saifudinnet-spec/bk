import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Activity,
  HeartPulse,
  BookOpen,
  Info
} from 'lucide-react';

export const CounseleeDiagnosticCard = ({
  counseleeUser,
  assessmentAnswers = {},
  caseItem = null,
  allCases = [],
  onCopyDiagnosticNote = null,
  initialExpanded = true,
  defaultTab = 'assessment', // 'assessment' | 'profile' | 'screening' | 'history'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [expandedScreeningId, setExpandedScreeningId] = useState(null);

  if (!counseleeUser) {
    return null;
  }

  const studentProfile = counseleeUser.studentProfile || counseleeUser.student_profile || {};
  const generalProfile = counseleeUser.generalProfile || counseleeUser.general_profile || {};
  const isStudent = (counseleeUser.role || '').toUpperCase() === 'STUDENT';
  const questionnaireResponses = counseleeUser.questionnaireResponses || counseleeUser.questionnaire_responses || [];

  // Assessment answers fallback
  const answers = assessmentAnswers || caseItem?.assessment_answers || {};
  const mainIssue = answers.main_issue || caseItem?.category || 'Bimbingan Umum';
  const duration = answers.duration || 'Tidak disebutkan';
  const impactLevel = parseInt(answers.impact_level || 3, 10);
  const previousEfforts = answers.previous_efforts || '-';
  const story = answers.story || caseItem?.initial_reason || '';

  // Impact level mapping
  const impactMeta = {
    1: { label: 'Tingkat 1/5 — Sangat Ringan (Aktivitas Berjalan Normal)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', bar: 'bg-emerald-500', width: '20%' },
    2: { label: 'Tingkat 2/5 — Ringan (Sedikit Mengganggu Fokus)', color: 'bg-teal-50 text-teal-800 border-teal-200', bar: 'bg-teal-500', width: '40%' },
    3: { label: 'Tingkat 3/5 — Sedang (Mengganggu Suasana Hati & Belajar)', color: 'bg-amber-50 text-amber-800 border-amber-200', bar: 'bg-amber-500', width: '60%' },
    4: { label: 'Tingkat 4/5 — Cukup Berat (Mengganggu Kuliah & Jam Tidur)', color: 'bg-orange-50 text-orange-800 border-orange-200', bar: 'bg-orange-500', width: '80%' },
    5: { label: 'Tingkat 5/5 — Sangat Berat (Sangat Menghambat Fungsi Hidup)', color: 'bg-rose-50 text-rose-800 border-rose-200', bar: 'bg-rose-500', width: '100%' },
  };

  const currentImpact = impactMeta[impactLevel] || impactMeta[3];

  // WhatsApp quick format
  const rawPhone = counseleeUser.phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  // Calculate age if birth date exists
  const birthDateStr = studentProfile.birth_date || generalProfile.birth_date;
  let age = null;
  if (birthDateStr) {
    try {
      const birth = new Date(birthDateStr);
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    } catch (e) {}
  }

  // Format Copy Clinical Note
  const handleCopyNote = () => {
    const textToCopy = `[DATA KONSELI]
Nama: ${counseleeUser.name}
NIM: ${studentProfile.nim || '-'}
Prodi: ${studentProfile.program_study || '-'}
Kontak: ${counseleeUser.phone || '-'}

[HASIL ASESMEN PRA-KONSELING]
- Topik/Kategori: ${caseItem?.category || answers.topic || 'Bimbingan Umum'}
- Kendala Utama: ${mainIssue}
- Durasi Masalah: ${duration}
- Tingkat Gangguan: ${impactLevel}/5 (${currentImpact.label})
- Upaya Sebelumnya: ${previousEfforts}
- Keluhan/Cerita Mahasiswa: "${story}"`;

    if (onCopyDiagnosticNote) {
      onCopyDiagnosticNote(textToCopy);
    } else {
      navigator.clipboard?.writeText(textToCopy);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm overflow-hidden transition-all">
      {/* Banner / Card Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-200 text-emerald-950 font-black text-base flex items-center justify-center shrink-0 shadow-md border-2 border-white/20">
            {counseleeUser.name?.charAt(0) || 'K'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                {counseleeUser.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {isStudent ? 'Mahasiswa Aktif' : 'Klien Umum'}
              </span>
              {studentProfile.nim && (
                <span className="text-[10px] font-mono text-emerald-100 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  NIM: {studentProfile.nim}
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-100/80 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {studentProfile.program_study && (
                <span className="flex items-center gap-1 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  {studentProfile.program_study}
                </span>
              )}
              {age && <span>• Usia {age} tahun</span>}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold border border-emerald-500/40 transition-colors flex items-center gap-1.5"
              title="Hubungi via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isExpanded ? 'Sembunyikan Lembar Diagnosa' : 'Buka Lembar Diagnosa'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-100"
          >
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-4 py-2 gap-1.5 text-xs font-bold no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('assessment')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'assessment'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Asesmen Awal Kasus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Biodata Lengkap</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('screening')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'screening'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Kuesioner Screening ({questionnaireResponses.length})</span>
                {questionnaireResponses.some((r) => r.has_crisis_flag) && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {allCases.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Riwayat Kasus ({allCases.length})</span>
                </button>
              )}
            </div>

            {/* Tab Content Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* TAB 1: ASESMEN AWAL (INTAKE FORM) */}
              {activeTab === 'assessment' && (
                <div className="space-y-4">
                  {/* Quick Action to copy to diagnosis */}
                  <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-150 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">
                          Data Asesmen Masalah Konseli
                        </h4>
                        <p className="text-[10px] text-emerald-800">
                          Gunakan sebagai acuan observasi dan penegakan diagnosa bimbingan
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyNote}
                      className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-soft-xs transition-all active:scale-95"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Disalin ke Draf!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Salin ke Catatan Diagnosa</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Assessment Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Topik / Kategori Konseling
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {caseItem?.category || answers.topic || 'Konseling Akademik'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Durasi Masalah yang Dirasakan
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {duration}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tingkat Dampak pada Aktivitas Harian (Skala 1 - 5)
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentImpact.color}`}>
                          Skala {impactLevel} dari 5
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-xs mb-2">
                        {currentImpact.label}
                      </p>
                      {/* Visual meter bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${currentImpact.bar} transition-all duration-500`}
                          style={{ width: currentImpact.width }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Kendala / Isu Utama yang Dikeluhkan
                      </span>
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {mainIssue}
                      </p>
                    </div>

                    {previousEfforts && previousEfforts !== '-' && (
                      <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Upaya / Penanganan Mandiri yang Sudah Dicoba
                        </span>
                        <p className="text-slate-800 text-xs leading-relaxed">
                          {previousEfforts}
                        </p>
                      </div>
                    )}

                    {story && (
                      <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Cerita & Keluhan Lengkap yang Ditulis Konseli
                        </span>
                        <p className="text-slate-800 text-xs sm:text-sm italic leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200">
                          "{story}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BIODATA LENGKAP KONSELI */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Nama Lengkap
                    </span>
                    <p className="font-bold text-slate-900">{counseleeUser.name}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Nomor Induk Mahasiswa (NIM)
                    </span>
                    <p className="font-mono font-bold text-slate-900">
                      {studentProfile.nim || '-'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Program Studi & Jenjang
                    </span>
                    <p className="font-semibold text-slate-900">
                      {studentProfile.program_study || '-'} {studentProfile.degree ? `(${studentProfile.degree})` : ''}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Status Akademik Kampus
                    </span>
                    <p className="font-semibold text-slate-900">
                      <span className="text-emerald-700 font-bold">
                        {studentProfile.campus_status || 'Mahasiswa Aktif'}
                      </span>
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Nomor WhatsApp / Telepon
                    </span>
                    {counseleeUser.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {counseleeUser.phone}
                        </span>
                        {waPhone && (
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Chat WA</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Belum dicantumkan</p>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Email Kampus / Akun
                    </span>
                    <p className="font-mono text-slate-900 truncate">
                      {counseleeUser.email || '-'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Jenis Kelamin
                    </span>
                    <p className="font-semibold text-slate-900">
                      {studentProfile.gender === 'L'
                        ? 'Laki-laki'
                        : studentProfile.gender === 'P'
                        ? 'Perempuan'
                        : studentProfile.gender || generalProfile.gender || '-'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Tempat & Tanggal Lahir
                    </span>
                    <p className="font-semibold text-slate-900">
                      {[studentProfile.birth_place, studentProfile.birth_date ? new Date(studentProfile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null].filter(Boolean).join(', ') || '-'}
                      {age ? ` (${age} thn)` : ''}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Alamat Domisili Klien
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {studentProfile.address || generalProfile.address || 'Tidak dicantumkan'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: KUESIONER SCREENING & BUTIR JAWABAN */}
              {activeTab === 'screening' && (
                <div className="space-y-4">
                  {questionnaireResponses.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                      <HeartPulse className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700">Belum Ada Hasil Screening Psikologis</p>
                      <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                        Konseli belum pernah mengisi instrumen evaluasi psikologis mandiri (screening DASS / survei kesiapan mental).
                      </p>
                    </div>
                  ) : (
                    questionnaireResponses.map((res, idx) => {
                      const isCrisis = !!res.has_crisis_flag;
                      const categories = res.category_scores || [];
                      const isExpandedScreening = expandedScreeningId === res.id || idx === 0;

                      return (
                        <div
                          key={res.id || idx}
                          className={`rounded-2xl border transition-all ${
                            isCrisis
                              ? 'border-rose-300 bg-rose-50/40 shadow-soft-xs'
                              : 'border-slate-200 bg-slate-50/70'
                          }`}
                        >
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">
                                  {res.questionnaire?.title || 'Instrumen Evaluasi Screening Mandiri'}
                                </h4>
                                {isCrisis && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>Indikasi Krisis</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Dikirim pada:{' '}
                                <strong>
                                  {new Date(res.submitted_at || res.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </strong>{' '}
                                • Total Skor: <strong>{res.total_score}</strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedScreeningId(isExpandedScreening ? null : res.id)
                              }
                              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0 self-start sm:self-center"
                            >
                              <span>{isExpandedScreening ? 'Tutup Butir' : 'Lihat Rincian Butir'}</span>
                              {isExpandedScreening ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Category breakdown meters */}
                          {categories.length > 0 && (
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {categories.map((cat, cIdx) => (
                                <div key={cIdx} className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-bold text-slate-700 truncate">{cat.category}</span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                        cat.level === 'Tinggi'
                                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                                          : cat.level === 'Sedang'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      {cat.level || 'Normal'}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        cat.level === 'Tinggi'
                                          ? 'bg-rose-500'
                                          : cat.level === 'Sedang'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(100, cat.percentage || (cat.score / (cat.max_score || 10)) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Detailed answers per question */}
                          {isExpandedScreening && res.answers && res.answers.length > 0 && (
                            <div className="p-4 pt-2 border-t border-slate-200/80 space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                Butir Pertanyaan & Pilihan Jawaban Konseli:
                              </span>
                              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {res.answers.map((ans, aIdx) => (
                                  <div
                                    key={ans.id || aIdx}
                                    className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[10px] font-mono text-slate-400 mr-1.5">
                                        #{aIdx + 1}
                                      </span>
                                      <span className="text-slate-800 font-medium leading-tight">
                                        {ans.question?.question_text || 'Pertanyaan Evaluasi'}
                                      </span>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                        {ans.option?.label || ans.text_answer || `Skor ${ans.score}`}
                                      </span>
                                      {ans.score !== null && (
                                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                                          Bobot: {ans.score}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: RIWAYAT KASUS TERDAHULU */}
              {activeTab === 'history' && allCases.length > 0 && (
                <div className="space-y-2 text-xs">
                  {allCases.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {c.case_number}
                          </span>
                          <h4 className="font-bold text-slate-900">{c.category || 'Konseling'}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                          "{c.initial_reason || c.assessment_answers?.main_issue || '-'}"
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shrink-0">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CounseleeDiagnosticCard;
