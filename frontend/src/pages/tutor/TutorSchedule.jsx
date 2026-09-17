import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Check,
  Video,
  MessageSquare,
  Building2,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Info,
} from 'lucide-react';
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

  const [defaultMethod, setDefaultMethod] = useState('ALL'); // ALL | ONLINE | CHAT | ZOOM | OFFLINE

  const [slots, setSlots] = useState([
    { start_time: '09:00', end_time: '10:00', method: 'ALL' },
    { start_time: '10:30', end_time: '11:30', method: 'ALL' },
  ]);

  const [existingGroupedSlots, setExistingGroupedSlots] = useState({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingSlotId, setIsDeletingSlotId] = useState(null);
  const [filterMethod, setFilterMethod] = useState('ALL'); // ALL | ONLINE | OFFLINE | BOOKED

  const fetchMySlots = async () => {
    if (!user?.id) return;
    setIsLoadingSlots(true);
    try {
      // Pass include_booked=1 to see both available and booked slots
      const res = await api.get(`/tutors/${user.id}/slots?include_booked=1`);
      setExistingGroupedSlots(res.grouped_by_date || {});
    } catch (err) {
      console.error('Failed to load slots:', err);
      showError('Gagal memuat jadwal tersimpan.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchMySlots();
  }, [user]);

  // Method options definition
  const methodOptions = [
    {
      id: 'ALL',
      name: 'Semua Format (Online & Offline)',
      short: 'Fleksibel (Online/Offline)',
      icon: Globe,
      color: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Mahasiswa bebas memilih sesi Chat, Video Zoom, ataupun Tatap Muka di kampus.',
    },
    {
      id: 'ONLINE',
      name: 'Online Saja (Chat & Zoom)',
      short: 'Daring (Chat / Zoom)',
      icon: Video,
      color: 'teal',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      desc: 'Hanya melayani sesi konsultasi online (Chat atau Video Zoom).',
    },
    {
      id: 'OFFLINE',
      name: 'Offline Saja (Tatap Muka di Kampus)',
      short: 'Tatap Muka di Kampus',
      icon: Building2,
      color: 'purple',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      desc: 'Pertemuan fisik di Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2.',
    },
    {
      id: 'CHAT',
      name: 'Khusus Chat Konseling',
      short: 'Khusus Chat',
      icon: MessageSquare,
      color: 'blue',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      desc: 'Khusus pesan teks interaktif di platform web.',
    },
    {
      id: 'ZOOM',
      name: 'Khusus Video Zoom',
      short: 'Khusus Zoom',
      icon: Video,
      color: 'indigo',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      desc: 'Khusus panggilan video tatap maya via Zoom.',
    },
  ];

  // Set default method and apply to all current slots
  const handleDefaultMethodChange = (newMethod) => {
    setDefaultMethod(newMethod);
    setSlots((prev) => prev.map((s) => ({ ...s, method: newMethod })));
  };

  const handleAddSlot = () => {
    // Propose a reasonable next time slot
    let nextStart = '13:30';
    let nextEnd = '14:30';
    if (slots.length > 0) {
      const lastSlot = slots[slots.length - 1];
      const [h, m] = lastSlot.end_time.split(':').map(Number);
      const startH = (h + 1).toString().padStart(2, '0');
      const endH = (h + 2).toString().padStart(2, '0');
      if (h < 20) {
        nextStart = `${startH}:${m.toString().padStart(2, '0')}`;
        nextEnd = `${endH}:${m.toString().padStart(2, '0')}`;
      }
    }
    setSlots((prev) => [...prev, { start_time: nextStart, end_time: nextEnd, method: defaultMethod }]);
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

  // Quick Preset Handlers
  const applyPreset = (presetType) => {
    if (presetType === 'morning') {
      setSlots([
        { start_time: '09:00', end_time: '10:00', method: defaultMethod },
        { start_time: '10:30', end_time: '11:30', method: defaultMethod },
      ]);
    } else if (presetType === 'afternoon') {
      setSlots([
        { start_time: '13:30', end_time: '14:30', method: defaultMethod },
        { start_time: '15:00', end_time: '16:00', method: defaultMethod },
      ]);
    } else if (presetType === 'full') {
      setSlots([
        { start_time: '09:00', end_time: '10:00', method: defaultMethod },
        { start_time: '10:30', end_time: '11:30', method: defaultMethod },
        { start_time: '13:30', end_time: '14:30', method: defaultMethod },
        { start_time: '15:00', end_time: '16:00', method: defaultMethod },
      ]);
    }
    showSuccess('Template jam berhasil dimuat.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slots.length === 0) {
      showError('Tambahkan minimal 1 slot ketersediaan waktu.');
      return;
    }

    // Validate times
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].start_time >= slots[i].end_time) {
        showError(`Jam selesai pada slot ke-${i + 1} harus lebih besar dari jam mulai.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/tutors/availability', {
        date,
        slots,
        slot_duration: 60,
      });

      showSuccess(`Ketersediaan jadwal (${slots.length} slot) berhasil ditambahkan.`);
      fetchMySlots();
    } catch (err) {
      showError(err.message || 'Gagal menambahkan jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Yakin ingin menghapus slot waktu ini? Mahasiswa tidak akan dapat memilih jam ini lagi.')) {
      return;
    }

    setIsDeletingSlotId(slotId);
    try {
      await api.delete(`/tutors/availability/${slotId}`);
      showSuccess('Slot jadwal berhasil dihapus.');
      fetchMySlots();
    } catch (err) {
      showError(err.message || 'Gagal menghapus slot jadwal.');
    } finally {
      setIsDeletingSlotId(null);
    }
  };

  const dates = Object.keys(existingGroupedSlots);

  // Compute stats
  let totalExistingSlots = 0;
  let totalBookedSlots = 0;
  dates.forEach((d) => {
    const list = existingGroupedSlots[d] || [];
    totalExistingSlots += list.length;
    totalBookedSlots += list.filter((s) => s.status === 'BOOKED').length;
  });

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Flat Header (matches /tutor/cases) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-darktext">Kelola Ketersediaan Jadwal Konseling</h2>
          <p className="text-xs text-mutedtext">
            Atur ketersediaan waktu dan format sesi konseling Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMySlots}
            disabled={isLoadingSlots}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shadow-soft-xs text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Muat Ulang Jadwal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Add Form (Left) & Upcoming Slots (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP: ADD SLOTS FORM (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Buka Slot Waktu Baru</h2>
              <p className="text-xs text-slate-500 font-medium">Tentukan tanggal dan format sesi konseling</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
              {slots.length} Slot Siap Dibuat
            </span>
          </div>

          {/* 1. Pick Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Tanggal Konseling:</span>
            </label>
            <input
              type="date"
              required
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 2. Format / Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-600" />
                <span>Format Konseling Utama (Online / Offline):</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Berlaku untuk slot baru</span>
            </label>

            {/* Quick Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'ALL',
                  label: 'Semua Format',
                  sub: 'Online & Offline',
                  icon: Globe,
                  color: 'emerald',
                },
                {
                  id: 'ONLINE',
                  label: 'Online Saja',
                  sub: 'Chat & Zoom',
                  icon: Video,
                  color: 'teal',
                },
                {
                  id: 'OFFLINE',
                  label: 'Offline Saja',
                  sub: 'Tatap Muka Kampus',
                  icon: Building2,
                  color: 'purple',
                },
              ].map((m) => {
                const isSelected = defaultMethod === m.id;
                const IconComp = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleDefaultMethodChange(m.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconComp
                        className={`w-4 h-4 ${
                          isSelected ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      />
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{m.label}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{m.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Offline location note */}
            {(defaultMethod === 'OFFLINE' || defaultMethod === 'ALL') && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50/60 border border-purple-200/70 text-[11px] text-purple-900">
                <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Lokasi Pertemuan Offline:</strong> Ruang Layanan Bimbingan Konseling, Gedung Pusat Mahasiswa Lt. 2 Kampus.
                </span>
              </div>
            )}
          </div>

          {/* 3. Time Slots List */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Daftar Jam Sesi (WIB):</span>
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-medium hidden sm:inline">Preset:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('morning')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer"
                >
                  Pagi (2)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('afternoon')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer"
                >
                  Siang (2)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer"
                >
                  Penuh (4)
                </button>
              </div>
            </div>

            {/* Slots Rows */}
            <div className="space-y-2.5">
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Slot #{idx + 1}</span>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(idx)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Time start & end */}
                    <div className="sm:col-span-7 flex items-center gap-2">
                      <input
                        type="time"
                        required
                        value={slot.start_time}
                        onChange={(e) => handleSlotChange(idx, 'start_time', e.target.value)}
                        className="flex-1 h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">s/d</span>
                      <input
                        type="time"
                        required
                        value={slot.end_time}
                        onChange={(e) => handleSlotChange(idx, 'end_time', e.target.value)}
                        className="flex-1 h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Per-Slot Method Selector */}
                    <div className="sm:col-span-5">
                      <select
                        value={slot.method || defaultMethod}
                        onChange={(e) => handleSlotChange(idx, 'method', e.target.value)}
                        className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="ALL">🌐 Semua (Online & Offline)</option>
                        <option value="ONLINE">💻 Online (Chat / Zoom)</option>
                        <option value="OFFLINE">🏢 Offline (Tatap Muka)</option>
                        <option value="CHAT">💬 Khusus Chat</option>
                        <option value="ZOOM">📹 Khusus Video Zoom</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSlot}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jam Sesi Lainnya</span>
            </button>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Jadwal...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Simpan Ketersediaan Jadwal</span>
              </>
            )}
          </button>
        </form>

        {/* RIGHT: UPCOMING SLOTS OVERVIEW (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Jadwal Aktif Anda</h2>
              <p className="text-xs text-slate-500 font-medium">Slot waktu yang siap dipesan mahasiswa</p>
            </div>
            <button
              type="button"
              onClick={fetchMySlots}
              disabled={isLoadingSlots}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Segarkan Jadwal"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-lg font-black text-emerald-800 block">{totalExistingSlots}</span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Slot Dibuka</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-lg font-black text-amber-800 block">{totalBookedSlots}</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase">Sudah Dibooking</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'ONLINE', label: 'Online' },
              { id: 'OFFLINE', label: 'Offline' },
              { id: 'BOOKED', label: 'Dibooking' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMethod(f.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterMethod === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List of dates & slots */}
          {isLoadingSlots ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Memuat ketersediaan jadwal...</p>
            </div>
          ) : dates.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Belum Ada Slot Jadwal Aktif</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Gunakan formulir di samping untuk menambahkan tanggal dan jam sesi konseling Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
              {dates.map((dStr) => {
                const daySlots = existingGroupedSlots[dStr] || [];

                // Filter slots
                const filteredDaySlots = daySlots.filter((s) => {
                  if (filterMethod === 'ALL') return true;
                  if (filterMethod === 'BOOKED') return s.status === 'BOOKED';
                  if (filterMethod === 'ONLINE') return ['ALL', 'ONLINE', 'CHAT', 'ZOOM'].includes(s.method);
                  if (filterMethod === 'OFFLINE') return ['ALL', 'OFFLINE'].includes(s.method);
                  return true;
                });

                if (filteredDaySlots.length === 0) return null;

                const dateObj = new Date(dStr);
                const isToday = new Date().toISOString().split('T')[0] === dStr;

                return (
                  <div key={dStr} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          {dateObj.toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                          Hari Ini
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {filteredDaySlots.map((s) => {
                        const isBooked = s.status === 'BOOKED';
                        const method = s.method || 'ALL';

                        return (
                          <div
                            key={s.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              isBooked
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                : 'bg-white border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold text-slate-900">
                                  {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)} WIB
                                </span>

                                {/* Method Badge */}
                                {method === 'ALL' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                                    <Globe className="w-2.5 h-2.5" />
                                    <span>Online & Offline</span>
                                  </span>
                                )}
                                {method === 'ONLINE' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800">
                                    <Video className="w-2.5 h-2.5" />
                                    <span>Online (Chat/Zoom)</span>
                                  </span>
                                )}
                                {method === 'OFFLINE' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800">
                                    <Building2 className="w-2.5 h-2.5" />
                                    <span>Tatap Muka Kampus</span>
                                  </span>
                                )}
                                {method === 'CHAT' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    <span>Chat Saja</span>
                                  </span>
                                )}
                                {method === 'ZOOM' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800">
                                    <Video className="w-2.5 h-2.5" />
                                    <span>Zoom Saja</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {isBooked ? (
                                  <span className="text-amber-800 font-bold">
                                    🔒 Sudah dibooking oleh mahasiswa
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-medium">
                                    🟢 Siap dipilih mahasiswa
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delete Slot Button (only available for unbooked slots) */}
                            {!isBooked && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSlot(s.id)}
                                disabled={isDeletingSlotId === s.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                title="Hapus slot ini"
                              >
                                {isDeletingSlotId === s.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
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
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TutorSchedule;
