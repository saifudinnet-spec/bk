import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Check, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';

export const TutorSchedule = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [slots, setSlots] = useState([
    { start_time: '09:00', end_time: '10:00' },
    { start_time: '10:30', end_time: '11:30' },
  ]);

  const [existingGroupedSlots, setExistingGroupedSlots] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMySlots = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/tutors/${user.id}/slots`);
      setExistingGroupedSlots(res.grouped_by_date || {});
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  };

  useEffect(() => {
    fetchMySlots();
  }, [user]);

  const handleAddSlot = () => {
    setSlots((prev) => [...prev, { start_time: '13:30', end_time: '14:30' }]);
  };

  const handleRemoveSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index, field, value) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slots.length === 0) {
      showError('Tambahkan minimal 1 slot ketersediaan waktu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/tutors/availability', {
        date,
        slots,
        slot_duration: 60,
      });

      showSuccess('Ketersediaan jadwal berhasil ditambahkan.');
      fetchMySlots();
    } catch (err) {
      showError(err.message || 'Gagal menambahkan jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dates = Object.keys(existingGroupedSlots);

  return (
    <PageTransition className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-darktext">Kelola Ketersediaan Jadwal</h2>
        <p className="text-xs text-mutedtext mt-0.5">
          Atur hari dan jam di mana Anda siap memberikan sesi konseling online
        </p>
      </div>

      {/* Add Slots Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
        <h3 className="text-sm font-bold text-darktext border-b border-gray-100 pb-2">
          Tambah Slot Waktu Baru
        </h3>

        <div>
          <label className="block text-xs font-bold text-darktext mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Pilih Tanggal:</span>
          </label>
          <input
            type="date"
            required
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-darktext flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Jam Ketersediaan Sesi (WIB):</span>
            </label>
            <button
              type="button"
              onClick={handleAddSlot}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jam</span>
            </button>
          </div>

          {slots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="time"
                required
                value={slot.start_time}
                onChange={(e) => handleSlotChange(idx, 'start_time', e.target.value)}
                className="flex-1 h-11 px-3 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs font-bold text-darktext"
              />
              <span className="text-xs text-mutedtext">s/d</span>
              <input
                type="time"
                required
                value={slot.end_time}
                onChange={(e) => handleSlotChange(idx, 'end_time', e.target.value)}
                className="flex-1 h-11 px-3 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs font-bold text-darktext"
              />

              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(idx)}
                  className="w-11 h-11 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          <Check className="w-4 h-4" />
          <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Ketersediaan Jadwal'}</span>
        </button>
      </form>

      {/* Existing Slots Overview */}
      <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
        <h3 className="text-sm font-bold text-darktext border-b border-gray-100 pb-2">
          Jadwal Aktif Anda Mendatang
        </h3>

        {dates.length === 0 ? (
          <p className="text-xs text-mutedtext py-3 text-center">
            Belum ada slot waktu aktif yang tersimpan.
          </p>
        ) : (
          <div className="space-y-3">
            {dates.map((dStr) => {
              const daySlots = existingGroupedSlots[dStr] || [];
              return (
                <div key={dStr} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <span className="text-xs font-bold text-darktext">
                    {new Date(dStr).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((s) => (
                      <span
                        key={s.id}
                        className={`text-xs px-2.5 py-1 rounded-xl font-medium border ${
                          s.status === 'BOOKED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 line-through'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)} WIB ({s.status})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default TutorSchedule;
