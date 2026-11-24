import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

export const CancellationConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Pembatalan',
  description = 'Apakah Anda yakin ingin membatalkan ini? Tindakan ini akan membebaskan slot jadwal bagi pengguna lain.',
  presets = [
    'Jadwal bentrok dengan perkuliahan / kegiatan lain',
    'Kendala kesehatan atau kondisi mendadak',
    'Permasalahan sudah tertangani secara mandiri',
    'Lainnya',
  ],
  confirmButtonText = 'Ya, Batalkan',
  isLoading = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason =
      selectedPreset === 'Lainnya'
        ? customReason.trim() || 'Dibatalkan oleh pengguna (alasan lainnya).'
        : customReason.trim()
        ? `${selectedPreset} - ${customReason.trim()}`
        : selectedPreset;

    onConfirm(finalReason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Badge */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold mb-0.5">Perhatian Pembatalan</p>
            <p>{description}</p>
          </div>
        </div>

        {/* Reason Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Pilih Alasan Pembatalan:
          </label>
          <div className="space-y-2">
            {presets.map((preset) => (
              <label
                key={preset}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedPreset === preset
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="cancellation_reason"
                  value={preset}
                  checked={selectedPreset === preset}
                  onChange={() => setSelectedPreset(preset)}
                  className="accent-emerald-600 w-3.5 h-3.5"
                />
                <span>{preset}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom / Additional Note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Catatan Tambahan (Opsional):
          </label>
          <textarea
            rows={2}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Tuliskan keterangan detail jika diperlukan..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors"
          >
            Kembali
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmButtonText}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CancellationConfirmModal;
