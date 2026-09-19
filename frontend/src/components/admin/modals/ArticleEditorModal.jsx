import React from 'react';
import {
  Edit3,
  X,
  Upload,
  FileText,
  Code,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const ArticleEditorModal = ({
  isOpen,
  onClose,
  editingArticle,
  setEditingArticle,
  editorMode,
  setEditorMode,
  onSave,
  showSuccess,
  showError
}) => {
  if (!isOpen || !editingArticle) return null;

  const handleFieldChange = (field, value) => {
    setEditingArticle((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeaturedImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if (showError) showError('Ukuran gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        handleFieldChange('image_url', uploadEvent.target?.result);
        if (showSuccess) showSuccess('Gambar utama artikel berhasil dimuat!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertHtmlTag = (openTag, closeTag = '') => {
    const textarea = document.getElementById('article-content-textarea');
    if (!textarea) {
      setEditingArticle((prev) => ({
        ...prev,
        content: (prev?.content || '') + openTag + closeTag,
      }));
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentText = editingArticle?.content || '';
    const selectedText = currentText.substring(start, end);

    const replacement = openTag + selectedText + closeTag;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);

    setEditingArticle((prev) => ({
      ...prev,
      content: newContent,
    }));

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? start + replacement.length : start + openTag.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-darktext">
                {editingArticle.id && !editingArticle.title ? 'Tulis Artikel Baru' : 'Sunting Artikel'}
              </h3>
              <p className="text-[11px] text-mutedtext">Editor publikasi artikel kesehatan mental</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-mutedtext hover:text-darktext hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Form */}
        <form onSubmit={onSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Judul Artikel */}
          <div>
            <label className="block text-xs font-bold text-darktext mb-1.5">
              Judul Artikel <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 5 Trik Mengatasi Burnout & Prokrastinasi Skripsi..."
              value={editingArticle.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs sm:text-sm font-bold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          {/* Gambar Utama (Featured Image) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <label className="block text-xs font-bold text-darktext flex items-center justify-between">
              <span>Gambar Utama / Foto Cover Artikel</span>
              <span className="text-[11px] font-normal text-mutedtext">Upload dari komputer atau pilih preset</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="URL Gambar (misal: /images/banner1.jpg atau https://...)"
                value={editingArticle.image_url || ''}
                onChange={(e) => handleFieldChange('image_url', e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />

              <label className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preset Gambar Cepat */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-mutedtext font-medium">Pilihan Preset:</span>
              <button
                type="button"
                onClick={() => handleFieldChange('image_url', '/images/banner1.jpg')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  editingArticle.image_url === '/images/banner1.jpg'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-darktext border-softborder hover:border-emerald-300'
                }`}
              >
                Foto Ruang Konseling (banner1.jpg)
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('image_url', '/images/hero_counseling.jpg')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  editingArticle.image_url === '/images/hero_counseling.jpg'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-darktext border-softborder hover:border-emerald-300'
                }`}
              >
                Foto Sesi Privat (hero_counseling.jpg)
              </button>
            </div>

            {/* Live Preview Box */}
            {editingArticle.image_url && (
              <div className="pt-2">
                <div className="w-full h-40 rounded-xl overflow-hidden border border-softborder bg-gray-100 relative group">
                  <img
                    src={editingArticle.image_url}
                    alt="Preview Featured Image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Preview Gambar Utama Artikel
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2 Kolom: Kategori & Waktu Baca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Kategori Artikel</label>
              <input
                type="text"
                placeholder="misal: Tips Akademik, Kesehatan Mental..."
                value={editingArticle.category || ''}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Estimasi Waktu Baca</label>
              <input
                type="text"
                placeholder="misal: 3 min baca"
                value={editingArticle.read_time || ''}
                onChange={(e) => handleFieldChange('read_time', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* 2 Kolom: Penulis & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Penulis</label>
              <input
                type="text"
                placeholder="misal: Tim Konselor UINSSC"
                value={editingArticle.author || ''}
                onChange={(e) => handleFieldChange('author', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Tanggal Publikasi</label>
              <input
                type="text"
                placeholder="misal: 03 Sep 2026"
                value={editingArticle.date || ''}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Ringkasan / Excerpt */}
          <div>
            <label className="block text-xs font-bold text-darktext mb-1">
              Ringkasan Singkat (Excerpt)
            </label>
            <textarea
              rows={2}
              placeholder="Ringkasan pemikat pembaca untuk tampil di kartu artikel..."
              value={editingArticle.snippet || ''}
              onChange={(e) => handleFieldChange('snippet', e.target.value)}
              className="w-full p-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
            />
          </div>

          {/* Isi Lengkap Artikel */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-darktext flex items-center gap-2">
                <span>Isi Lengkap Artikel (Konten Utama)</span>
                {editorMode === 'html' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold border border-amber-300/80">
                    HTML Code Mode
                  </span>
                )}
              </label>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode('text')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    editorMode === 'text'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-mutedtext hover:text-darktext'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Teks / Visual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorMode('html')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    editorMode === 'html'
                      ? 'bg-slate-900 text-emerald-400 shadow-2xs'
                      : 'text-mutedtext hover:text-darktext'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Mode Kode (HTML)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    editorMode === 'preview'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-mutedtext hover:text-darktext'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Quick HTML Toolbar (When in HTML mode) */}
            {editorMode === 'html' && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400 text-[10px] px-1 font-sans">Tag Cepat:</span>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<p>', '</p>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                  title="Paragraf"
                >
                  &lt;p&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<h3>', '</h3>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                  title="Sub-judul (H3)"
                >
                  &lt;h3&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<h2>', '</h2>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                  title="Judul Bab (H2)"
                >
                  &lt;h2&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<strong>', '</strong>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
                  title="Teks Tebal"
                >
                  &lt;strong&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<em>', '</em>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
                  title="Teks Miring"
                >
                  &lt;em&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<ul>\n  <li>', '</li>\n</ul>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
                  title="Daftar Bullet"
                >
                  &lt;ul&gt;&lt;li&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<ol>\n  <li>', '</li>\n</ol>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
                  title="Daftar Nomor"
                >
                  &lt;ol&gt;&lt;li&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<blockquote class="p-3 bg-emerald-50/50 border-l-4 border-emerald-600 rounded-r-xl italic my-3">\n', '\n</blockquote>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 transition-colors"
                  title="Kutipan Khusus"
                >
                  &lt;blockquote&gt;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertHtmlTag('<div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 my-3">\n  ', '\n</div>')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700 transition-colors"
                  title="Kotak Info Callout"
                >
                  &lt;callout&gt;
                </button>
              </div>
            )}

            {/* Editor View */}
            {editorMode === 'preview' ? (
              <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white min-h-[200px] max-h-[350px] overflow-y-auto space-y-3">
                <div className="text-[11px] font-bold text-mutedtext pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span>Pratinjau Halaman Artikel:</span>
                  <span className="text-emerald-700 font-medium">Tampilan Pengunjung</span>
                </div>
                {editingArticle.content?.trim() ? (
                  /<\/?[a-z][\s\S]*>/i.test(editingArticle.content) ? (
                    <div
                      className="article-html-content text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-900 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-600 [&>blockquote]:pl-3 [&>blockquote]:italic"
                      dangerouslySetInnerHTML={{ __html: editingArticle.content }}
                    />
                  ) : (
                    <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {editingArticle.content}
                    </div>
                  )
                ) : (
                  <p className="text-xs text-mutedtext italic py-8 text-center">Belum ada konten artikel yang ditulis.</p>
                )}
              </div>
            ) : editorMode === 'html' ? (
              <div className="space-y-1.5">
                <textarea
                  id="article-content-textarea"
                  rows={8}
                  placeholder="<h3>Sub Judul Artikel</h3>&#10;<p>Tuliskan paragraf pembahasan dengan format HTML di sini...</p>&#10;<ul>&#10;  <li>Poin pertama</li>&#10;  <li>Poin kedua</li>&#10;</ul>"
                  value={editingArticle.content || ''}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-950 text-emerald-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none leading-relaxed selection:bg-emerald-800"
                />
                <div className="flex items-center justify-between text-[11px] text-mutedtext px-1">
                  <span>Mendukung tag HTML: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;blockquote&gt;, &lt;div&gt;</span>
                  <span className="font-mono text-[10px]">{(editingArticle.content || '').length} karakter</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  id="article-content-textarea"
                  rows={7}
                  placeholder="Tuliskan isi pembahasan edukasi psikologi lengkap di sini (bisa gunakan baris baru atau markdown ### untuk sub-judul)..."
                  value={editingArticle.content || ''}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs sm:text-sm text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-mutedtext px-1">
                  <span>Gunakan mode ini untuk teks biasa / markdown, atau beralih ke <strong>Mode Kode (HTML)</strong> untuk format HTML.</span>
                  <span className="font-mono text-[10px]">{(editingArticle.content || '').length} karakter</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-mutedtext hover:text-darktext hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft-sm flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Publikasikan Artikel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleEditorModal;
