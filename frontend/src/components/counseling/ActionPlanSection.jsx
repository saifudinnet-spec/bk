import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Plus, Tag, Calendar, Edit3, Trash2, ChevronDown, ChevronUp, Sparkles, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import AddActionPlanModal from './AddActionPlanModal';

export const ActionPlanSection = ({
  actionPlans = [],
  caseId,
  sessionId = null,
  canAdd = true,
  isTutor = false,
  onUpdated,
}) => {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState(actionPlans);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Keep items in sync with prop updates
  React.useEffect(() => {
    setItems(actionPlans);
  }, [actionPlans]);

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setUpdatingId(item.id);

    try {
      const res = await api.put(`/action-plans/${item.id}`, {
        status: nextStatus,
      });

      const updated = items.map((it) => (it.id === item.id ? res.data : it));
      setItems(updated);
      showSuccess(nextStatus === 'COMPLETED' ? 'Hebat! Tugas tindak lanjut berhasil diselesaikan.' : 'Status tugas diubah.');
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      showError(err.message || 'Gagal memperbarui status tugas.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (item) => {
    setUpdatingId(item.id);
    try {
      const res = await api.put(`/action-plans/${item.id}`, {
        student_notes: noteInput.trim() || null,
      });

      const updated = items.map((it) => (it.id === item.id ? res.data : it));
      setItems(updated);
      setEditingNoteId(null);
      setNoteInput('');
      showSuccess('Catatan refleksi berhasil disimpan.');
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      showError(err.message || 'Gagal menyimpan catatan refleksi.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus rencana aksi ini?')) return;
    try {
      await api.delete(`/action-plans/${itemId}`);
      const updated = items.filter((it) => it.id !== itemId);
      setItems(updated);
      showSuccess('Rencana aksi berhasil dihapus.');
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      showError(err.message || 'Gagal menghapus rencana aksi.');
    }
  };

  const handleItemAdded = (newItem) => {
    const updated = [newItem, ...items];
    setItems(updated);
    if (onUpdated) onUpdated(updated);
  };

  const completedCount = items.filter((it) => it.status === 'COMPLETED').length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Lembar Tindak Lanjut & Tugas Mandiri ({items.length})</span>
          </h4>
          <p className="text-[11px] text-mutedtext">
            Rencana aksi pemulihan dan latihan mandiri pasca-sesi konseling
          </p>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Aksi</span>
          </button>
        )}
      </div>

      {/* Progress Bar if items exist */}
      {items.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white border border-softborder shadow-soft-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Kemajuan Tindak Lanjut:</span>
            <span className="text-emerald-800 font-bold">
              {completedCount} dari {items.length} selesai ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center space-y-2">
          <p className="text-xs text-mutedtext">
            Belum ada rencana aksi atau tugas mandiri untuk kasus ini.
          </p>
          {canAdd && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Rencana Aksi Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            const isEditingNote = editingNoteId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/60'
                    : 'bg-white border-softborder shadow-soft-xs hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Toggle Checkbox */}
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() => handleToggleStatus(item)}
                    className="mt-0.5 text-emerald-600 hover:scale-110 transition-transform focus:outline-none shrink-0"
                    title={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-slate-700 border border-gray-200">
                        {item.category || 'Self-Care'}
                      </span>
                      {item.due_date && (
                        <span className="text-[10px] font-medium text-mutedtext flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Target: {new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </span>
                      )}
                      {item.tutor && (
                        <span className="text-[10px] text-mutedtext">
                          Oleh: {item.tutor.name}
                        </span>
                      )}
                    </div>

                    <h5 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-darktext'}`}>
                      {item.title}
                    </h5>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}

                    {/* Student Reflection Notes */}
                    {item.student_notes && !isEditingNote && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-950 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[10px] uppercase text-amber-800 tracking-wide font-bold">
                            Catatan Mahasiswa:
                          </strong>
                          <p className="leading-relaxed">{item.student_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Reflection input box */}
                    {isEditingNote && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={2}
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Tuliskan pengalaman atau apa yang dirasakan saat mengerjakan tugas ini..."
                          className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null);
                              setNoteInput('');
                            }}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 text-mutedtext"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNotes(item)}
                            className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-700 text-white"
                          >
                            Simpan Catatan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px]">
                      {!isEditingNote && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setNoteInput(item.student_notes || '');
                          }}
                          className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.student_notes ? 'Edit Catatan' : '+ Beri Catatan Refleksi'}</span>
                        </button>
                      )}

                      {(isTutor || canAdd) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {caseId && (
        <AddActionPlanModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          caseId={caseId}
          sessionId={sessionId}
          onAdded={handleItemAdded}
        />
      )}
    </div>
  );
};

export default ActionPlanSection;
