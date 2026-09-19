import React from 'react';
import { X } from 'lucide-react';

export const ArticlePreviewModal = ({ previewArticle, onClose }) => {
  if (!previewArticle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col">
        {previewArticle.image_url && (
          <div className="w-full h-52 sm:h-60 overflow-hidden bg-gray-100 relative shrink-0">
            <img
              src={previewArticle.image_url}
              alt={previewArticle.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors backdrop-blur-xs"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-xs uppercase tracking-wider">
                {previewArticle.category}
              </span>
              <h3 className="text-lg sm:text-xl font-black mt-2 leading-snug drop-shadow-sm">
                {previewArticle.title}
              </h3>
            </div>
          </div>
        )}

        <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 bg-emerald-50/40">
          <div>
            {!previewArticle.image_url && (
              <h3 className="text-lg sm:text-xl font-black text-darktext leading-snug mb-2">
                {previewArticle.title}
              </h3>
            )}
            <div className="flex items-center gap-2 text-xs text-mutedtext">
              <span className="font-semibold text-emerald-800">{previewArticle.author}</span>
              <span>•</span>
              <span>{previewArticle.date}</span>
              <span>•</span>
              <span>{previewArticle.read_time}</span>
            </div>
          </div>

          {!previewArticle.image_url && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-mutedtext hover:text-darktext hover:bg-gray-100 flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-darktext/90 leading-relaxed">
          <p className="font-medium text-emerald-950 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
            {previewArticle.snippet}
          </p>
          <div className="whitespace-pre-line space-y-3">
            {previewArticle.content}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-mutedtext">Pratinjau tampilan artikel untuk mahasiswa</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-bold text-darktext"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreviewModal;
