import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  HeartHandshake,
  Shield,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Lightbulb,
  Maximize2,
  X,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Info,
  ZoomIn
} from 'lucide-react';
import api from '../../services/api';
import { defaultUserGuides } from '../../data/defaultUserGuides';
import { GuideMockupGraphic } from '../../components/guide/GuideMockupGraphic';

export const UserGuidePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'konseli';

  const [activeRole, setActiveRole] = useState(
    ['konseli', 'konselor', 'admin'].includes(initialRole) ? initialRole : 'konseli'
  );
  const [guidesData, setGuidesData] = useState(defaultUserGuides);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [activeStepId, setActiveStepId] = useState('');

  // Fetch updated guide content from CMS if available
  useEffect(() => {
    let isMounted = true;
    api
      .get('/landing-content')
      .then((res) => {
        if (isMounted && res?.data?.user_guides) {
          setGuidesData({
            konseli: { ...defaultUserGuides.konseli, ...(res.data.user_guides.konseli || {}) },
            konselor: { ...defaultUserGuides.konselor, ...(res.data.user_guides.konselor || {}) },
            admin: { ...defaultUserGuides.admin, ...(res.data.user_guides.admin || {}) },
          });
        }
      })
      .catch(() => {
        // Fallback to defaultUserGuides
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync role to URL query params
  const handleRoleChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
    setSearchQuery('');
  };

  const currentRoleGuide = guidesData[activeRole] || defaultUserGuides[activeRole];

  // Filter steps by search query
  const filteredSteps = useMemo(() => {
    const steps = currentRoleGuide?.steps || [];
    if (!searchQuery.trim()) return steps;
    const q = searchQuery.toLowerCase();
    return steps.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.tips?.toLowerCase().includes(q)
    );
  }, [currentRoleGuide, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  // Color schemes per role
  const roleStyles = {
    konseli: {
      accent: 'emerald',
      bgLight: 'bg-emerald-50',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      badgeBg: 'bg-emerald-600',
      ringAccent: 'ring-emerald-500/20',
      btnActive: 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-md',
      stepBadge: 'bg-emerald-600 text-white',
    },
    konselor: {
      accent: 'sky',
      bgLight: 'bg-sky-50',
      textAccent: 'text-sky-700',
      borderAccent: 'border-sky-200',
      badgeBg: 'bg-sky-600',
      ringAccent: 'ring-sky-500/20',
      btnActive: 'bg-sky-600 text-white shadow-sky-600/20 shadow-md',
      stepBadge: 'bg-sky-600 text-white',
    },
    admin: {
      accent: 'purple',
      bgLight: 'bg-purple-50',
      textAccent: 'text-purple-700',
      borderAccent: 'border-purple-200',
      badgeBg: 'bg-purple-600',
      ringAccent: 'ring-purple-500/20',
      btnActive: 'bg-purple-600 text-white shadow-purple-600/20 shadow-md',
      stepBadge: 'bg-purple-600 text-white',
    },
  };

  const currentStyle = roleStyles[activeRole] || roleStyles.konseli;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. PRINT-ONLY HEADER (KOP SURAT RESMI UINSSC) */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-900 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img src="/logobk.png" alt="Logo UINSSC" className="w-16 h-16 object-contain" />
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-700 uppercase">
              Kementerian Agama Republik Indonesia
            </h2>
            <h1 className="text-base font-extrabold uppercase text-slate-900 leading-tight">
              UIN Siber Syekh Nurjati Cirebon (UINSSC)
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Pusat Layanan Bimbingan & Konseling Terpadu Mahasiswa (Ruang BK)
            </p>
          </div>
        </div>
        <div className="mt-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-bold uppercase text-slate-900">
          BUKU PETUNJUK TEKNIS: {currentRoleGuide?.title || 'PANDUAN PENGGUNA'}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} • Portal: ruangbk.uinssc.ac.id
        </p>
      </div>

      {/* 2. TOP WEB NAVBAR (Hidden in Print) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-emerald-500/10 group-hover:scale-105 transition-transform">
              <img src="/logobk.png" alt="Ruang BK" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#164C53] tracking-wider uppercase block leading-none">
                RUANG BK
              </span>
              <span className="text-[11px] text-slate-500 block leading-none mt-1">
                UIN Siber Syekh Nurjati Cirebon
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#047857] hover:bg-emerald-700 text-white shadow-soft-sm transition-all"
            >
              Masuk Akun
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO & ROLE SELECTOR (Hidden in Print) */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] border-b border-slate-200/60 pt-8 pb-10 px-4 sm:px-8 print:hidden">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Panduan Penggunaan Ruang BK
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed">
            Petunjuk operasional praktis bimbingan konseling digital. Pilih peran Anda di bawah ini untuk melihat
            langkah-langkah terperinci beserta ilustrasi dan tips penting.
          </p>

          {/* 3 Role Switcher Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange('konseli')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'konseli'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>1. Panduan Konseli (Mahasiswa/Umum)</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('konselor')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'konselor'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 ring-2 ring-sky-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>2. Panduan Konselor / Dosen BK</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-2 ring-purple-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>3. Panduan Administrator</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* Action Bar: Total Steps + Search + Print PDF Button */}
        <div className="bg-white rounded-2xl p-4 sm:px-6 border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className={`w-2.5 h-2.5 rounded-full ${currentStyle.badgeBg}`} />
            <span>Total {filteredSteps.length} Langkah Panduan</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari langkah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Print / Download PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
              title="Cetak atau Simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Download PDF</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: Sticky TOC (Desktop) + Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* A. STICKY SIDEBAR (Hidden on mobile & print) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 print:hidden space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Daftar Isi Langkah
              </h4>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {filteredSteps.map((step, idx) => (
                  <a
                    key={step.id || idx}
                    href={`#step-${step.id || idx + 1}`}
                    className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      activeStepId === (step.id || `step-${idx + 1}`)
                        ? `${currentStyle.bgLight} ${currentStyle.textAccent} font-bold`
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${currentStyle.stepBadge}`}>
                        {step.step_number || idx + 1}
                      </span>
                      <span className="truncate">{step.title}</span>
                    </div>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* B. STEPS CARDS LIST */}
          <div className="lg:col-span-8 space-y-8 print:space-y-6">
            {filteredSteps.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Langkah tidak ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Coba kata kunci pencarian lain atau klik tombol reset.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              filteredSteps.map((step, idx) => {
                const stepNum = step.step_number || idx + 1;
                const hasCustomImage = Boolean(step.image_url && step.image_url.trim());

                return (
                  <article
                    key={step.id || idx}
                    id={`step-${step.id || idx + 1}`}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-24 transition-all hover:shadow-md print:shadow-none print:border print:border-slate-300 print:break-inside-avoid print:rounded-xl"
                  >
                    {/* Step Card Header */}
                    <div className="p-5 sm:p-6 pb-4 border-b border-slate-100">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm sm:text-base shrink-0 shadow-sm ${currentStyle.stepBadge}`}
                        >
                          {stepNum}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-0.5">
                            Langkah {stepNum}
                          </span>
                          <h3 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Step Content: Narrative & Tips */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Tips Callout */}
                      {step.tips && (
                        <div className={`p-3.5 rounded-2xl ${currentStyle.bgLight} border ${currentStyle.borderAccent} flex items-start gap-2.5`}>
                          <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${currentStyle.textAccent}`} />
                          <div className="text-xs leading-relaxed">
                            <strong className={`block font-bold mb-0.5 ${currentStyle.textAccent}`}>
                              Tips Penting:
                            </strong>
                            <span className="text-slate-700">{step.tips}</span>
                          </div>
                        </div>
                      )}

                      {/* Visual Graphic / Screenshot */}
                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                          <span>Ilustrasi Tampilan Layar:</span>
                          {hasCustomImage && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 print:hidden">
                              <ZoomIn className="w-3 h-3" /> Klik gambar untuk memperbesar
                            </span>
                          )}
                        </div>

                        {hasCustomImage ? (
                          <div
                            onClick={() =>
                              setSelectedImageModal({
                                url: step.image_url,
                                title: `Langkah ${stepNum}: ${step.title}`,
                                description: step.description,
                              })
                            }
                            className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-inner"
                          >
                            <img
                              src={step.image_url}
                              alt={step.title}
                              className="w-full h-auto max-h-[380px] object-cover sm:object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-200"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden">
                              <div className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                                <Maximize2 className="w-3.5 h-3.5" />
                                Perbesar Screenshot
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Mockup Graphic Component when real screenshot hasn't been uploaded yet
                          <GuideMockupGraphic stepId={step.id} role={activeRole} />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* 5. IMAGE LIGHTBOX MODAL (Interactive Screenshot Zoom) */}
      {selectedImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {selectedImageModal.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {selectedImageModal.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-3 sm:p-6 overflow-auto bg-slate-900/5 flex items-center justify-center">
              <img
                src={selectedImageModal.url}
                alt={selectedImageModal.title}
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Gunakan tombol panah atau tutup untuk kembali</span>
              <button
                type="button"
                onClick={() => setSelectedImageModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRINT STYLESHEET */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 11pt !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          article {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserGuidePage;

