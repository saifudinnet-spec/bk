import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Trash2,
  Check,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  MapPin,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  UserCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';
import {
  SESSION_PERIODS,
  SESSION_SLOTS_COUNT,
  formatYmdDate,
  getWibDateStr,
  groupSlotsBySessionPeriod,
} from '../../utils/scheduleHelpers';

const DAYS = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
];

const SESSION_ICONS = {
  morning: { icon: Sun, color: 'text-amber-500' },
  afternoon: { icon: Sunset, color: 'text-orange-500' },
  evening: { icon: Moon, color: 'text-indigo-500' },
};

const METHODS = [
  { value: 'ALL', label: 'Semua Metode' },
  { value: 'ONLINE', label: 'Online (Chat & Zoom)' },
  { value: 'CHAT', label: 'Chat' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'OFFLINE', label: 'Tatap Muka' },
];

function generate30MinSlots(startH, startM, endH, endM) {
  const slots = [];
  let h = startH;
  let m = startM;
  while (h * 60 + m + 30 <= endH * 60 + endM) {
    const nH = Math.floor((h * 60 + m + 30) / 60);
    const nM = (h * 60 + m + 30) % 60;
    slots.push({
      start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      end: `${String(nH).padStart(2, '0')}:${String(nM).padStart(2, '0')}`,
    });
    h = nH;
    m = nM;
  }
  return slots;
}

function CheckboxGroup({ label, options, selected, onChange }) {
  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val];
    onChange(next);
  };
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                checked
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {checked ? <CheckSquare size={15} /> : <Square size={15} />}
              {Icon && <Icon size={14} className={checked ? 'text-white' : opt.color} />}
              <span>{opt.short || opt.label}</span>
              {opt.time && (
                <span className={`text-xs ml-1 ${checked ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {opt.time}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const TutorSchedule = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Form mode ('template' matches Admin layout | 'custom' for single date override)
  const [mode, setMode] = useState('template');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [selectedSessions, setSelectedSessions] = useState(['morning', 'afternoon']);
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [weeksAhead, setWeeksAhead] = useState(4);
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Specific date form
  const [customDate, setCustomDate] = useState(() => getWibDateStr(1));
  const [customStart, setCustomStart] = useState('08:00');
  const [customEnd, setCustomEnd] = useState('12:00');

  const previewCustomSlots = (() => {
    const [sh, sm] = customStart.split(':').map(Number);
    const [eh, em] = customEnd.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) return [];
    return generate30MinSlots(sh, sm, eh, em);
  })();

  // Existing slots state
  const [existingGroupedSlots, setExistingGroupedSlots] = useState({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDeletingSlotId, setIsDeletingSlotId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const sessionOptions = SESSION_PERIODS.map((s) => ({
    ...s,
    icon: SESSION_ICONS[s.value].icon,
    color: SESSION_ICONS[s.value].color,
  }));

  const fetchMySlots = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingSlots(true);
    try {
      const res = await api.get(`/tutors/${user.id}/slots?include_booked=1`);
      setExistingGroupedSlots(res.grouped_by_date || {});
    } catch {
      showError('Gagal memuat jadwal tersimpan.');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchMySlots();
  }, [fetchMySlots]);

  // Apply template via single backend endpoint (mirrors Admin setScheduleTemplate)
  const handleApplyTemplate = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      showError('Pilih minimal 1 hari kerja.');
      return;
    }
    if (selectedSessions.length === 0) {
      showError('Pilih minimal 1 sesi waktu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/tutors/availability/template', {
        days: selectedDays,
        sessions: selectedSessions,
        method: selectedMethod,
        weeks_ahead: weeksAhead,
        replace_existing: replaceExisting,
      });
      showSuccess(res.message || 'Template jadwal berhasil diterapkan.');
      fetchMySlots();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal menerapkan template jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear all unbooked AVAILABLE slots
  const handleClearSlots = async () => {
    setIsClearing(true);
    try {
      const res = await api.delete('/tutors/availability/clear');
      showSuccess(res.message || 'Slot kosong berhasil dihapus.');
      setShowClearConfirm(false);
      fetchMySlots();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal menghapus slot jadwal.');
    } finally {
      setIsClearing(false);
    }
  };

  // Specific date submission
  const handleSubmitCustom = async (e) => {
    e.preventDefault();
    if (previewCustomSlots.length === 0) {
      showError('Rentang jam tidak valid atau kurang dari 30 menit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/tutors/availability', {
        date: customDate,
        slots: previewCustomSlots.map((s) => ({
          start_time: s.start,
          end_time: s.end,
          method: selectedMethod,
        })),
        slot_duration: 30,
      });

      showSuccess(`${previewCustomSlots.length} slot 30 menit berhasil ditambahkan untuk ${customDate}.`);
      fetchMySlots();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal menambahkan slot jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Yakin ingin menghapus slot waktu ini?')) return;
    setIsDeletingSlotId(slotId);
    try {
      await api.delete(`/tutors/availability/${slotId}`);
      showSuccess('Slot jadwal berhasil dihapus.');
      fetchMySlots();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal menghapus slot jadwal.');
    } finally {
      setIsDeletingSlotId(null);
    }
  };

  // Stats
  const todayWib = getWibDateStr(0);
  const dates = Object.keys(existingGroupedSlots).sort();
  let totalSlots = 0;
  let totalBooked = 0;
  dates.forEach((d) => {
    const list = existingGroupedSlots[d] || [];
    totalSlots += list.length;
    totalBooked += list.filter((s) => s.status === 'BOOKED').length;
  });

  const slotsPerSelectedDay = selectedSessions.reduce(
    (sum, s) => sum + (SESSION_SLOTS_COUNT[s] || 0),
    0
  );
  const estimatedNewSlots = selectedDays.length * weeksAhead * slotsPerSelectedDay;

  const getFilteredSlots = (daySlots) => {
    if (filterStatus === 'BOOKED') return daySlots.filter((s) => s.status === 'BOOKED');
    if (filterStatus === 'FREE') return daySlots.filter((s) => s.status === 'AVAILABLE');
    return daySlots;
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Header — mirip tampilan Admin Atur Jadwal Konselor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="text-teal-600" size={22} />
            Atur Jadwal Konselor
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tentukan hari &amp; sesi aktif (Pagi/Siang/Sore), lalu terapkan template slot 30 menit WIB secara otomatis
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMySlots}
          disabled={isLoadingSlots}
          className="flex items-center gap-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={15} className={isLoadingSlots ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Schedule Setup (Admin-style template + Custom date) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {[
              { id: 'template', label: '🗓️ Template Jadwal Mingguan' },
              { id: 'custom', label: '🎯 Tambah Tanggal Spesifik' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'template' ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-soft-xs">
              <div className="flex items-center gap-3 p-5 border-b border-slate-100">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <UserCheck size={18} className="text-teal-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{user?.name || 'Konselor'}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs shrink-0">
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                    {totalSlots - totalBooked} tersedia
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    {totalBooked} terbook
                  </span>
                </div>
              </div>

              <form onSubmit={handleApplyTemplate} className="p-5 space-y-5">
                <div className="text-sm font-bold text-slate-700">🗓️ Template Jadwal Konselor</div>
                {/* Day selector */}
                <CheckboxGroup
                  label="Hari Aktif"
                  options={DAYS}
                  selected={selectedDays}
                  onChange={setSelectedDays}
                />

                {/* Session selector */}
                <CheckboxGroup
                  label="Sesi Waktu"
                  options={sessionOptions}
                  selected={selectedSessions}
                  onChange={setSelectedSessions}
                />

                {/* Method + weeks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                      Metode Konseling
                    </label>
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                    >
                      {METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                      Berlaku <span className="text-teal-600">{weeksAhead} Minggu</span> ke Depan
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={weeksAhead}
                      onChange={(e) => setWeeksAhead(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                      <span>1 mgg</span>
                      <span>12 mgg</span>
                    </div>
                  </div>
                </div>

                {/* Replace existing toggle */}
                <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-amber-800">Timpa slot yang sudah ada</div>
                    <div className="text-xs text-amber-600">
                      Hapus slot AVAILABLE yang ada dalam rentang tanggal sebelum menambah yang baru (slot BOOKED tidak terpengaruh)
                    </div>
                  </div>
                </label>

                {/* Preview summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                  <div className="font-semibold text-slate-600 mb-2">Pratinjau Template:</div>
                  <div className="text-slate-500 text-xs space-y-1">
                    <div>
                      📅 Hari:{' '}
                      {selectedDays.length > 0 ? (
                        DAYS.filter((d) => selectedDays.includes(d.value))
                          .map((d) => d.label)
                          .join(', ')
                      ) : (
                        <span className="text-red-400">Belum dipilih</span>
                      )}
                    </div>
                    <div>
                      🕐 Sesi:{' '}
                      {selectedSessions.length > 0 ? (
                        SESSION_PERIODS.filter((s) => selectedSessions.includes(s.value))
                          .map((s) => `${s.label} (${s.time} · ${s.slotsPerDay} slot)`)
                          .join(', ')
                      ) : (
                        <span className="text-red-400">Belum dipilih</span>
                      )}
                    </div>
                    <div>📡 Metode: {METHODS.find((m) => m.value === selectedMethod)?.label}</div>
                    <div>📆 Periode: {weeksAhead} minggu ke depan (mulai hari ini WIB)</div>
                    <div className="mt-1 font-medium text-slate-600">
                      Estimasi:{' '}
                      <span className="text-teal-600">{estimatedNewSlots} slot (× 30 menit)</span>
                    </div>
                  </div>
                </div>

                {/* Apply button */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedDays.length === 0 || selectedSessions.length === 0}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menerapkan Template...
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={16} />
                      Terapkan Template Jadwal
                    </>
                  )}
                </button>
              </form>

              {/* Danger zone: Clear slots */}
              <div className="px-5 pb-5">
                <div className="border-t border-slate-100 pt-4">
                  {!showClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                      Hapus Semua Slot Kosong (AVAILABLE)
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                        <AlertTriangle size={15} />
                        Konfirmasi Hapus Slot
                      </div>
                      <p className="text-xs text-red-600 mb-3">
                        Semua slot AVAILABLE (belum dibooking) milik Anda pada 12 minggu ke depan akan dihapus. Slot yang sudah dibooking konseli tidak terpengaruh.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleClearSlots}
                          disabled={isClearing}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:bg-red-300 flex items-center justify-center gap-1"
                        >
                          {isClearing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitCustom}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-soft-xs space-y-5"
            >
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">🎯 Tambah Jadwal Tanggal Spesifik</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan rentang jam pada tanggal tertentu — sistem membagi ke slot 30 menit
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" /> Tanggal (WIB)
                </label>
                <input
                  type="date"
                  required
                  value={customDate}
                  min={todayWib}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Mulai (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Selesai (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Metode Konseling
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {previewCustomSlots.length > 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Pratinjau ({previewCustomSlots.length} slot × 30 menit):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewCustomSlots.map((s, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md"
                      >
                        {s.start}–{s.end}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-800 font-semibold">
                    Rentang jam minimal 30 menit setelah jam mulai.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || previewCustomSlots.length === 0}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Simpan {previewCustomSlots.length} Slot Jadwal
                  </>
                )}
              </button>
            </form>
          )}

          {(selectedMethod === 'OFFLINE' || selectedMethod === 'ALL') && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900">
              <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Lokasi Offline:</strong> Ruang Layanan BK, Gedung Pusat Mahasiswa Lt. 2 Kampus.
              </span>
            </div>
          )}
        </div>

        {/* Right: Active Slots Grouped by Date & 3 Sessions */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-slate-200 shadow-soft-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Jadwal Aktif Anda</h3>
              <p className="text-xs text-slate-500">Slot 30 menit dikelompokkan per Pagi / Siang / Sore</p>
            </div>
            <button
              type="button"
              onClick={fetchMySlots}
              disabled={isLoadingSlots}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-lg font-bold text-slate-800 block">{totalSlots}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Slot</span>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 border border-green-200">
              <span className="text-lg font-bold text-green-700 block">{totalSlots - totalBooked}</span>
              <span className="text-[10px] font-semibold text-green-700 uppercase">Tersedia</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-lg font-bold text-blue-700 block">{totalBooked}</span>
              <span className="text-[10px] font-semibold text-blue-700 uppercase">Dibooking</span>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'FREE', label: '🟢 Tersedia' },
              { id: 'BOOKED', label: '🔒 Dibooking' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  filterStatus === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Slot list grouped by date & session */}
          {isLoadingSlots ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Memuat jadwal...</p>
            </div>
          ) : dates.length === 0 ? (
            <div className="py-10 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700 mt-2">Belum Ada Slot Jadwal</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Gunakan template di sebelah kiri untuk membuka jadwal konseling Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {dates.map((dStr) => {
                const daySlots = existingGroupedSlots[dStr] || [];
                const filtered = getFilteredSlots(daySlots);
                if (filtered.length === 0) return null;

                const isToday = dStr === todayWib;
                const availCount = filtered.filter((s) => s.status === 'AVAILABLE').length;
                const bookedCount = filtered.filter((s) => s.status === 'BOOKED').length;
                const byPeriod = groupSlotsBySessionPeriod(filtered);

                return (
                  <div key={dStr} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {formatYmdDate(dStr, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-1">
                        {isToday && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                            Hari Ini
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {availCount} bebas · {bookedCount} booking
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {SESSION_PERIODS.map((period) => {
                        const periodSlots = byPeriod[period.id] || [];
                        if (periodSlots.length === 0) return null;
                        const Icon = SESSION_ICONS[period.id].icon;
                        const iconColor = SESSION_ICONS[period.id].color;

                        return (
                          <div key={period.id} className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                              <Icon size={11} className={iconColor} />
                              <span>{period.label}</span>
                              <span className="text-slate-400">({period.time} WIB)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {periodSlots.map((s) => {
                                const isBooked = s.status === 'BOOKED';
                                return (
                                  <div
                                    key={s.id}
                                    title={`${s.start_time} – ${s.end_time} WIB (${s.method || 'ALL'})`}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold ${
                                      isBooked
                                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span>{s.start_time.substring(0, 5)}</span>
                                    <span className="text-[9px] text-slate-400 font-normal">
                                      {s.method && s.method !== 'ALL' ? s.method : ''}
                                    </span>
                                    {isBooked ? (
                                      <span className="text-[10px]" title="Sudah dibooking">🔒</span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSlot(s.id)}
                                        disabled={isDeletingSlotId === s.id}
                                        className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
                                        title="Hapus slot"
                                      >
                                        {isDeletingSlotId === s.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TutorSchedule;
