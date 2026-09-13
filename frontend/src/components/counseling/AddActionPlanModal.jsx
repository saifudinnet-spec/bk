import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

const ACTION_CATEGORIES = [
  'Self-Care & Relaksasi',
  'Manajemen Waktu & Studi',
  'Komunikasi & Relasi Sosial',
  'Kesehatan Fisik & Pola Tidur',
  'Konsultasi Akademik / DPA',
  'Tindak Lanjut Lainnya',
];

export const AddActionPlanModal = ({ isOpen, onClose, caseId, sessionId = null, onAdded }) => {
  const { showSuccess, showError } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Self-Care & Relaksasi');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showError('Harap isi judul rencana aksi / tugas mandiri.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/action-plans', {
        counseling_case_id: caseId,
        session_id: sessionId || null,
        title: title.trim(),
        description: description.trim() || null,
        category,
        due_date: dueDate || null,
      });

      showSuccess(res.message || 'Rencana aksi berhasil ditambahkan!');
      if (onAdded) onAdded(res.data);
      setTitle('');
      setDescription('');
      setDueDate('');
      onClose();
    } catch (err) {
      showError(err.message || 'Gagal menambahkan rencana aksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Lembar Tindak Lanjut (Action Plan)" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-darktext mb-1">
            Judul Tugas / Rencana Aksi *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cth: Praktikkan pernapasan 4-7-8 sebelum tidur"
            className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-darktext mb-1">
              Kategori Aksi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {ACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-darktext mb-1">
              Target Waktu / Tenggat
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-darktext mb-1">
            Petunjuk & Rincian Tugas (Opsional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Berikan instruksi spesifik, misal: lakukan 5 menit setiap malam sebelum tidur, catat apa yang dirasakan..."
            className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-mutedtext hover:text-darktext text-xs font-semibold"
          >
            Batal
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-soft-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}</span>
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

export default AddActionPlanModal;
