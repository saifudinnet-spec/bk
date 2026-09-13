import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Tag,
  Filter,
  BookmarkCheck,
  Building2,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import api from '../../services/api';
import PageTransition from '../../components/common/PageTransition';
import ScrollReveal from '../../components/common/ScrollReveal';

export const ArticlesPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/landing-content');
        setContent(res.data || res);
      } catch (err) {
        console.error('Failed to load landing content:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  const articles = content?.articles?.items || [
    {
      id: 1,
      title: 'Strategi Praktis Mengatasi Prokrastinasi Skripsi & Tugas Akhir',
      category: 'Akademik',
      read_time: '4 min baca',
      date: '02 Sep 2026',
      author: 'Tim Konselor UINSSC',
      image_url: '/images/banner1.jpg',
      snippet: 'Rasa jenuh dan kebuntuan tugas akhir adalah respons alami otak saat mengalami kelelahan mental. Kenali teknik micro-stepping untuk mengembalikan motivasi belajar.',
      content: 'Banyak mahasiswa tingkat akhir merasa terjebak dalam siklus menunda-nunda bukan karena malas, melainkan karena rasa cemas berlebihan terhadap standar kesempurnaan skripsi. Kunci utamanya adalah membagi target besar menjadi langkah-langkah mikro (micro-stepping) yang hanya membutuhkan waktu 15 menit setiap sesinya.'
    },
    {
      id: 2,
      title: 'Mengenal Perbedaan Cemas Wajar vs Overthinking Berlebihan',
      category: 'Kesehatan Mental',
      read_time: '3 min baca',
      date: '28 Agu 2026',
      author: 'Psikolog Dian P., M.Psi.',
      image_url: '/images/hero_counseling.jpg',
      snippet: 'Kecemasan adalah sistem alarm alami tubuh. Namun jika pikiran terus berputar tanpa solusi nyata, kenali teknik grounding 5-4-3-2-1 untuk menenangkan sistem saraf.',
      content: 'Rasa cemas sebelum ujian atau presentasi sidang adalah wajar dan membantu kita tetap waspada. Namun jika kekhawatiran itu terjadi terus menerus tanpa pemicu yang jelas hingga mengganggu pola tidur dan makan, saatnya berkonsultasi dengan konselor atau psikolog profesional.'
    },
    {
      id: 3,
      title: 'Panduan Membuka Diri saat Pertama Kali Menjalani Sesi Konseling',
      category: 'Tips Konseling',
      read_time: '5 min baca',
      date: '20 Agu 2026',
      author: 'Ahmad Fauzi, S.Psi.',
      image_url: '/images/banner1.jpg',
      snippet: 'Merasa gugup sebelum konseling adalah hal yang lumrah. Ruang konseling adalah tempat yang aman tanpa penghakiman untuk membagikan cerita Anda.',
      content: 'Ruang konseling adalah zona aman tanpa penilaian. Anda tidak perlu menyusun cerita secara rapi atau runtut. Cukup sampaikan apa yang paling membebani pikiran Anda saat ini. Konselor kampus kami siap mendengarkan dan membantu Anda menemukan perspektif baru.'
    }
  ];

  // Extract all unique categories
  const categories = ['Semua', ...new Set(articles.map((a) => a.category).filter(Boolean))];

  // Filter articles by search and category
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticle = articles[0];

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
              Pusat Edukasi & Literasi Kesehatan Mental Mahasiswa
            </span>
          </div>
          <div className="flex items-center gap-3 text-emerald-100 text-[10px] sm:text-[11px]">
            <Link to="/" className="text-amber-300 hover:underline flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3 h-3" />
              <span>Kembali ke Beranda Utama</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 px-4 sm:px-8 py-3.5 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#047857] via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-soft-sm ring-2 ring-emerald-500/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black text-darktext tracking-tight flex items-center gap-1.5">
                Ruang BK
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-900 border border-emerald-300/80">
                  UINSSC
                </span>
              </span>
              <span className="text-[11px] text-mutedtext block leading-none">
                Portal Artikel & Edukasi Mental
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors min-h-[40px] flex items-center"
            >
              Masuk Akun
            </Link>
            <Link
              to="/login"
              className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#047857] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-soft-sm flex items-center gap-1.5 transition-all min-h-[40px]"
            >
              <span>Konsultasi Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Header & Search */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-teal-50/30 to-transparent pt-10 pb-8 px-4 sm:px-8 border-b border-emerald-100/50">
        <div className="max-w-6xl mx-auto space-y-5">
          <ScrollReveal direction="up" delay={0.05}>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200/80 text-[11px] font-bold text-emerald-900 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pojok Literasi & Wawasan Psikologi</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Edukasi, Inspirasi, & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800">
                  Kesehatan Mental Mahasiswa
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Kumpulan artikel praktis, wawasan psikologis, dan kiat regulasi emosi yang disusun oleh Tim Konselor Bimbingan Konseling UIN Siber Syekh Nurjati Cirebon.
              </p>
            </div>
          </ScrollReveal>

          {/* Search & Filter Bar */}
          <ScrollReveal direction="up" delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari artikel (misal: skripsi, overthinking, cemas)..."
                  className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs sm:text-sm text-darktext shadow-soft-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-emerald-700 text-white shadow-soft-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. Featured Article Banner (if no search active) */}
      {!searchQuery && selectedCategory === 'Semua' && featuredArticle && (
        <section className="py-8 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal direction="up" delay={0.1}>
              <Link
                to={`/artikel/${featuredArticle.id}`}
                className="group block rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-soft-md hover:shadow-soft-lg transition-all hover:border-emerald-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  <div className="md:col-span-6 relative h-60 md:h-auto overflow-hidden bg-slate-100">
                    <img
                      src={featuredArticle.image_url || '/images/banner1.jpg'}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold backdrop-blur-sm shadow-sm">
                        Artikel Pilihan
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-mutedtext">
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
                          {featuredArticle.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{featuredArticle.read_time}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{featuredArticle.date}</span>
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                        {featuredArticle.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {featuredArticle.snippet}
                      </p>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{featuredArticle.author}</span>
                      </span>

                      <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* 5. Articles Grid List */}
      <section className="py-8 px-4 sm:px-8 flex-1">
        <div className="max-w-6xl mx-auto space-y-6">
          <ScrollReveal direction="up" delay={0.05}>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Semua Artikel & Ulasan</span>
                <span className="text-xs font-normal text-mutedtext">({filteredArticles.length} artikel ditemukan)</span>
              </h3>
            </div>
          </ScrollReveal>

          {filteredArticles.length === 0 ? (
            <ScrollReveal direction="up" delay={0.1}>
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-md mx-auto space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Artikel Tidak Ditemukan</h4>
                <p className="text-xs text-slate-500">
                  Tidak ada artikel yang cocok dengan kata kunci "{searchQuery}". Silakan coba kata kunci lain.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
                >
                  Reset Pencarian
                </button>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredArticles.map((art, idx) => (
                <ScrollReveal
                  key={art.id}
                  direction="up"
                  delay={(idx % 3) * 0.12}
                  className="h-full"
                >
                  <Link
                    to={`/artikel/${art.id}`}
                    className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-soft-xs hover:shadow-soft-md hover:border-emerald-300 transition-all flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Thumbnail Image */}
                      <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                        <img
                          src={art.image_url || '/images/banner1.jpg'}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold text-emerald-900 shadow-sm border border-slate-200/80">
                            {art.category || 'Edukasi'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2 text-[11px] text-mutedtext">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{art.date}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{art.read_time}</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                          {art.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {art.snippet}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium truncate max-w-[160px]">
                        Oleh {art.author}
                      </span>
                      <span className="font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Baca</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Institutional Counseling CTA Box */}
      <section className="py-10 px-4 sm:px-8 bg-gradient-to-r from-[#013b29] via-[#046c4e] to-[#013b29] text-white overflow-hidden">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-amber-300">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-3xl font-black">
              Merasa Mengalami Beban Emosi atau Kebuntuan Serupa?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl mx-auto leading-relaxed">
              Membaca artikel adalah langkah awal yang baik. Namun jika membutuhkan ruang bercerita yang aman dan terarah, konselor kampus UINSSC siap mendampingi Anda secara bebas biaya.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-bold shadow-soft-md transition-all flex items-center gap-2"
              >
                <span>Jadwalkan Konseling Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 sm:px-8 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Ruang BK UIN Siber Syekh Nurjati Cirebon. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4 text-slate-300 font-semibold">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <Link to="/artikel" className="text-emerald-400">Artikel Edukasi</Link>
            <Link to="/login" className="hover:text-white transition-colors">Masuk Akun</Link>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
};

export default ArticlesPage;
