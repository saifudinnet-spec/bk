import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Tag,
  Calendar,
  Edit3,
  Trash2,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Award,
  CheckCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import AddActionPlanModal from './AddActionPlanModal';

const getDueDateMeta = (dueDateStr, isCompleted) => {
  if (!dueDateStr) return null;
  const parts = String(dueDateStr).split('T')[0].split('-');
  if (parts.length < 3) return null;

  const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  if (isCompleted) {
    return {
      statusClass: 'bg-slate-100 text-slate-600 border-slate-200',
      label: `Selesai (${formatted})`,
      isOverdue: false,
      isToday: false,
    };
  }

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      statusClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      label: `🔴 Terlewat ${daysAgo} hari (${formatted})`,
      isOverdue: true,
      isToday: false,
    };
  }

  if (diffDays === 0) {
    return {
      statusClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
      label: `🟡 Hari Ini (${formatted})`,
      isOverdue: false,
      isToday: true,
    };
  }

  if (diffDays === 1) {
    return {
      statusClass: 'bg-sky-50 text-sky-800 border-sky-200 font-semibold',
      label: `Target: Besok (${formatted})`,
      isOverdue: false,
      isToday: false,
    };
  }

  return {
    statusClass: 'bg-slate-100 text-slate-700 border-slate-200',
    label: `Target: ${formatted}`,
    isOverdue: false,
    isToday: false,
  };
};

export const ActionPlanSection = ({
  actionPlans = [],
  caseId,
  availableCases = [],
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
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isVerifiedInput, setIsVerifiedInput] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Keep items in sync with prop updates
  React.useEffect(() => {
    setItems(actionPlans);
  }, [actionPlans]);

  const handleSaveCounselorFeedback = async (item) => {
    setUpdatingId(item.id);
    try {
      const res = await api.put(`/action-plans/${item.id}`, {
        counselor_feedback: feedbackInput.trim() || null,
        is_verified: isVerifiedInput,
      });

      const updatedItem = res.data || res;
      const updated = items.map((it) => (it.id === item.id ? { ...it, ...updatedItem } : it));
      setItems(updated);
      setEditingFeedbackId(null);
      setFeedbackInput('');
      setIsVerifiedInput(false);
      showSuccess('Catatan bimbingan dan apresiasi konselor berhasil disimpan.');
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      showError(err.message || 'Gagal menyimpan catatan bimbingan.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (item, nextStatus) => {
    if (item.status === nextStatus) return;
    setUpdatingId(item.id);

    try {
      const res = await api.put(`/action-plans/${item.id}`, {
        status: nextStatus,
      });

      const updatedItem = res.data || res;
      const updated = items.map((it) =>
        it.id === item.id ? { ...it, ...updatedItem, status: nextStatus } : it
      );
      setItems(updated);

      const statusLabels = {
        PENDING: 'Status diubah ke: Belum Dimulai.',
        IN_PROGRESS: 'Semangat! Tugas kini Sedang Berjalan.',
        COMPLETED: 'Hebat! Tugas tindak lanjut berhasil diselesaikan.',
      };
      showSuccess(statusLabels[nextStatus] || 'Status tugas berhasil diperbarui.');
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      showError(err.message || 'Gagal memperbarui status tugas.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = (item) => {
    // 3-step cycle: PENDING -> IN_PROGRESS -> COMPLETED -> PENDING
    let nextStatus = 'COMPLETED';
    if (item.status === 'PENDING') nextStatus = 'IN_PROGRESS';
    else if (item.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else if (item.status === 'COMPLETED') nextStatus = 'PENDING';

    handleStatusChange(item, nextStatus);
  };

  const handleSaveNotes = async (item) => {
    setUpdatingId(item.id);
    try {
      const res = await api.put(`/action-plans/${item.id}`, {
        student_notes: noteInput.trim() || null,
      });

      const updatedItem = res.data || res;
      const updated = items.map((it) => (it.id === item.id ? { ...it, ...updatedItem } : it));
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
  const inProgressCount = items.filter((it) => it.status === 'IN_PROGRESS').length;
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
              {completedCount} selesai &middot; {inProgressCount} berjalan ({progressPercent}%)
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
            const isInProgress = item.status === 'IN_PROGRESS';
            const isEditingNote = editingNoteId === item.id;
            const isEditingFeedback = editingFeedbackId === item.id;
            const dueDateMeta = getDueDateMeta(item.due_date, isCompleted);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/70'
                    : dueDateMeta?.isOverdue
                      ? 'bg-rose-50/20 border-rose-300 shadow-soft-xs hover:border-rose-400'
                      : isInProgress
                        ? 'bg-teal-50/20 border-teal-300 shadow-soft-xs hover:border-teal-400'
                        : 'bg-white border-softborder shadow-soft-xs hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Toggle 3-Step Button */}
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() => handleToggleStatus(item)}
                    className="mt-0.5 hover:scale-110 transition-transform focus:outline-none shrink-0"
                    title={
                      isCompleted
                        ? 'Klik untuk kembalikan ke Belum Dimulai'
                        : isInProgress
                          ? 'Klik untuk selesaikan tugas ini'
                          : 'Klik untuk mulai jalankan tugas'
                    }
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                    ) : isInProgress ? (
                      <div className="w-5 h-5 rounded-full border-2 border-teal-600 bg-teal-50 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 hover:text-teal-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category || 'Self-Care'}
                      </span>

                      {/* Status Selector Dropdown */}
                      <select
                        value={item.status}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none transition-all ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isInProgress
                              ? 'bg-teal-100 text-teal-800 border-teal-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                        title="Ubah status rencana aksi secara langsung"
                      >
                        <option value="PENDING">⏳ Belum Dimulai</option>
                        <option value="IN_PROGRESS">⚡ Sedang Berjalan</option>
                        <option value="COMPLETED">✅ Selesai</option>
                      </select>

                      {/* Due Date Indicator Badge */}
                      {dueDateMeta && (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${dueDateMeta.statusClass}`}>
                          {dueDateMeta.isOverdue ? (
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          ) : (
                            <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                          )}
                          <span>{dueDateMeta.label}</span>
                        </span>
                      )}

                      {/* Verified Badge */}
                      {item.verified_at && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-soft-xs">
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>Terverifikasi</span>
                        </span>
                      )}

                      {item.counseling_case?.case_number && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          #{item.counseling_case.case_number}
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
                          <p className="leading-relaxed whitespace-pre-wrap">{item.student_notes}</p>
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

                    {/* Counselor Guidance & Verification Feedback */}
                    {item.counselor_feedback && !isEditingFeedback && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-[11px] text-teal-950 flex items-start gap-2 shadow-soft-xs">
                        <Award className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                            <strong className="block text-[10px] uppercase text-teal-800 tracking-wide font-bold">
                              Catatan & Apresiasi Konselor:
                            </strong>
                            {item.verified_at && (
                              <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                ✓ Diverifikasi {new Date(item.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{item.counselor_feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Counselor Feedback Input Form */}
                    {isEditingFeedback && (
                      <div className="mt-2.5 p-3 rounded-xl bg-teal-50/60 border border-teal-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-teal-700" />
                            <span>Beri Catatan Bimbingan / Apresiasi Konselor</span>
                          </span>
                          <span className="text-[10px] text-teal-700 font-medium">Tampak oleh konseli</span>
                        </div>

                        <textarea
                          rows={3}
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          placeholder="Tuliskan arahan tindak lanjut, umpan balik terhadap catatan mahasiswa, atau kalimat apresiasi yang menguatkan..."
                          className="w-full p-2.5 rounded-xl border border-teal-200 bg-white text-xs text-darktext focus:ring-2 focus:ring-teal-500/30"
                        />

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isVerifiedInput}
                              onChange={(e) => setIsVerifiedInput(e.target.checked)}
                              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                            />
                            <span>Tandai Terverifikasi (Telah ditinjau konselor)</span>
                          </label>

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFeedbackId(null);
                                setFeedbackInput('');
                                setIsVerifiedInput(false);
                              }}
                              className="px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 text-mutedtext hover:bg-gray-50"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => handleSaveCounselorFeedback(item)}
                              className="px-3 py-1 text-[11px] font-bold rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-sm flex items-center gap-1"
                            >
                              {updatingId === item.id ? 'Menyimpan...' : 'Simpan Bimbingan'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] flex-wrap">
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
                          <span>{item.student_notes ? 'Edit Catatan Mahasiswa' : '+ Beri Catatan Refleksi'}</span>
                        </button>
                      )}

                      {isTutor && !isEditingFeedback && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeedbackId(item.id);
                            setFeedbackInput(item.counselor_feedback || '');
                            setIsVerifiedInput(Boolean(item.verified_at));
                          }}
                          className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{item.counselor_feedback ? 'Edit Catatan Konselor' : '+ Catatan & Verifikasi Konselor'}</span>
                        </button>
                      )}

                      {isTutor && (
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
      {(caseId || availableCases.length > 0) && (
        <AddActionPlanModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          caseId={caseId}
          availableCases={availableCases}
          sessionId={sessionId}
          onAdded={handleItemAdded}
        />
      )}
    </div>
  );
};

export default ActionPlanSection;
