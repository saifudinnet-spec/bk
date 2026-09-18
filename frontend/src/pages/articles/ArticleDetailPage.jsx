import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Share2,
  BookmarkCheck,
  Building2,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';

// Helper function to render formatted article text with headings, lists, bold & italic styling
const renderInlineMarkdown = (text) => {
  if (!text) return null;
  // Match bold (**text**) and italic (*text*)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

const renderArticleContent = (rawText) => {
  if (!rawText) return null;
  const normalized = rawText.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  const elements = [];
  let currentList = [];
  let listType = null; // 'ol' or 'ul'
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        elements.push(
          <p key={`p-${elements.length}`} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
            {renderInlineMarkdown(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="space-y-3 my-4 list-none pl-0">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700 leading-relaxed text-xs sm:text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {item.num}
                </span>
                <span className="flex-1">
                  {renderInlineMarkdown(item.text)}
                </span>
              </li>
            ))}
          </ol>
        );
      } else if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-2.5 my-4 list-none pl-0">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-700 leading-relaxed text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span className="flex-1">
                  {renderInlineMarkdown(item.text)}
                </span>
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading 3: ### Heading
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      const headingText = line.replace(/^###\s+/, '');
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-4 sm:h-5 rounded-full bg-emerald-600 inline-block shrink-0" />
          <span>{headingText}</span>
        </h3>
      );
      continue;
    }

    // Heading 2: ## Heading
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      const headingText = line.replace(/^##\s+/, '');
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-lg sm:text-xl font-black text-slate-900 mt-7 mb-3">
          {headingText}
        </h2>
      );
      continue;
    }

    // Numbered list item: e.g. 1. Text
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      flushParagraph();
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      currentList.push({ num: olMatch[1], text: olMatch[2] });
      continue;
    }

    // Bullet list item: e.g. * Text or - Text
    const ulMatch = line.match(/^(\*|-)\s+(.*)/);
    if (ulMatch) {
      flushParagraph();
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      currentList.push({ text: ulMatch[2] });
      continue;
    }

    // Regular line within a paragraph
    if (listType) {
      flushList();
    }
    currentParagraph.push(line);
  }

  flushParagraph();
  flushList();

  return elements;
};

export const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      try {
        const res = await api.get('/landing-content');
        if (isMounted) {
          setContent(res.data || res);
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchContent();
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackArticles = [
    {
      id: 1,
      title: 'Strategi Praktis Mengatasi Prokrastinasi Skripsi & Tugas Akhir',
      category: 'Akademik',
      read_time: '4 min baca',
      date: '02 Sep 2026',
      author: 'Tim Konselor UINSSC',
      image_url: '/images/banner1.webp',
      snippet: 'Rasa jenuh dan kebuntuan tugas akhir adalah respons alami otak saat mengalami kelelahan mental. Kenali teknik micro-stepping untuk mengembalikan motivasi belajar.',
      content: `Banyak mahasiswa tingkat akhir merasa terjebak dalam siklus menunda-nunda bukan karena malas, melainkan karena rasa cemas berlebihan terhadap standar kesempurnaan skripsi.

Ketika kita memandang skripsi sebagai satu buku tebal utuh dengan ratusan halaman, otak kita secara psikologis mempersepsikannya sebagai "ancaman besar". Reaksi defensif alami kita adalah menghindari pekerjaan tersebut dengan mencari distraksi seperti membuka media sosial atau bermain game.

### Mengapa Kita Menunda? (Procrastination vs Laziness)
Penelitian psikologi pendidikan menunjukkan bahwa prokrastinasi adalah masalah regulasi emosi, bukan manajemen waktu semata. Kita menunda karena ingin menghindari perasaan tidak nyaman: takut salah, takut revisi berulang, atau cemas akan respons dosen pembimbing.

### Teknik Praktis Micro-Stepping (Langkah Mikro):
1. **Pecah Target Menjadi Potongan Sangat Kecil:** Alih-alih menulis "Selesaikan Bab 2 hari ini", ubah menjadi "Tulis 2 paragraf pengantar teori hari ini".
2. **Gunakan Prinsip 15 Menit:** Berjanjilah pada diri sendiri untuk hanya duduk dan mengetik selama 15 menit. Jika setelah 15 menit ingin berhenti, Anda boleh berhenti. Seringkali setelah 15 menit berjalan, momentum positif akan terbentuk secara otomatis.
3. **Turunkan Standar Draf Pertama:** Draf pertama dibuat untuk dievaluasi, bukan untuk langsung sempurna. Izinkan diri Anda menulis dengan bebas tanpa self-censorship.
4. **Jadwalkan Konsultasi Rutin:** Jangan menunggu tulisan rapi untuk menemui Dosen Pembimbing Akademik atau Konselor. Mendiskusikan kerangka berpikir justru menghemat waktu berbulan-bulan.`
    },
    {
      id: 2,
      title: 'Mengenal Perbedaan Cemas Wajar vs Overthinking Berlebihan',
      category: 'Kesehatan Mental',
      read_time: '3 min baca',
      date: '28 Agu 2026',
      author: 'Psikolog Dian P., M.Psi.',
      image_url: '/images/banner3.webp',
      snippet: 'Kecemasan adalah sistem alarm alami tubuh. Namun jika pikiran terus berputar tanpa solusi nyata, kenali teknik grounding 5-4-3-2-1 untuk menenangkan sistem saraf.',
      content: `Kecemasan adalah sistem alarm alami tubuh kita yang dirancang untuk menjaga kita tetap aman dan waspada. Namun ketika alarm tersebut terus berbunyi tanpa henti padahal tidak ada bahaya nyata di depan mata, kita mulai memasuki fase overthinking yang menguras energi.

### Cemas Wajar vs Cemas Berlebihan
* **Cemas Wajar:** Membantu kita bersiap menghadapi ujian, memotivasi kita belajar, dan mereda begitu situasi telah selesai dihadapi.
* **Overthinking Berlebihan:** Pikiran berputar pada skenario terburuk ("Bagaimana jika saya gagal total? Bagaimana jika semua orang menertawakan saya?"), memicu gejala fisik seperti jantung berdebar, insomnia, dan asam lambung naik.

### Pertolongan Pertama: Teknik Grounding 5-4-3-2-1
Saat Anda merasa pikiran mulai melayang ke mana-mana, tarik napas dalam-dalam dan sebutkan di sekitar Anda:
* **5 hal** yang bisa Anda lihat dengan mata.
* **4 hal** yang bisa Anda raba/sentuh fisiknya.
* **3 suara** yang bisa Anda dengar saat ini.
* **2 aroma** yang bisa Anda cium.
* **1 rasa** di lidah Anda atau 1 hal baik tentang diri Anda.

Teknik ini memaksa otak rasional Anda kembali ke momen masa kini (*here and now*) dan menurunkan aktivitas sistem saraf simpatik.`
    },
    {
      id: 3,
      title: 'Panduan Membuka Diri saat Pertama Kali Menjalani Sesi Konseling',
      category: 'Tips Konseling',
      read_time: '5 min baca',
      date: '20 Agu 2026',
      author: 'Ahmad Fauzi, S.Psi.',
      image_url: '/images/banner1.webp',
      snippet: 'Merasa gugup sebelum konseling adalah hal yang lumrah. Ruang konseling adalah tempat yang aman tanpa penghakiman untuk membagikan cerita Anda.',
      content: `Banyak mahasiswa yang ragu berkonsultasi karena membayangkan sesi konseling itu seperti "diinterogasi" atau "dihakimi". Faktanya, konseling modern adalah ruang dialog setara yang hangat dan penuh penerimaan.

### Mitos Umum Seputar Bimbingan Konseling:
1. **Mitos:** "Hanya mahasiswa yang bermasalah berat atau sakit jiwa yang ke BK."
   * **Fakta:** Lebih dari 80% mahasiswa datang untuk konsultasi perencanaan karier, manajemen stres skripsi, atau sekadar membutuhkan teman bicara netral yang objektif.
2. **Mitos:** "Cerita saya nanti bocor ke dosen penguji atau fakultas."
   * **Fakta:** Kerahasiaan konseling dilindungi undang-undang dan kode etik psikologi. Tidak ada informasi yang dibagikan tanpa izin tertulis dari Anda.

### Apa yang Harus Dipersiapkan?
Jawabannya: **Tidak ada yang wajib disiapkan.** Anda tidak perlu membuat catatan rapi atau menghafalkan kronologi masalah. Datanglah apa adanya. Konselor kami yang berpengalaman akan membimbing percakapan dengan ritme yang membuat Anda merasa aman dan nyaman.`
    }
  ];

  const backendArticles = (content?.articles?.items && Array.isArray(content.articles.items) && content.articles.items.length > 0)
    ? content.articles.items
    : [];

  const allArticles = backendArticles.length > 0 ? backendArticles : fallbackArticles;

  // Smart resolution for current article
  const fallbackArticle = fallbackArticles.find((a) => String(a.id) === String(id)) || fallbackArticles[0];
  const backendArticle = backendArticles.find((a) => String(a.id) === String(id));

  const currentArticle = backendArticle
    ? {
        ...fallbackArticle,
        ...backendArticle,
        // If backend content is too short (< 200 chars) while fallback has rich content, retain full content
        content: (backendArticle.content && backendArticle.content.trim().length > 200)
          ? backendArticle.content
          : (fallbackArticle?.content || backendArticle.content || backendArticle.snippet || ''),
      }
    : (allArticles.find((a) => String(a.id) === String(id)) || fallbackArticle);

  const relatedArticles = allArticles.filter((a) => String(a.id) !== String(currentArticle?.id)).slice(0, 2);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Tautan artikel berhasil disalin ke clipboard!');
    }
  };

  return (
    <PageTransition className="min-h-screen bg-[#F6F8FA] flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      {/* 1. Institutional Top Bar */}
      <div className="bg-gradient-to-r from-[#013b29] via-[#046c4e] to-[#013b29] text-white py-2 px-4 sm:px-8 border-b border-emerald-500/30 text-[11px] font-medium z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/artikel" className="text-amber-300 hover:underline flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke Semua Artikel</span>
          </Link>
          <span className="text-emerald-200 hidden sm:inline">Pusat Literasi & Edukasi Mental UINSSC</span>
        </div>
      </div>

      {/* 2. Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white border border-emerald-200/80 p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logobk.png" alt="Logo Ruang BK" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-[#164C53] tracking-wider uppercase block">RUANG BK</span>
              <span className="text-[10px] text-mutedtext block leading-none mt-0.5">Artikel Edukasi</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Bagikan Tautan"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>
            <Link
              to="/login"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-soft-xs transition-colors"
            >
              Mulai Konseling
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Main Article Content */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-mutedtext">
          <Link to="/" className="hover:text-emerald-800">Beranda</Link>
          <span>/</span>
          <Link to="/artikel" className="hover:text-emerald-800">Artikel</Link>
          <span>/</span>
          <span className="text-slate-800 truncate font-semibold">{currentArticle.title}</span>
        </div>

        {/* Article Meta Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200">
              {currentArticle.category}
            </span>
            <span className="text-xs text-mutedtext">•</span>
            <span className="text-xs text-mutedtext flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentArticle.read_time}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {currentArticle.title}
          </h1>

          <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 border-b border-slate-200 pb-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <User className="w-4 h-4 text-emerald-700" />
              <span>{currentArticle.author}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Dipublikasikan pada {currentArticle.date}</span>
            </span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-soft-sm bg-slate-100 h-64 sm:h-80 w-full relative">
          <img
            src={currentArticle.image_url || '/images/banner1.webp'}
            alt={currentArticle.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-soft-xs space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Lead Snippet */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-950 font-medium italic leading-relaxed text-xs sm:text-sm">
            "{currentArticle.snippet}"
          </div>

          {/* Formatted Content Paragraphs / HTML Content */}
          <div className="space-y-4 pt-2">
            {/<\/?[a-z][\s\S]*>/i.test(currentArticle.content || '') ? (
              <div
                className="article-html-content text-slate-700 leading-relaxed text-xs sm:text-sm space-y-4 [&>h2]:text-xl [&>h2]:font-black [&>h2]:text-slate-900 [&>h2]:mt-7 [&>h2]:mb-3 [&>h3]:text-base [&>h3]:sm:text-lg [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:flex [&>h3]:items-center [&>h3]:gap-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2.5 [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:bg-emerald-50/50 [&>blockquote]:p-3 [&>blockquote]:rounded-r-xl [&>img]:rounded-2xl [&>img]:my-4 [&>a]:text-emerald-700 [&>a]:underline"
                dangerouslySetInnerHTML={{ __html: currentArticle.content }}
              />
            ) : (
              renderArticleContent(currentArticle.content)
            )}
          </div>
        </div>

        {/* Author Bio Box */}
        <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200 flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shrink-0">
            {currentArticle.author?.charAt(0) || 'K'}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Ditulis oleh: {currentArticle.author}
            </span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Disusun dan ditinjau secara berkala oleh Pusat Bimbingan Konseling UIN Siber Syekh Nurjati Cirebon sebagai rujukan literasi psikologi bagi mahasiswa.
            </p>
          </div>
        </div>

        {/* Direct Consultation Box */}
        <div className="p-6 rounded-3xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white shadow-soft-md space-y-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold text-white">Butuh Pendampingan Langsung?</h3>
          </div>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Jika masalah yang Anda hadapi membutuhkan ruang diskusi khusus, jangan ragu untuk menjadwalkan sesi konseling gratis bersama konselor kami.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-soft-xs transition-all"
            >
              <span>Jadwalkan Konseling Bebas Biaya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Artikel Edukasi Lainnya:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/artikel/${rel.id}`}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-soft-xs space-y-1.5 group"
                >
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {rel.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  <span className="text-[11px] text-mutedtext block">{rel.read_time}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 sm:px-8 text-xs border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Ruang BK UIN Siber Syekh Nurjati Cirebon.</p>
          <div className="flex items-center gap-4 text-slate-300 font-semibold">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <Link to="/artikel" className="text-emerald-400">Semua Artikel</Link>
            <Link to="/login" className="hover:text-white transition-colors">Masuk</Link>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
};

export default ArticleDetailPage;
