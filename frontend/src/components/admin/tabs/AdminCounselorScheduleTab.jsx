import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  Clock,
  Users,
  CalendarCheck,
  CheckSquare,
  Square,
  Trash2,
  RefreshCw,
  UserCheck,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
];

const SESSIONS = [
  { value: 'morning', label: 'Pagi', time: '08:00 – 11:00', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  { value: 'afternoon', label: 'Siang', time: '11:00 – 14:00', icon: Sunset, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { value: 'evening', label: 'Sore', time: '14:00 – 18:00', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
];

const METHODS = [
  { value: 'ALL', label: 'Semua Metode' },
  { value: 'ONLINE', label: 'Online (Chat & Zoom)' },
  { value: 'CHAT', label: 'Chat' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'OFFLINE', label: 'Tatap Muka' },
];

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
              {opt.time && <span className={`text-xs ml-1 ${checked ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.time}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CounselorCard({ counselor, onManage, isSelected }) {
  return (
    <div
      onClick={() => onManage(counselor)}
      className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
        isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {counselor.avatar ? (
          <img src={counselor.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <UserCheck size={18} className="text-teal-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 truncate">{counselor.name}</div>
          <div className="text-xs text-slate-500 truncate">{counselor.specialization}</div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${counselor.is_available ? 'bg-green-400' : 'bg-slate-300'}`} title={counselor.is_available ? 'Aktif' : 'Tidak Aktif'} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <div className="text-lg font-bold text-slate-700">{counselor.total_slots || 0}</div>
          <div className="text-xs text-slate-400">Total Slot</div>
        </div>
        <div className="text-center p-1.5 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-700">{counselor.available_count || 0}</div>
          <div className="text-xs text-slate-400">Tersedia</div>
        </div>
        <div className="text-center p-1.5 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{counselor.booked_count || 0}</div>
          <div className="text-xs text-slate-400">Terbook</div>
        </div>
      </div>
      {counselor.booked_sessions?.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <BookOpen size={11} />
            Mahasiswa ter-booking ({counselor.booked_sessions.length}):
          </div>
          {counselor.booked_sessions.slice(0, 3).map((sess) => (
            <div key={sess.id} className="text-xs text-slate-600 flex items-center gap-1.5 bg-slate-50 rounded px-2 py-1">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-indigo-600">
                  {sess.student?.name?.charAt(0) || '?'}
                </span>
              </div>
              <span className="truncate">{sess.student?.name || 'Mahasiswa'}</span>
              <span className="text-slate-400 shrink-0">
                {sess.start_at ? new Date(sess.start_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
              </span>
            </div>
          ))}
          {counselor.booked_sessions.length > 3 && (
            <div className="text-xs text-indigo-500 px-2">+{counselor.booked_sessions.length - 3} lainnya</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCounselorScheduleTab({ showSuccess, showError }) {
  const [counselors, setCounselors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Template form state
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [selectedSessions, setSelectedSessions] = useState(['morning', 'afternoon']);
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [weeksAhead, setWeeksAhead] = useState(4);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const loadCounselors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/counselor-schedules');
      setCounselors(res.data || []);
    } catch {
      showError?.('Gagal memuat data konselor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCounselors(); }, [loadCounselors]);

  const handleManage = (counselor) => {
    setSelectedCounselor(counselor);
    setShowClearConfirm(false);
  };

  const handleApplyTemplate = async (e) => {
    e.preventDefault();
    if (!selectedCounselor) return;
    if (selectedDays.length === 0) { showError?.('Pilih minimal satu hari.'); return; }
    if (selectedSessions.length === 0) { showError?.('Pilih minimal satu sesi.'); return; }

    setIsSubmitting(true);
    try {
      const res = await api.post('/admin/counselor-schedules/template', {
        tutor_id: selectedCounselor.id,
        days: selectedDays,
        sessions: selectedSessions,
        method: selectedMethod,
        weeks_ahead: weeksAhead,
        replace_existing: replaceExisting,
      });
      showSuccess?.(res.message || 'Template jadwal berhasil diterapkan.');
      await loadCounselors();
      // Refresh selected counselor data
      const updated = (await api.get('/admin/counselor-schedules')).data?.find?.((c) => c.id === selectedCounselor.id);
      if (updated) setSelectedCounselor(updated);
    } catch (err) {
      showError?.(err?.response?.data?.message || err.message || 'Gagal menerapkan template jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSlots = async () => {
    if (!selectedCounselor) return;
    setIsClearing(true);
    try {
      const res = await api.delete(`/admin/counselor-schedules/${selectedCounselor.id}/slots`);
      showSuccess?.(res.message || 'Slot jadwal berhasil dihapus.');
      setShowClearConfirm(false);
      await loadCounselors();
      const updated = (await api.get('/admin/counselor-schedules')).data?.find?.((c) => c.id === selectedCounselor.id);
      if (updated) setSelectedCounselor(updated);
    } catch (err) {
      showError?.(err?.response?.data?.message || err.message || 'Gagal menghapus slot jadwal.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="text-teal-600" size={22} />
            Atur Jadwal Konselor
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pilih konselor, tentukan hari &amp; sesi aktif, lalu terapkan template jadwal secara otomatis
          </p>
        </div>
        <button
          onClick={loadCounselors}
          className="flex items-center gap-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Counselor list */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-slate-500" />
              <span className="font-semibold text-slate-700">Daftar Konselor</span>
              <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{counselors.length} konselor</span>
            </div>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block w-7 h-7 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : counselors.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Belum ada konselor terdaftar.</div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {counselors.map((c) => (
                  <CounselorCard
                    key={c.id}
                    counselor={c}
                    onManage={handleManage}
                    isSelected={selectedCounselor?.id === c.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Template form */}
        <div className="lg:col-span-3">
          {!selectedCounselor ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
              <CalendarCheck size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Pilih konselor di sebelah kiri untuk mengatur jadwalnya</p>
              <p className="text-slate-400 text-xs mt-1">Klik salah satu kartu konselor untuk membuka pengaturan</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl">
              {/* Selected counselor header */}
              <div className="flex items-center gap-3 p-5 border-b border-slate-100">
                {selectedCounselor.avatar ? (
                  <img src={selectedCounselor.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <UserCheck size={18} className="text-teal-600" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-800">{selectedCounselor.name}</div>
                  <div className="text-xs text-slate-500">{selectedCounselor.specialization} &middot; {selectedCounselor.email}</div>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                    {selectedCounselor.available_count} tersedia
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    {selectedCounselor.booked_count} terbook
                  </span>
                </div>
              </div>

              {/* Template form */}
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
                  options={SESSIONS}
                  selected={selectedSessions}
                  onChange={setSelectedSessions}
                />

                {/* Method + weeks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Metode Konseling</label>
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                    >
                      {METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
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
                    <div className="text-xs text-amber-600">Hapus slot AVAILABLE yang ada sebelum menambah yang baru (slot BOOKED tidak terpengaruh)</div>
                  </div>
                </label>

                {/* Preview summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                  <div className="font-semibold text-slate-600 mb-2">Pratinjau Template:</div>
                  <div className="text-slate-500 text-xs space-y-1">
                    <div>📅 Hari: {selectedDays.length > 0 ? DAYS.filter(d => selectedDays.includes(d.value)).map(d => d.label).join(', ') : <span className="text-red-400">Belum dipilih</span>}</div>
                    <div>🕐 Sesi: {selectedSessions.length > 0 ? SESSIONS.filter(s => selectedSessions.includes(s.value)).map(s => `${s.label} (${s.time})`).join(', ') : <span className="text-red-400">Belum dipilih</span>}</div>
                    <div>📡 Metode: {METHODS.find(m => m.value === selectedMethod)?.label}</div>
                    <div>📆 Periode: {weeksAhead} minggu ke depan (mulai hari ini)</div>
                    <div className="mt-1 font-medium text-slate-600">
                      Estimasi: <span className="text-teal-600">{selectedDays.length * weeksAhead * selectedSessions.length} slot baru</span>
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
                      Menerapkan...
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
                        Semua slot AVAILABLE (belum dibooking) konselor ini akan dihapus. Slot yang sudah ter-booking tidak terpengaruh.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleClearSlots}
                          disabled={isClearing}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:bg-red-300 flex items-center justify-center gap-1"
                        >
                          {isClearing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                          Ya, Hapus
                        </button>
                        <button
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
          )}
        </div>
      </div>
    </div>
  );
}
