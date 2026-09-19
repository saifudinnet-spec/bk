import React from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Image as ImageIcon,
  Clock,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';

export const AdminArticlesTab = ({
  landingContent,
  articleSearch,
  setArticleSearch,
  articleCategoryFilter,
  setArticleCategoryFilter,
  handleOpenCreateArticle,
  handleOpenEditArticle,
  handleDeleteArticle,
  setPreviewArticle
}) => {
  const articles = landingContent?.articles?.items || [];
  const filteredArticles = articles.filter((art) => {
    const matchSearch =
      (art.title || '').toLowerCase().includes(articleSearch.toLowerCase()) ||
      (art.snippet || '').toLowerCase().includes(articleSearch.toLowerCase());
    const matchCategory =
      articleCategoryFilter === 'all' || art.category === articleCategoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-darktext">Kelola Artikel & Edukasi Psikologi</h3>
            <p className="text-xs text-mutedtext mt-0.5">
              Tulis, edit, tambahkan foto cover, dan publikasikan artikel edukasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateArticle}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft-sm flex items-center gap-2 transition-all min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tulis Artikel Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-softborder shadow-soft-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul atau isi artikel..."
            value={articleSearch}
            onChange={(e) => setArticleSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-[11px] font-bold text-mutedtext">Kategori:</span>
          {['all', 'Tips Akademik', 'Kesehatan Mental', 'Tips Konseling', 'Karier'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setArticleCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                articleCategoryFilter === cat
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-gray-100 text-mutedtext hover:text-darktext hover:bg-gray-200/70'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article List Cards */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-softborder space-y-3">
            <FileText className="w-12 h-12 text-mutedtext/40 mx-auto" />
            <p className="text-sm font-bold text-darktext">Tidak ada artikel yang sesuai</p>
            <p className="text-xs text-mutedtext">
              Klik tombol <strong>"+ Tulis Artikel Baru"</strong> untuk mempublikasikan artikel pertama Anda.
            </p>
          </div>
        ) : (
          filteredArticles.map((art) => (
            <div
              key={art.id}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm hover:border-emerald-300 hover:shadow-soft-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-start gap-4 flex-1">
                {/* Featured Image Thumbnail */}
                <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 border border-softborder shrink-0 relative group/thumb">
                  <img
                    src={art.image_url || '/images/banner1.jpg'}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Meta info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                      {art.category || 'Artikel'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      Terbit
                    </span>
                    <span className="text-[11px] text-mutedtext flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.read_time || '3 min baca'}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-darktext group-hover:text-emerald-800 transition-colors leading-snug line-clamp-1">
                    {art.title}
                  </h4>

                  <p className="text-xs text-mutedtext line-clamp-2 leading-relaxed">
                    {art.snippet || art.content}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-mutedtext font-medium pt-0.5">
                    <span className="font-semibold text-emerald-900">{art.author || 'Konselor UINSSC'}</span>
                    <span>•</span>
                    <span>{art.date}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewArticle(art)}
                  className="px-3 py-1.5 rounded-xl border border-softborder bg-gray-50 hover:bg-gray-100 text-darktext text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Pratinjau Artikel"
                >
                  <Eye className="w-3.5 h-3.5 text-mutedtext" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditArticle(art)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Edit Artikel"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteArticle(art.id)}
                  className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors"
                  title="Hapus Artikel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminArticlesTab;
